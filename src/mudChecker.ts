import {Position} from './position';
import * as AST from './ast';
import {findBases} from './findBase';
import {builtins} from './typechecker';

export function mudCheck(nodes: AST.Node[], 
                        registeredNodes: {[key: string]: AST.Node},
                        dependsMap: {[key: string]: string[]}): TypeError[] {
  const errors = nodes.map(n => mudCheckNode(n, nodes, registeredNodes, dependsMap));
  return ([] as TypeError[]).concat(...errors);
}

function mudCheckNode(node: AST.Node, 
                    nodes: AST.Node[], 
                    registeredNodes: {[key: string]: AST.Node},
                    dependsMap: {[key: string]: string[]}): TypeError[] {
  return mudCheckerMap[node.nodeType].mudCheck(node, nodes, registeredNodes, dependsMap);
}

export class TypeError {
  constructor(public message: string, public position: Position) {}
}

export interface MudChecker {
  mudCheck(node: AST.Node, 
          nodes: AST.Node[], 
          registeredNodes: {[key: string]: AST.Node},
          dependsMap: {[key: string]: string[]}): TypeError[];
}

class MudCheckNumber implements MudChecker {
  mudCheck(node: AST.NumberNode): TypeError[] {
    return [];
  }
}

class MudCheckBoolean implements MudChecker {
    mudCheck(node: AST.BooleanNode): TypeError[] {
    return [];
  }
}

class MudCheckBinary implements MudChecker {
    mudCheck(node: AST.BinaryOperationNode, 
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},
            dependsMap: {[key: string]: string[]}): TypeError[] {
        const errors: TypeError[] = mudCheckNode(node.left, nodes, registeredNodes, dependsMap)
        .concat(mudCheckNode(node.right, nodes, registeredNodes, dependsMap));

        // If no type errors, update the output type of this node, based on the outputType of its inputs
        if (node.right?.outputType?.status == 'Def-Undefined' || node.left?.outputType?.status == 'Def-Undefined') {
          node.outputType.status = 'Def-Undefined';
        }
        else if (node.right?.outputType?.status == 'Maybe-Undefined' || node.left?.outputType?.status == 'Maybe-Undefined') {
            node.outputType.status = 'Maybe-Undefined';
        } else {
            node.outputType.status = 'Definitely'
        }

        if (node.operator == '|') {
          let intersection = [];
          let leftAsserts = node.left.outputType.asserts;
          let rightAsserts = node.right.outputType.asserts;
          for (let i = 0; i < leftAsserts.length; i++) {
            if (rightAsserts.find(e => e == leftAsserts[i])) {
              intersection.push(leftAsserts[i]);
            }
          }
          node.outputType.asserts = intersection;
        }
        else {
          // if it's an and, we take all of the asserts
          let leftAsserts = node.left.outputType.asserts;
          let rightAsserts = node.right.outputType.asserts;
          let allAsserts = leftAsserts.concat(rightAsserts);

          node.outputType.asserts = allAsserts;
        }

        return errors;
    }
}

class MudCheckFunction implements MudChecker {
    mudCheck(node: AST.FunctionNode, 
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},
            dependsMap: {[key: string]: string[]}): TypeError[] {
        let errors: TypeError[] = [];

        // First typecheck the argument
        const arg1Errors = mudCheckNode(node.args[0], nodes, registeredNodes, dependsMap);
        errors = errors.concat(arg1Errors);
        if (node.args.length > 1) {
        const arg2Errors = mudCheckNode(node.args[1], nodes, registeredNodes, dependsMap);
        errors = errors.concat(arg2Errors);
        }

        /***** MAYBE-UNDEFINED-NESS *****/
        if (node.name == 'IsDefined') {
          let bases = findBases(node.args[0], dependsMap);
          node.outputType.asserts = node.outputType.asserts.concat(bases);
        }

        const functionName = node.name
        const returnType = builtins[functionName].resultType;

        // only show error if in sink "node"
        if (functionName == 'Sink') {
          // if sink "node" takes in possibly undefined values, warn the author
          // a sink has one argument
          if (node.args[0]?.outputType?.status != 'Definitely') {
              errors.push(new TypeError("User facing content could be undefined.", node.args[0].pos));
          }
        }

        node.outputType.constType = builtins[node.name].constType;  /***** CONSTANT-NESS *****/
        
        if (builtins[functionName].status == "Variable") {
          // this is essentially doing what a constant type would do
          // if the argument is maybe-undefined, then the node is maybe-undefined
          // otherwise, the node is definitely

          if (node.args[0].outputType.constType == 'Constant') {
            const result = evaluate(node);

            // Check if in dependsMap
            // If so, replace ndoe reference in dependsMap with
            dependsMap[node.nodeId] = findBases(node, dependsMap)

            if (result) {
              node.outputType.status = "Definitely";
            } else {
              node.outputType.status = "Def-Undefined";
              errors.push(new TypeError("The result of this operation is undefined.", node.pos));
            }
          } else {
            node.outputType.status = node.args[0]?.outputType?.status;
          }

        }
        else {
          node.outputType.status = builtins[functionName].status;
        }

        return errors;
    }
}

class MudCheckChoose implements MudChecker {
    mudCheck(node: AST.ChooseNode, 
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},
            dependsMap: {[key: string]: string[]}): TypeError[] {
        let errors: TypeError[] = [];

        const predicate = node.case.predicate;
        const consequent = node.case.consequent;
        const otherwise = node.otherwise;

        // add stuff to the assertMap

        // First typecheck the inner nodes
        const predErrors = mudCheckNode(predicate, nodes, registeredNodes, dependsMap);
        const consErrors = mudCheckNode(consequent, nodes, registeredNodes, dependsMap);
        const otherErrors = mudCheckNode(otherwise, nodes, registeredNodes, dependsMap);
        errors = errors.concat(predErrors).concat(consErrors).concat(otherErrors);

        // DEFUALT status = maybe-undefined

        let consDef = false;
        let otherDef = false;

        if (otherwise.outputType.status == 'Definitely') {
          otherDef = true;
        }

        // Check the definitive status of the consequent using the predicates asserts
        // NOTE: only binary operations and IsDefined functions have non-empty assert fields
        consDef = handleCheck(consequent, dependsMap, predicate.outputType.asserts);

        if (consequent?.outputType.status == 'Definitely') {
          consDef = true;
        }

        if (consDef && otherDef) {
          node.outputType.status = 'Definitely';
        }

        return errors;
    }
}

class MudCheckVariable implements MudChecker {
    mudCheck(node: AST.VariableAssignmentNode, 
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},
            dependsMap: {[key: string]: string[]}): TypeError[] {
    let errors: TypeError[] = [];
    // First typecheck the assignment node
    const assignmentErrors = mudCheckNode(node.assignment, nodes, registeredNodes, dependsMap);
    errors = errors.concat(assignmentErrors);

    // Set variable assignment node output type to the same as it's assignment
    node.outputType.status = node.assignment.outputType.status;

    dependsMap[node.nodeId] = findBases(node.assignment, dependsMap); // NEW FUNCTION HERE

    return errors;
  }
}

class MudCheckIdentifier implements MudChecker {
    mudCheck(node: AST.IdentifierNode, 
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},
            dependsMap: {[key: string]: string[]}): TypeError[] {
    let errors: TypeError[] = [];

    // Maybe make assigmentId be valueId?
    let valueNode = registeredNodes[node.assignmentId].assignment;

    // If this assignmentId is not found in the AST, throw an error
    if (valueNode == undefined) {
      errors.push(new TypeError("This variable doesn't have a value", node.pos));
    } else {
      // If we found the assignment node, set the output type of the identifier
      node.outputType.status = valueNode.outputType.status;
    }

    return errors;
  }
}


const mudCheckerMap: Partial<{[K in AST.NodeType]: MudChecker}> = {
  'Number' : new MudCheckNumber(),
  'Boolean' : new MudCheckBoolean(),
  'BinaryOperation' : new MudCheckBinary(),
  'Function' : new MudCheckFunction(),
  'Choose': new MudCheckChoose(),
  'VariableAssignment': new MudCheckVariable(),
  'Identifier': new MudCheckIdentifier()
}

function handleCheck(consequent: AST.Node,
                    dependsMap: {[key: string]: string[]},
                    asserts: string[]): boolean {
  let contained = true;

  if (consequent?.nodeType == 'Choose') {
    // we need to check its bases separately
    let consAsserts = consequent.case.predicate.outputType.asserts;
    let consConsContained = handleCheck(consequent.case.consequent, dependsMap, asserts.concat(consAsserts));
    let consOtherContained = handleCheck(consequent.otherwise, dependsMap, asserts);

    if (!(consConsContained && consOtherContained)) {
      contained = false;
    }

  }
  else {
    let consBases = findBases(consequent, dependsMap);

    for (let i = 0; i < consBases.length; i++) {
      if (!asserts.find(e => e == consBases[i])) {
        contained = false;
      }
    }
  }

  return contained;
}

// This funciton simulates running the body of a miniCL function (like Inverse(x))
function evaluate(node: AST.FunctionNode): boolean {
  if (node.name == "Inverse") {
    if (node.args[0].value == 0) {
      return false;
    }
  }
  if (node.name == "Sqrt") {
    if (node.args[0].value < 0) {
      return false;
    }
  }
  return true;
}
