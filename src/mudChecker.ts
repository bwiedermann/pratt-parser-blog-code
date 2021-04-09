import {Position} from './position';
import * as AST from './ast';
import {findBases} from './findBase';
import {builtins} from './typechecker';
import * as AnalyzedTree from './analyzedTree';

/*
  The function mudCheck manipulates the status of each node's outputType.
  It produces type errors based on that status.
  For example, it will produce a warning when the author tries to use 
  a maybe-undefined node in a Sink function, which is user-facing.
  It also produces a warning when the author tries to compute a 
  definitely undefined operation (e.g. Inverse(0)).
*/

export function mudCheck(nodes: AnalyzedTree.AnalyzedNode[], 
                        registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
                        dependsMap: {[key: string]: string[]}): TypeError[] {
  const errors = nodes.map(n => mudCheckNode(n, nodes, registeredNodes, dependsMap));
  return ([] as TypeError[]).concat(...errors);
}

function mudCheckNode(node: AnalyzedTree.AnalyzedNode, 
                    nodes: AnalyzedTree.AnalyzedNode[], 
                    registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
                    dependsMap: {[key: string]: string[]}): TypeError[] {
  return mudCheckerMap[node.nodeType].mudCheck(node, nodes, registeredNodes, dependsMap);
}

export class TypeError {
  constructor(public message: string, public position: Position) {}
}

export interface MudChecker {
  mudCheck(node: AnalyzedTree.AnalyzedNode, 
          nodes: AnalyzedTree.AnalyzedNode[], 
          registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
          dependsMap: {[key: string]: string[]}): TypeError[];
}

// Numbers are always defined.
class MudCheckNumber implements MudChecker {
  mudCheck(node: AnalyzedTree.NumberNode): TypeError[] {
    return [];
  }
}

// Booleans are always defined.
class MudCheckBoolean implements MudChecker {
    mudCheck(node: AnalyzedTree.BooleanNode): TypeError[] {
    return [];
  }
}

// Binary operations must take into account their operands' statuses when determining their own.
class MudCheckBinary implements MudChecker {
    mudCheck(node: AnalyzedTree.BinaryOperationNode, 
            nodes: AnalyzedTree.AnalyzedNode[], 
            registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
            dependsMap: {[key: string]: string[]}): TypeError[] {
        
        // recursively mud-check the left and right operands
        const errors: TypeError[] = mudCheckNode(node.left, nodes, registeredNodes, dependsMap)
        .concat(mudCheckNode(node.right, nodes, registeredNodes, dependsMap));

        // Update the output type of the node, based on the outputType of its operands
        if (node.right.outputType.status == 'Def-Undefined' || node.left.outputType.status == 'Def-Undefined') {
            node.outputType.status = 'Def-Undefined';
        }
        else if (node.right.outputType.status == 'Maybe-Undefined' || node.left.outputType.status == 'Maybe-Undefined') {
            node.outputType.status = 'Maybe-Undefined';
        } else {
            node.outputType.status = 'Definitely'
        }

        // Each ORed binary operation will assert the intersection of its operands' assertions
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
        // Each ANDed binary operation will assert the union of its operands' assertions
        else {
          let leftAsserts = node.left.outputType.asserts;
          let rightAsserts = node.right.outputType.asserts;
          let allAsserts = leftAsserts.concat(rightAsserts);

          node.outputType.asserts = allAsserts;
        }

        return errors;
    }
}

// The status of a function is determined by its argument and/or its status as defined
// in the builtins dictionary.
class MudCheckFunction implements MudChecker {
    mudCheck(node: AnalyzedTree.FunctionNode, 
            nodes: AnalyzedTree.AnalyzedNode[], 
            registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
            dependsMap: {[key: string]: string[]}): TypeError[] {
        let errors: TypeError[] = [];

        // First mud-check the argument(s)
        const arg1Errors = mudCheckNode(node.args[0], nodes, registeredNodes, dependsMap);
        errors = errors.concat(arg1Errors);
        if (node.args.length > 1) {
          const arg2Errors = mudCheckNode(node.args[1], nodes, registeredNodes, dependsMap);
          errors = errors.concat(arg2Errors);
        }

        // IsDefined is the only function that asserts anything
        // It asserts its argument
        if (node.name == 'IsDefined') {
          let bases = findBases(node.args[0], dependsMap);
          node.outputType.asserts = node.outputType.asserts.concat(bases);
        }

        const functionName = node.name
        
        // If sink "node" takes in possibly undefined values, warn the author
        if (functionName == 'Sink') {
          // a sink has one argument
          if (node.args[0].outputType.status != 'Definitely') {
              errors.push(new TypeError("User facing content could be undefined.", node.args[0].pos));
          }
        }

        // The contstant-ness of a function is whatever is defined in builtins
        node.outputType.constType = builtins[node.name].constType;
        
        // If the function is variable, then its status depends on its argument's status
        if (builtins[functionName].status == "Variable") {
          if (node.args[0].outputType.constType == 'Constant') {
            // If the result is undefined, warn the author
            if (node.value != undefined) {
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

// The status of a choose node is determined by the status of the consequent
// given what the predicate asserts and the status of the otherwise statement
class MudCheckChoose implements MudChecker {
    mudCheck(node: AnalyzedTree.ChooseNode, 
            nodes: AnalyzedTree.AnalyzedNode[], 
            registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
            dependsMap: {[key: string]: string[]}): TypeError[] {
        let errors: TypeError[] = [];

        const predicate = node.case.predicate;
        const consequent = node.case.consequent;
        const otherwise = node.otherwise;

        // First typecheck the inner nodes
        const predErrors = mudCheckNode(predicate, nodes, registeredNodes, dependsMap);
        const consErrors = mudCheckNode(consequent, nodes, registeredNodes, dependsMap);
        const otherErrors = mudCheckNode(otherwise, nodes, registeredNodes, dependsMap);
        errors = errors.concat(predErrors).concat(consErrors).concat(otherErrors);

        // DEFAULT status is maybe-undefined, hence default false values
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

// The status of a variable assignment is determined by the status of its assignment
class MudCheckVariable implements MudChecker {
    mudCheck(node: AnalyzedTree.VariableAssignmentNode, 
            nodes: AnalyzedTree.AnalyzedNode[], 
            registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
            dependsMap: {[key: string]: string[]}): TypeError[] {
    let errors: TypeError[] = [];

    // First mud-check the assignment node
    const assignmentErrors = mudCheckNode(node.assignment, nodes, registeredNodes, dependsMap);
    errors = errors.concat(assignmentErrors);

    // Set variable assignment node output type to the same as its assignment
    node.outputType.status = node.assignment.outputType.status;

    // Update the dependsMap to hold the bases of this new variable
    dependsMap[node.nodeId] = findBases(node.assignment, dependsMap);

    return errors;
  }
}

// The status of an identifier is determined by the status of its assignment,
// given in registered nodes
class MudCheckIdentifier implements MudChecker {
    mudCheck(node: AnalyzedTree.IdentifierNode, 
            nodes: AnalyzedTree.AnalyzedNode[], 
            registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode},
            dependsMap: {[key: string]: string[]}): TypeError[] {
    let errors: TypeError[] = [];

    // Grab the node the identifier was previously assigned to
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

// Given the consequent to a choose node, return true if the given list of asserts
// includes all of the bases of that consequent
function handleCheck(consequent: AnalyzedTree.AnalyzedNode,
                    dependsMap: {[key: string]: string[]},
                    asserts: string[]): boolean {
  let contained = true;

  // If the given consequent is a choose node, recursively check the its consequent and otherwise statements
  if (consequent?.nodeType == 'Choose') {
    // We need to check each statement's bases separately in order to exclude
    // the next predicate's asserts in the next otherwise
    // while including the current asserts in both
    let consAsserts = consequent.case.predicate.outputType.asserts;
    let consConsContained = handleCheck(consequent.case.consequent, dependsMap, asserts.concat(consAsserts));
    let consOtherContained = handleCheck(consequent.otherwise, dependsMap, asserts);

    // If either the next consequent or otherwise statements aren't covered by their asserts,
    // the current consequent is also not covered
    if (!(consConsContained && consOtherContained)) {
      contained = false;
    }

  } else {
    let consBases = findBases(consequent, dependsMap);

    // Ensure that every base is in the given asserts list
    for (let i = 0; i < consBases.length; i++) {
      if (!asserts.find(e => e == consBases[i])) {
        contained = false;
      }
    }
  }

  return contained;
}


