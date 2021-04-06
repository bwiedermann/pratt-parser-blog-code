import {Position} from './position';
import * as AST from './ast';

export function typecheck(nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {
  const errors = nodes.map(n => typecheckNode(n, registeredNodes));
  return ([] as TypeError[]).concat(...errors);
}

function typecheckNode(node: AST.Node, registeredNodes: {[key: string]: AST.Node}): TypeError[] {
  return checkerMap[node.nodeType].check(node, registeredNodes);
}

export class TypeError {
  constructor(public message: string, public position: Position) {}
}

export interface TypeChecker {
  check(node: AST.Node, registeredNodes: {[key: string]: AST.Node}): TypeError[];
}

// A number requires no type checking
class CheckNumber implements TypeChecker {
  check(node: AST.NumberNode): TypeError[] {
    return [];
  }
}

// A boolean requires no type checking
class CheckBoolean implements TypeChecker {
  check(node: AST.BooleanNode): TypeError[] {
    return [];
  }
}

class CheckBinary implements TypeChecker {
  check(node: AST.BinaryOperationNode, registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    const errors: TypeError[] = typecheckNode(node.left, registeredNodes).concat(typecheckNode(node.right, registeredNodes));
    
    // Check if left and right are the same type (both numbers or both booleans)
    if (node.left?.outputType?.valueType != node.right?.outputType?.valueType) {
      errors.push(new TypeError("incompatible types for binary operator", node.pos));
    }
    // Check if incorrect combination of operator and operands
    else if (node.right?.outputType?.valueType == 'boolean' && (node.operator != "|" && node.operator != '&')) {
      errors.push(new TypeError("incompatible operation for boolean operands", node.pos));
    }
    else if (node.right?.outputType?.valueType == 'number' && (node.operator == "|" || node.operator == '&')) {
      errors.push(new TypeError("incompatible operation for number operands", node.pos));
    }

    // Since we've already checked the left and right are the same type
    // we can set the overall value type to the left
    node.outputType.valueType = node.left?.outputType?.valueType;

    return errors;
  }
}

class CheckFunction implements TypeChecker {
  check(node: AST.FunctionNode, registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    let errors: TypeError[] = [];

    // First typecheck the argument(s)
    const arg1Errors = typecheckNode(node.args[0], registeredNodes);
    errors = errors.concat(arg1Errors);
    if (node.args.length > 1) {
      const arg2Errors = typecheckNode(node.args[1], registeredNodes);
      errors = errors.concat(arg2Errors);
      // Both arguments must have the same type
      if (node.args[0]?.outputType?.valueType != node.args[1]?.outputType?.valueType) {
        errors.push(new TypeError("arguments must have same type", node.args[0].pos));
      }
    }

    const functionName = node.name
    const argType = builtins[functionName].inputType;
    // Refer to the builtins dictionary below
    node.outputType.valueType = builtins[functionName].resultType;

    // If this is a builtin function, check it has the correct argument types
    // otherwise throw an error (we don't know what this function is)
    if (argType) {
      // Assume both arguments are the same type (see error produced above)
      if (argType != 'any' && node.args[0]?.outputType?.valueType != argType) {
        errors.push(new TypeError("incompatible argument type for " + functionName, node.pos));
      }
      
    } else {
      errors.push(new TypeError("unknown function", node.pos));
    }    

    return errors;
  }
}

class CheckChoose implements TypeChecker {
  check(node: AST.ChooseNode, registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    let errors: TypeError[] = [];

    const predicate = node.case.predicate;
    const consequent = node.case.consequent;
    const otherwise = node.otherwise;

    // First typecheck the inner nodes
    const predErrors = typecheckNode(predicate, registeredNodes);
    const consErrors = typecheckNode(consequent, registeredNodes);
    const otherErrors = typecheckNode(otherwise, registeredNodes);
    errors = errors.concat(predErrors).concat(consErrors).concat(otherErrors);

    // Check that the return types are the same for both consequent and otherwise
    if (consequent?.outputType?.valueType != otherwise?.outputType?.valueType) {
      errors.push(new TypeError("Return types are not the same for both cases", consequent.pos));
      errors.push(new TypeError("Return types are not the same for both cases", otherwise.pos));
    }

    // Check that the predicate returns a boolean
    if (predicate.outputType.valueType != 'boolean') {
      errors.push(new TypeError("Predicate must return a boolean", predicate.pos));
    }

    // Since we've already checked the consequent and otherwise statements are the same type
    // we can set the overall value type to the consequent
    node.outputType.valueType = consequent?.outputType?.valueType;

    return errors;
  }
}

class CheckVariable implements TypeChecker {
  check(node: AST.VariableAssignmentNode, registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    let errors: TypeError[] = [];

    // First typecheck the assignment node
    const assignmentErrors = typecheckNode(node.assignment, registeredNodes);
    errors = errors.concat(assignmentErrors);

    node.outputType.valueType = node.assignment?.outputType?.valueType;

    return errors;
  }
}

class CheckIdentifier implements TypeChecker {
  check(node: AST.IdentifierNode, registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    let errors: TypeError[] = [];

    // Grab the node the identifier was previously assigned to
    let valueNode = registeredNodes[node.assignmentId].assignment;

    // If this assignmentId is not found in the AST, throw an error
    if (valueNode == undefined) {
      errors.push(new TypeError("This variable doesn't have a value", node.pos));
    }

    node.outputType.valueType = valueNode.outputType.valueType;

    return errors;
  }
}

// Dictionary of builtin functions that gives the necessary information for a given function name 
export const builtins : {[name: string]: {inputType: AST.ValueType, resultType: AST.ValueType, status: string, constType: string} } = {
  "IsDefined": {inputType: 'any', resultType: 'boolean', status: "Definitely", constType: "Constant"},
  "Inverse": {inputType: 'number', resultType: 'number', status: "Variable", constType: "Constant"},
  "InputN": {inputType: 'number', resultType: 'number', status: "Maybe-Undefined", constType: "Non-Constant"},
  "Sink": {inputType: 'any', resultType: 'any', status: "Variable", constType: "Constant"},
  "ParseOrderedPair": {inputType: 'number', resultType: 'pair', status: "Variable", constType: "Constant"},
  "X": {inputType: 'pair', resultType: 'number', status: "Variable", constType: "Constant"},
  "Y": {inputType: 'pair', resultType: 'number', status: "Variable", constType: "Constant"},
  "Not": {inputType: 'boolean', resultType: 'boolean', status: "Definitely", constType: "Constant"},
  "InputB": {inputType: 'boolean', resultType: 'boolean', status: "Maybe-Undefined", constType: "Non-Constant"},
  "Sqrt": {inputType: 'number', resultType: 'number', status: "Variable", constType: "Constant"}
}

const checkerMap: Partial<{[K in AST.NodeType]: TypeChecker}> = {
  'Number' : new CheckNumber(),
  'Boolean' : new CheckBoolean(),
  'BinaryOperation' : new CheckBinary(),
  'Function' : new CheckFunction(),
  'Choose': new CheckChoose(),
  'VariableAssignment': new CheckVariable(),
  'Identifier': new CheckIdentifier()
}