ouimport {Position} from './position';
import * as AST from './ast';
import {equals} from './equals';
import {findBases} from './findBase';

export function mudCheck(nodes: AST.Node[], 
                        registeredNodes: {[key: string]: AST.Node},
                        dependsMap: {[key: string]: string[]},
                        assertMap: string[]): TypeError[] {
  const errors = nodes.map(n => mudCheckNode(n, nodes, registeredNodes, dependsMap, assertMap));
  return ([] as TypeError[]).concat(...errors);
}

function mudCheckNode(node: AST.Node, 
                    nodes: AST.Node[], 
                    registeredNodes: {[key: string]: AST.Node},
                    dependsMap: {[key: string]: string[]},
                    assertMap: string[]): TypeError[] {
  return mudCheckerMap[node.nodeType].mudCheck(node, nodes, registeredNodes, dependsMap, assertMap);
}

export class TypeError {
  constructor(public message: string, public position: Position) {}
}

export interface MudChecker {
  mudCheck(node: AST.Node, 
          nodes: AST.Node[], 
          registeredNodes: {[key: string]: AST.Node},
          dependsMap: {[key: string]: string[]},
          assertMap: string[]): TypeError[];
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
            dependsMap: {[key: string]: string[]},
            assertMap: string[]): TypeError[] {
        const errors: TypeError[] = mudCheckNode(node.left, nodes, registeredNodes, dependsMap, assertMap)
        .concat(mudCheckNode(node.right, nodes, registeredNodes, dependsMap, assertMap));

        // If no type errors, update the output type of this node, based on the outputType of its inputs
        if (node.right?.outputType?.status == 'Maybe-Undefined' || node.left?.outputType?.status == 'Maybe-Undefined') {
            node.outputType = {status: 'Maybe-Undefined',
                              valueType: node.left?.outputType?.valueType };
        } else {
            node.outputType = {status: 'Definitely',
                            valueType: node.left?.outputType?.valueType };
        }

        return errors;
    }
}

class MudCheckFunction implements MudChecker {
    mudCheck(node: AST.FunctionNode, 
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},
            dependsMap: {[key: string]: string[]},
            assertMap: string[]): TypeError[] {
        let errors: TypeError[] = [];

        if (node.name == 'Sink') {
          assertMap = [];
        }
        
        // First typecheck the argument
        const arg1Errors = mudCheckNode(node.args[0], nodes, registeredNodes, dependsMap, assertMap);
        errors = errors.concat(arg1Errors);
        if (node.args.length > 1) {
        const arg2Errors = mudCheckNode(node.args[1], nodes, registeredNodes, dependsMap, assertMap);
        errors = errors.concat(arg2Errors);
        }

        const functionName = node.name
        const argType = builtins[functionName].inputType;
        const returnType = builtins[functionName].resultType;

        // only show error if in sink "node"
        if (functionName == 'Sink') {
        // if sink "node" takes in possibly undefined values, warn the author
        // a sink has one argument
        if (node.args[0]?.outputType?.status == 'Maybe-Undefined') {
            errors.push(new TypeError("User facing content could be undefined.", node.args[0].pos));
        }
        }

        // If no type errors, update the output type of this node, based on the outputType of its argument
        if (node.args[0]?.outputType?.status == 'Maybe-Undefined' || functionName == 'Input') {
            // IsDefined should always output a definitely regardless of argument status
            if (functionName != 'IsDefined') {
            node.outputType.status = 'Maybe-Undefined';
            }
            else {
            node.outputType.status = 'Definitely';
            }
        } else if (node.args.length > 1) {
            if (node.args[1].outputType.status == 'Maybe-Undefined') {
            // Note: IsDefined only has one argument, so we don't need to check for that here
            node.outputType.status = 'Maybe-Undefined';
            } else {
            node.outputType.status = 'Definitely';
            }
        } else {
            node.outputType.status = 'Definitely';
        }

        node.outputType.valueType = returnType;

        return errors;
    }
}

class MudCheckChoose implements MudChecker {
    mudCheck(node: AST.ChooseNode, 
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},
            dependsMap: {[key: string]: string[]},
            assertMap: string[]): TypeError[] {
        let errors: TypeError[] = [];

        const predicate = node.case.predicate;
        const consequent = node.case.consequent;
        const otherwise = node.otherwise;

        // add stuff to the assertMap

        // First typecheck the inner nodes
        const predErrors = mudCheckNode(predicate, nodes, registeredNodes, dependsMap, assertMap);
        const consErrors = mudCheckNode(consequent, nodes, registeredNodes, dependsMap, assertMap);
        const otherErrors = mudCheckNode(otherwise, nodes, registeredNodes, dependsMap, assertMap);
        errors = errors.concat(predErrors).concat(consErrors).concat(otherErrors);

        node.outputType.valueType = consequent.outputType.valueType;

        // DEFUALT status = maybe-undefined

        let consDef = false;
        let otherDef = false;
        let localAsserts: string[] = [];

        if (otherwise.outputType.status == 'Definitely') {
          otherDef = true;
        }

        // consequent in MU and we have a binary predicate
        if (consequent.outputType.status == 'Maybe-Undefined' && predicate.nodeType == 'BinaryOperation') {
          // Cases: both bool *******************************
          //        bool, function (and vice versa) *********
          //        bool, binary op (and vice versa) IN PROGRESS
          //        function, binary op (and vice versa)
          //        both function ***************************
          //        both binary op

          // no need for bool, bool

          consDef = doBinOp(predicate, consequent, dependsMap, assertMap);

        }


        // propagate maybe-undefined type, or change to definitely
        // if the predicate is not a function, we cannot error check its type
        if (consequent.outputType.status == 'Maybe-Undefined' && predicate.nodeType == 'Function') {
          // we can only errorr check with IsDefined function
          // IsDefined has only one argument
          if (predicate.name == 'IsDefined') {
            handleAsserts(predicate, dependsMap, assertMap);
            consDef = handleCheck(consequent, dependsMap, assertMap);
          }
        }

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
            dependsMap: {[key: string]: string[]},
            assertMap: string[]): TypeError[] {
    let errors: TypeError[] = [];
    // First typecheck the assignment node
    const assignmentErrors = mudCheckNode(node.assignment, nodes, registeredNodes, dependsMap, assertMap);
    errors = errors.concat(assignmentErrors);

    // Set variable assignment node output type to the same as it's assignment
    node.outputType.status = node.assignment.outputType.status;
    node.outputType.valueType = node.assignment.outputType.valueType;

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
      node.outputType.valueType = valueNode.outputType.valueType;
    }

    return errors;
  }
}

// Dictionary of builtin functions that maps a function name to the type of its argument
const builtins : {[name: string]: {inputType: AST.ValueType, resultType: AST.ValueType} } = {
  "IsDefined": {inputType: 'any', resultType: 'boolean'},
  "Inverse": {inputType: 'number', resultType: 'number'},
  "Input": {inputType: 'number', resultType: 'number'},
  "Sink": {inputType: 'any', resultType: 'any'},
  "ParseOrderedPair": {inputType: 'number', resultType: 'pair'},
  "X": {inputType: 'pair', resultType: 'number'},
  "Y": {inputType: 'pair', resultType: 'number'}
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

function handleAsserts(predicate: AST.Node,
                      dependsMap: {[key: string]: string[]},
                      assertMap: string[]): void {

    // look up the bases of the predicate
    let predBases = findBases(predicate, dependsMap);
    // set outputType to Definitely if consBases are contained in predBases
    // add to assertMap
    for (let k = 0; k < predBases.length; k++) {
      assertMap.push(predBases[k]);
    }
}

function handleCheck(consequent: AST.Node,
                    dependsMap: {[key: string]: string[]},
                    assertMap: string[]): boolean {

  let consBases = findBases(consequent, dependsMap);

  let contained = true;
    for (let i = 0; i < consBases.length; i++) {
      if (!assertMap.find(e => e == consBases[i])) {
        contained = false;
      }
    }

    return contained;
}

function resolveBF(predicate: AST.Node,
                  consequent: AST.Node,
                  dependsMap: {[key: string]: string[]},
                  assertMap: string[]): boolean {

  // boolean, function
  if (predicate.right.name == 'IsDefined') {
    handleAsserts(predicate.right, dependsMap, assertMap);
    return handleCheck(consequent, dependsMap, assertMap);
  }
  else {
    return false;
  }

}

function resolveFB(predicate: AST.Node,
                  consequent: AST.Node,
                  dependsMap: {[key: string]: string[]},
                  assertMap: string[]): boolean {
  // function, boolean
  if (predicate.left.name == 'IsDefined') {
    handleAsserts(predicate.left, dependsMap, assertMap);
    return handleCheck(consequent, dependsMap, assertMap);
  }
  else {
    return false;
  }
}

function resolveFF(predicate: AST.Node,
                  consequent: AST.Node,
                  dependsMap: {[key: string]: string[]},
                  assertMap: string[]): boolean {
  // function, function
  let consDefLeft = false;
  let consDefRight = false;
  let consDefBoth = false;
  let localAsserts: string[] = [];

  if (predicate.left.name == 'IsDefined') {
    handleAsserts(predicate.left, dependsMap, localAsserts);
    consDefLeft = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefLeft) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.right.name == 'IsDefined') {
    handleAsserts(predicate.right, dependsMap, localAsserts);
    consDefRight = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefRight) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.left.name == 'IsDefined' && predicate.right.name == 'IsDefined' && predicate.operator == '&') {
    handleAsserts(predicate.left, dependsMap, localAsserts);
    handleAsserts(predicate.right, dependsMap, localAsserts);
    consDefBoth = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefBoth) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.operator == '&') {
    return consDefLeft || consDefRight || consDefBoth;
  }
  else if (predicate.operator == '|') {
    return consDefLeft && consDefRight;
  }
  else {
    return false;
  }
}

function resolveBBO(predicate: AST.Node,
  consequent: AST.Node,
  dependsMap: {[key: string]: string[]},
  assertMap: string[]): boolean {
  // boolean, binary operation
  // recurse on the right
  let consDefRight = doBinOp(predicate.right, consequent, dependsMap, assertMap);
  if (predicate.left.value == false && predicate.operator == '|') {
    return consDefRight;
  }
  if (predicate.left.value == true && predicate.operator == '&') {
    return consDefRight;
  }
  else {
    // this may change to true
    return false;
  }

}

function resolveBOB(predicate: AST.Node,
  consequent: AST.Node,
  dependsMap: {[key: string]: string[]},
  assertMap: string[]): boolean {
  // binary operation, boolean
  let consDefLeft = doBinOp(predicate.left, consequent, dependsMap, assertMap);
  if (predicate.right.value == false && predicate.operator == '|') {
    return consDefLeft;
  }
  if (predicate.right.value == true && predicate.operator == '&') {
    return consDefLeft;
  }
  else {
    // this may change to true
    return false;
  }
}

function resolveBOF(predicate: AST.Node,
  consequent: AST.Node,
  dependsMap: {[key: string]: string[]},
  assertMap: string[]): boolean {
  // binary operation, function
  // recurse on the left with local asserts
  let consDefLeft = false;
  let consDefRight = false;
  let consDefBoth = false;
  let localAsserts: string[] = [];

  consDefLeft = doBinOp(predicate.left, consequent, dependsMap, localAsserts);
  if (consDefLeft) {
    assertMap = assertMap.concat(localAsserts);
  }
  localAsserts = [];

  if (predicate.right.name == 'IsDefined') {
    handleAsserts(predicate.right, dependsMap, localAsserts);
    consDefRight = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefRight) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.right.name == 'IsDefined' && predicate.operator == '&') {
    let temp = doBinOp(predicate.left, consequent, dependsMap, localAsserts);
    handleAsserts(predicate.right, dependsMap, localAsserts);
    consDefBoth = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefBoth) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.operator == '&') {
    return consDefLeft || consDefRight || consDefBoth;
  }
  else if (predicate.operator == '|') {
    return consDefLeft && consDefRight;
  }
  else {
    return false;
  }
  
}

function resolveFBO(predicate: AST.Node,
  consequent: AST.Node,
  dependsMap: {[key: string]: string[]},
  assertMap: string[]): boolean {
  // function, binary operation
  // recurse on the left with local asserts
  let consDefLeft = false;
  let consDefRight = false;
  let consDefBoth = false;
  let localAsserts: string[] = [];

  consDefRight = doBinOp(predicate.right, consequent, dependsMap, localAsserts);
  if (consDefRight) {
    assertMap = assertMap.concat(localAsserts);
  }
  localAsserts = [];

  if (predicate.left.name == 'IsDefined') {
    handleAsserts(predicate.left, dependsMap, localAsserts);
    consDefLeft = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefLeft) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.left.name == 'IsDefined' && predicate.operator == '&') {
    let temp = doBinOp(predicate.right, consequent, dependsMap, localAsserts);
    handleAsserts(predicate.left, dependsMap, localAsserts);
    consDefBoth = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefBoth) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.operator == '&') {
    return consDefLeft || consDefRight || consDefBoth;
  }
  else if (predicate.operator == '|') {
    return consDefLeft && consDefRight;
  }
  else {
    return false;
  }
}

function resolveBOBO(predicate: AST.Node,
  consequent: AST.Node,
  dependsMap: {[key: string]: string[]},
  assertMap: string[]): boolean {
  // binary operation, binary operation
  let consDefLeft = false;
  let consDefRight = false;
  let consDefBoth = false;
  let localAsserts: string[] = [];

  consDefRight = doBinOp(predicate.right, consequent, dependsMap, localAsserts);
  if (consDefRight) {
    assertMap = assertMap.concat(localAsserts);
  }
  localAsserts = [];

  consDefLeft = doBinOp(predicate.left, consequent, dependsMap, localAsserts);
  if (consDefLeft) {
    assertMap = assertMap.concat(localAsserts);
  }
  localAsserts = [];

  if (predicate.operator == '&') {
    let temp = doBinOp(predicate.right, consequent, dependsMap, localAsserts);
    let temp2 = doBinOp(predicate.left, consequent, dependsMap, localAsserts);
    consDefBoth = handleCheck(consequent, dependsMap, localAsserts);
    if (consDefBoth) {
      assertMap = assertMap.concat(localAsserts);
    }
    localAsserts = [];
  }

  if (predicate.operator == '&') {
    return consDefLeft || consDefRight || consDefBoth;
  }
  else if (predicate.operator == '|') {
    return consDefLeft && consDefRight;
  }
  else {
    return false;
  }
}

function doBinOp(predicate: AST.Node,
  consequent: AST.Node,
  dependsMap: {[key: string]: string[]},
  assertMap: string[]): boolean {
  let consDef = false;
  // function, boolean
  if (predicate.left.nodeType == 'Function' && predicate.right.nodeType == 'Boolean') {
    consDef = resolveFB(predicate, consequent, dependsMap, assertMap);
  }

  // boolean, function
  if (predicate.left.nodeType == 'Boolean' && predicate.right.nodeType == 'Function') {
    consDef = resolveBF(predicate, consequent, dependsMap, assertMap);
  }

  // function, function
  if (predicate.left.nodeType == 'Function' && predicate.right.nodeType == 'Function') {
    consDef = resolveFF(predicate, consequent, dependsMap, assertMap);

  }

  // bool, binary op
  if (predicate.left.nodeType == 'Boolean' && predicate.right.nodeType == 'BinaryOperation') {
    consDef = resolveBBO(predicate, consequent, dependsMap, assertMap);
  }

  // binary op, bool
  if (predicate.left.nodeType == 'BinaryOperation' && predicate.right.nodeType == 'Boolean') {
    consDef = resolveBOB(predicate, consequent, dependsMap, assertMap);
  }

  // function, binary op
  if (predicate.left.nodeType == 'Function' && predicate.right.nodeType == 'BinaryOperation') {
    consDef = resolveFBO(predicate, consequent, dependsMap, assertMap);
  }

  // binary op, function
  if (predicate.left.nodeType == 'BinaryOperation' && predicate.right.nodeType == 'Function') {
    consDef = resolveBOF(predicate, consequent, dependsMap, assertMap);
  }

  // binary op, binary op
  if (predicate.left.nodeType == 'BinaryOperation' && predicate.right.nodeType == 'BinaryOperation') {
    consDef = resolveBOBO(predicate, consequent, dependsMap, assertMap);
  }

  return consDef;
}