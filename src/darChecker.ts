import {Position} from './position';
import * as AST from './ast';
import {equals} from './equals';





export function darCheck(nodes: AST.Node[],  registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    const errors = nodes.map(n => darCheckNode(n, nodes, registeredNodes));
    return ([] as TypeError[]).concat(...errors);
}

function darCheckNode(node: AST.Node, nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    if (darCheckerMap != undefined && node.nodeType != undefined && darCheckerMap[node.nodeType] == undefined){
        return [];
    }else{
        return darCheckerMap[node.nodeType].darCheck(node, nodes, registeredNodes);
    }
}

export class TypeError {
    constructor(public message: string, public position: Position) {}
  }

export interface DarChecker {

    darCheck(node: AST.Node,
            nodes: AST.Node[], 
            registeredNodes: {[key: string]: AST.Node},): TypeError[];
  }

class DarCheckNumber implements DarChecker {
    darCheck(node: AST.NumberNode): TypeError[] {

        //set the value in the outputType
        node.outputType.value = node.value;
        return [];
    }
  }


  class DarCheckFunction implements DarChecker{
      darCheck(node: AST.FunctionNode, nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}) : TypeError[]{
        const errors: TypeError[] = [];
        
        if (node.name == "TestConstant"){
            //do our test constant demo

            //pre-check the arg (to assign value)
            darCheckNode(node.args[0], nodes, registeredNodes)

            //check if the argument has a value
            if (node?.args[0]?.outputType?.value == undefined){
                errors.push(new TypeError("Input to TestConstant() is not constant", node.pos));
            }

        }
        return errors;
      }
  }

class DarCheckBinary implements DarChecker {


    evaluateOperation(left : number, right : number, operator : string): number | undefined {

        //check to make sure left & right are numbers
        if (typeof(left) == 'number' && typeof(right) == 'number' ){
            if (operator == "+"){
                return left + right
            } else if (operator == "-"){
                return left - right
            } else if (operator == "*"){
                return left * right
            } else if (operator =="/"){
                return left / right
            } else {
                return 999999
            }
        } else {
            //one or both sides is a non-number. We only care about numbers
            return undefined
        }
    }

    darCheck(node: AST.BinaryOperationNode, nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {
        const errors: TypeError[] = darCheckNode(node.left, nodes, registeredNodes).concat(darCheckNode(node.right, nodes, registeredNodes));
        
        //check if outputType of both left and right is constant
        if (node.left?.outputType?.value != undefined && node.right?.outputType?.value != undefined){
            
            //evaluate the operation and set the value
            node.outputType = {
                status : node.outputType!.status,
                valueType: node.left?.outputType?.valueType,
                value: this.evaluateOperation(node.left?.outputType.value, node.right?.outputType.value, node.operator) 
            }
            
   
        } else{
            //One or both of the left + right does NOT have a value
            console.log("One or both sides has no 'value'");
        }
   
        return errors;
    }
}

class DarCheckVariable implements DarChecker {
    darCheck(node: AST.VariableAssignmentNode, nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {


        //check the assignment (and propagate value, if applicable)
        darCheckNode(node.assignment, nodes, registeredNodes);

        //does the assignment node have a value
        if (node.assignment?.outputType?.value != undefined){
            //set value of this node to the value of the assignment
            node.outputType.value = node.assignment.outputType.value;
        }

        return [];
    }
}

class DarCheckIdentifier implements DarChecker {
    darCheck(node: AST.IdentifierNode, nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {

        //grab the assignment node that this ident refrences
        const assignmentNode = registeredNodes[node.assignmentId];

        if (assignmentNode?.outputType?.value != undefined){
            //set value of this node to the value of the assignment
            node.outputType.value = assignmentNode.outputType.value;
        }

        return [];
    }
  }

  class DarCheckIterator implements DarChecker {

    getRange(start: number, end: number, step: number): number[]{
        let current = start;
        let out = [];
        while (current < end){
            out.push(current);
            current += step;
        }
        return out;
    }
    darCheck(node: AST.IteratorNode, nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {
        const errors: TypeError[] = [];

        //pre-check nodes
        darCheckNode(node.start, nodes, registeredNodes);
        darCheckNode(node.end, nodes, registeredNodes);
        darCheckNode(node.step, nodes, registeredNodes);


        //calculate range

        if (node.start?.outputType?.value != undefined && node.end?.outputType?.value != undefined && node.step?.outputType?.value != undefined){
            //if start, end, and step all are constant numbers

            const start = node.start?.outputType?.value;
            const end = node.end?.outputType?.value;
            const step = node.step?.outputType?.value;

            console.log("start, end, step:", start, end, step);

            node.values = this.getRange(start, end, step);
        } else {
            console.log("Iterator used with non constant stuff")
            errors.push(new TypeError("Non constant value used in iterator decleration", node.pos));
        }


        return errors;
    }
  }



const darCheckerMap: Partial<{[K in AST.NodeType]: DarChecker}> = {
'Number' : new DarCheckNumber(),
//'Boolean' : new CheckBoolean(),
'BinaryOperation' : new DarCheckBinary(),
'Function' : new DarCheckFunction(),
//'Choose': new CheckChoose(),
'VariableAssignment': new DarCheckVariable(),
'Identifier': new DarCheckIdentifier(),
'Iterator': new DarCheckIterator(),
}