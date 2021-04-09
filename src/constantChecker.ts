import {Position} from './position';
import * as AST from './ast';
import * as AnalyzedTree from './analyzedTree';


// export function constCheck(nodes: AnalyzedTree.AnalyzedNode[], registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {
//   nodes.forEach(node => {
//     constCheckNode(node, registeredNodes);
//   });
// }

export function constCheckNode(node: AnalyzedTree.AnalyzedNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {
  checkerMap[node.nodeType].check(node, registeredNodes);
}

export class TypeError {
  constructor(public message: string, public position: Position) {}
}

export interface ConstChecker {
  check(node: AnalyzedTree.AnalyzedNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void;
}

// A number requires no type checking
class CheckNumber implements ConstChecker {
  check(node: AnalyzedTree.NumberNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {
    // numbers already have values and are already constant
  }
}

// A boolean requires no type checking
class CheckBoolean implements ConstChecker{
  check(node: AnalyzedTree.BooleanNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void{
    // booleans already have values and are already constant
  }
}

class CheckBinary implements ConstChecker {
  check(node: AnalyzedTree.BinaryOperationNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {
    constCheckNode(node.left, registeredNodes);
    constCheckNode(node.right, registeredNodes);
    
    // at this point we have values for left and right
    // we need to use the operator to evalute the expression
    // make sure left and right are both constant
    if (node.left.outputType?.constType == 'Constant' && node.right.outputType?.constType == 'Constant') {
        if (node.operator == '+') {
            // it's been typechecked, so if the operator is a + then the operands are numbers
            node.value = node.left.value + node.right.value;
        }
        else if (node.operator == '-') {
            // it's been typechecked, so if the operator is a - then the operands are numbers
            node.value = node.left.value - node.right.value;
        }
        else if (node.operator == '*') {
            // it's been typechecked, so if the operator is a * then the operands are numbers
            node.value = node.left.value * node.right.value;
        }
        else if (node.operator == '/') {
            // it's been typechecked, so if the operator is a / then the operands are numbers
            node.value = node.left.value / node.right.value;
        }
        else if (node.operator == '&') {
            // it's been typechecked, so if the operator is an & then the operands are booleans
            node.value = node.left.value && node.right.value;
        }
        else if (node.operator == '|') {
            // it's been typechecked, so if the operator is a | then the operands are booleans
            node.value = node.left.value || node.right.value;
        }
    }
    else {
        // NOTE: we know that the outputType exists at this point
        // so this error makes no sense
        node.outputType?.constType = 'Non-Constant';
    }

  }
}

class CheckFunction implements ConstChecker {
  check(node: AnalyzedTree.FunctionNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {

    // First typecheck the argument(s)
    constCheckNode(node.args[0], registeredNodes);
    if (node.args.length > 1) {
      constCheckNode(node.args[1], registeredNodes);
    }

    if (node.args[0].outputType.constType == 'Constant') {
        // if the argument is constant, we can evaluate it
        const result = evaluate(node);
        node.value = result;
    }
    else {
        node.outputType.constType = 'Non-Constant';
    }

  }
}

class CheckChoose implements ConstChecker {
  check(node: AnalyzedTree.ChooseNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {

    const predicate = node.case.predicate;
    const consequent = node.case.consequent;
    const otherwise = node.otherwise;

    // First const-check the inner nodes
    constCheckNode(predicate, registeredNodes);
    constCheckNode(consequent, registeredNodes);
    constCheckNode(otherwise, registeredNodes);

    if (predicate.outputType.constType == 'Constant') {
        if (predicate.value == true) {
            if (consequent.outputType.constType == 'Constant') {
                node.value = consequent.value;
            }
            else {
                node.outputType.constType = 'Non-Constant';
            }
        }
        else {
            if (otherwise.outputType.constType == 'Constant') {
                node.value = otherwise.value;
            }
            else {
                node.outputType.constType = 'Non-Constant';
            }
        }
    }
    else {
        node.outputType.constType = 'Non-Constant';
    }


  }
}

class CheckVariable implements ConstChecker {
  check(node: AnalyzedTree.VariableAssignmentNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {

    // First const-check the assignment node
    constCheckNode(node.assignment, registeredNodes);

    if (node.assignment.outputType.constType == 'Constant') {
        node.value = node.assignment.value;
    }
    else {
        node.outputType.constType = 'Non-Constant';
    }

  }
}

class CheckIdentifier implements ConstChecker {
  check(node: AnalyzedTree.IdentifierNode, registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode}): void {

    // Grab the node the identifier was previously assigned to
    let valueNode = registeredNodes[node.assignmentId].assignment;

    if (valueNode.outputType.constType == 'Constant') {
        node.value = valueNode.value;
    }
    else {
        node.outputType.constType = 'Non-Constant';
    }


  }
}

const checkerMap: Partial<{[K in AST.NodeType]: ConstChecker}> = {
  'Number' : new CheckNumber(),
  'Boolean' : new CheckBoolean(),
  'BinaryOperation' : new CheckBinary(),
  'Function' : new CheckFunction(),
  'Choose': new CheckChoose(),
  'VariableAssignment': new CheckVariable(),
  'Identifier': new CheckIdentifier()
}

// This funciton simulates running the body of a miniCL function (like Inverse(x))
function evaluate(node: AnalyzedTree.FunctionNode): any {
    // 0 is the only input to Inverse that makes it undefined
    let argVal = node.args[0].value;
    if (node.name == "Inverse") {
      if (argVal == 0) {
        return undefined;
      }
      else {
        return 1 / argVal;
      }
    }
    // A negative number is the only input to Sqrt that makes it undefined
    if (node.name == "Sqrt") {
      if (argVal < 0) {
        return undefined;
      }
      else {
        return Math.sqrt(argVal);
      }
    }
    if (node.name == "IsDefined") {
        // we only evaluate when the input is constant
        if (argVal == undefined) {
            return false;
        }
        else {
            return true;
        }
    }
    if (node.name == "Not") {
        if (argVal == true) {
            return false;
        }
        else {
            return true;
        }
    }
}