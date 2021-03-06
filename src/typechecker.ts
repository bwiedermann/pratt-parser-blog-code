import {Position} from './position';
import * as AST from './ast';
import * as AnalyzedTree from './analyzedTree';
import {constCheckNode} from './constantChecker';

export function typecheck(nodes: AST.Node[], registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
                          {errors: TypeError[], aTree: AnalyzedTree.AnalyzedNode[]} {
  const aNodes: AnalyzedTree.AnalyzedNode[] = [];
  let totalErrors: TypeError[] = [];

  nodes.forEach(node => {
    let {errors, aNode} = typecheckNode(node, registeredNodes);
    if (errors.length == 0) {
      constCheckNode(aNode, registeredNodes);
    }
    aNodes.push(aNode);
    totalErrors = totalErrors.concat(errors);
  });

  return {errors: totalErrors, aTree: aNodes};
}

function typecheckNode(node: AST.Node, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
                        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
  return checkerMap[node.nodeType].check(node, registeredNodes);
}

export class TypeError {
  constructor(public message: string, public position: Position) {}
}

export interface TypeChecker {
  check(node: AST.Node, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode};
}

// A number requires no type checking
class CheckNumber implements TypeChecker {
  check(node: AST.NumberNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
    let newNode = {
      nodeType: node.nodeType,
      value: node.value,
      outputType: {
        status: 'Definitely' as 'Definitely',
        valueType: node.valueType,
        asserts: [],
        constType: 'Constant' as 'Constant'
      },
      pos: node.pos,
      nodeId: node.nodeId
    };

    registeredNodes[newNode.nodeId] = newNode;

    return {errors: [], aNode: newNode};
  }
}

// A boolean requires no type checking
class CheckBoolean implements TypeChecker {
  check(node: AST.BooleanNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
    let newNode = {
      nodeType: node.nodeType,
      value: node.value,
      outputType: {
        status: 'Definitely' as 'Definitely',
        valueType: node.valueType,
        asserts: [],
        constType: 'Constant' as 'Constant'
      },
      pos: node.pos,
      nodeId: node.nodeId
    };

    registeredNodes[newNode.nodeId] = newNode;

    return {errors: [], aNode: newNode};
  }
}

class CheckBinary implements TypeChecker {
  check(node: AST.BinaryOperationNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
    const { errors: lErrors, aNode: lANode } = typecheckNode(node.left, registeredNodes);
    const { errors: rErrors, aNode: rANode } = typecheckNode(node.right, registeredNodes);
    const totalErrors = lErrors.concat(rErrors);
    
    // Check if left and right are the same type (both numbers or both booleans)
    if (lANode.outputType.valueType != rANode.outputType.valueType) {
      totalErrors.push(new TypeError("incompatible types for binary operator", node.pos));
    }
    // Check if incorrect combination of operator and operands
    else if (rANode.outputType.valueType == 'boolean' && (node.operator != "|" && node.operator != '&')) {
      totalErrors.push(new TypeError("incompatible operation for boolean operands", node.pos));
    }
    else if (rANode.outputType.valueType == 'number' && (node.operator == "|" || node.operator == '&')) {
      totalErrors.push(new TypeError("incompatible operation for number operands", node.pos));
    }


    let newNode = {
      nodeType: node.nodeType,
      operator: node.operator,
      left: lANode,
      right: rANode,
      outputType: {
        status: 'Maybe-Undefined' as 'Maybe-Undefined',
        // Since we've already checked the left and right are the same type
        // we can set the overall value type to the left
        valueType: lANode.outputType.valueType,
        asserts: [],
        constType: 'Constant' as 'Constant'
      },
      pos: node.pos,
      nodeId: node.nodeId,
      value: undefined
    };

    registeredNodes[newNode.nodeId] = newNode;


    return {errors: [], aNode: newNode};
  }
}

class CheckFunction implements TypeChecker {
  check(node: AST.FunctionNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
    let totalErrors: TypeError[] = [];
    let aArgs: AnalyzedTree.AnalyzedNode[] = [];

    const functionName = node.name
    const argType = builtins[functionName].inputType;

    // The Input functions do not have arguments so we don't type check them
    if (functionName != "InputN" && functionName != "InputB") {
      // First typecheck the argument(s)
      const { errors: arg1Errors, aNode: arg1Node } = typecheckNode(node.args[0], registeredNodes);
      totalErrors = totalErrors.concat(arg1Errors);
      aArgs.push(arg1Node);
      if (node.args.length > 1) {
        const { errors: arg2Errors, aNode: arg2Node } = typecheckNode(node.args[1], registeredNodes);
        totalErrors = totalErrors.concat(arg2Errors);
        aArgs.push(arg2Node);
        // Both arguments must have the same type
        if (aArgs[0].outputType.valueType != aArgs[1].outputType.valueType) {
          totalErrors.push(new TypeError("arguments must have same type", node.args[0].pos));
        }
      }
    }

    let newNode = {
      nodeType: 'Function' as 'Function',
      name: functionName,
      args: aArgs,
      outputType: {
        status: 'Maybe-Undefined' as 'Maybe-Undefined',
        valueType: builtins[functionName].resultType, // Refer to the builtins dictionary below
        asserts: [],
        constType: 'Constant' as 'Constant'
      },
      pos: node.pos,
      nodeId: node.nodeId,
      value: undefined
    };

    // Assume both arguments are the same type (see error produced above)
    if (argType != 'any' && newNode.args[0].outputType.valueType != argType) {
      totalErrors.push(new TypeError("incompatible argument type for " + functionName, node.pos));
    }

    registeredNodes[newNode.nodeId] = newNode;

    return {errors: totalErrors, aNode: newNode};
  }
}

class CheckChoose implements TypeChecker {
  check(node: AST.ChooseNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
    let totalErrors: TypeError[] = [];

    const predicate = node.case.predicate;
    const consequent = node.case.consequent;
    const otherwise = node.otherwise;

    // First typecheck the inner nodes
    const { errors: predErrors, aNode: predNode } = typecheckNode(predicate, registeredNodes);
    const { errors: consErrors, aNode: consNode } = typecheckNode(consequent, registeredNodes);
    const { errors: otherErrors, aNode: otherNode } = typecheckNode(otherwise, registeredNodes);
    totalErrors = totalErrors.concat(predErrors).concat(consErrors).concat(otherErrors);

    // Check that the return types are the same for both consequent and otherwise
    if (consNode.outputType.valueType != otherNode.outputType.valueType) {
      totalErrors.push(new TypeError("Return types are not the same for both cases", consequent.pos));
      totalErrors.push(new TypeError("Return types are not the same for both cases", otherwise.pos));
    }

    // Check that the predicate returns a boolean
    if (predNode.outputType.valueType != 'boolean') {
      totalErrors.push(new TypeError("Predicate must return a boolean", predicate.pos));
    }

    let newNode = {
      nodeType: 'Choose' as 'Choose',
      case: { predicate: predNode, consequent: consNode },
      otherwise: otherNode,
      outputType: {
        status: 'Maybe-Undefined' as 'Maybe-Undefined',
        // Since we've already checked the consequent and otherwise statements are the same type
        // we can set the overall value type to the consequent
        valueType: consNode.outputType.valueType,
        asserts: [],
        constType: 'Constant' as 'Constant'
      },
      pos: node.pos,
      nodeId: node.nodeId,
      value: undefined
    };

    registeredNodes[newNode.nodeId] = newNode;

    return {errors: totalErrors, aNode: newNode};
  }
}

class CheckVariable implements TypeChecker {
  check(node: AST.VariableAssignmentNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
    let totalErrors: TypeError[] = [];

    // First typecheck the assignment node
    const { errors: assignmentErrors, aNode: assignmentNode } = typecheckNode(node.assignment, registeredNodes);
    totalErrors = totalErrors.concat(assignmentErrors);

    let newNode = {
      nodeType: 'VariableAssignment' as 'VariableAssignment',
      name: node.name,
      assignment: assignmentNode,
      outputType: {
        status: 'Maybe-Undefined' as 'Maybe-Undefined',
        valueType: assignmentNode.outputType.valueType,
        asserts: [],
        constType: 'Constant' as 'Constant'
      },
      pos: node.pos,
      nodeId: node.nodeId,
      value: undefined
    };

    registeredNodes[newNode.nodeId] = newNode;

    return {errors: totalErrors, aNode: newNode};
  }
}

class CheckIdentifier implements TypeChecker {
  check(node: AST.IdentifierNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}):
        {errors: TypeError[], aNode: AnalyzedTree.AnalyzedNode} {
    let totalErrors: TypeError[] = [];

    // Grab the node the identifier was previously assigned to
    let valueNode = registeredNodes[node.assignmentId].assignment;

    // If this assignmentId is not found in the AST, throw an error
    if (valueNode == undefined) {
      totalErrors.push(new TypeError("This variable doesn't have a value", node.pos));
    }

    let newNode = {
      nodeType: 'Identifier' as 'Identifier',
      name: node.name,
      assignmentId: node.assignmentId,
      outputType: {
        status: 'Maybe-Undefined' as 'Maybe-Undefined',
        valueType: valueNode.outputType.valueType, // Shouldn't be problem anymore
        asserts: [],
        constType: 'Constant' as 'Constant'
      },
      pos: node.pos,
      nodeId: node.nodeId,
      value: undefined
    };

    registeredNodes[newNode.nodeId] = newNode;

    return {errors: totalErrors, aNode: newNode};
  }
}

// Dictionary of builtin functions that gives the necessary information for a given function name 
export const builtins : {[name: string]: {inputType: AST.ValueType, resultType: AST.ValueType, status: string, constType: string} } = {
  "IsDefined": {inputType: 'any', resultType: 'boolean', status: "Definitely", constType: "Constant"},
  "Inverse": {inputType: 'number', resultType: 'number', status: "Variable", constType: "Constant"},
  "InputN": {inputType: 'any', resultType: 'number', status: "Maybe-Undefined", constType: "Non-Constant"},
  "Sink": {inputType: 'any', resultType: 'any', status: "Maybe-Undefined", constType: "Constant"},
  "ParseOrderedPair": {inputType: 'number', resultType: 'pair', status: "Variable", constType: "Constant"},
  "X": {inputType: 'pair', resultType: 'number', status: "Variable", constType: "Constant"},
  "Y": {inputType: 'pair', resultType: 'number', status: "Variable", constType: "Constant"},
  "Not": {inputType: 'boolean', resultType: 'boolean', status: "Definitely", constType: "Constant"},
  "InputB": {inputType: 'any', resultType: 'boolean', status: "Maybe-Undefined", constType: "Non-Constant"},
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