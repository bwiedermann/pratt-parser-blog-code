import {Position} from './position';
import * as AST from './ast';
import {equals} from './equals';



export function darCheck(nodes: AST.Node[],  registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    const errors = nodes.map(n => darCheckNode(n, nodes, registeredNodes));
    return ([] as TypeError[]).concat(...errors);
}

function darCheckNode(node: AST.Node, nodes: AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {
    if (darCheckerMap != undefined && node != undefined && node.nodeType != undefined && darCheckerMap[node.nodeType] == undefined){
        return [];
    }else{
        return darCheckerMap[node!.nodeType]!.darCheck(node, nodes, registeredNodes);
    }
}

export class TypeError {
    constructor(public message: string, public position: Position) {}
  }

export interface DarChecker {
    /**
     * 
     * @param {AST.Node}                node            The current root note to darCheck 
     * @param {AST.Node[]}              nodes           The entire tree of nodes  
     * @param {[key: string]: AST.Node} registeredNodes A map of nodeId's to nodes
     * @return {TypeError[]}                            A list of type errors, if errors are present
     */
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


    /**
     * 
     * @param {number}      left        Number on the left side of the operation
     * @param {number}      right       Number on the right side of the operation 
     * @param {string}      operator    A string representing the operator (+, -, *, /)
     * @returns {number | undefined}    Returns undefined if either side is non-number, else returns the result of the operation
     */
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
                return undefined;
            }
        } else {
            //one or both sides is a non-number. We only care about numbers
            return undefined;
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
            //aka binary operation is NOT constant
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
    darCheck(node: AST.IdentifierNode, _ : AST.Node[], registeredNodes: {[key: string]: AST.Node}): TypeError[] {

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

    /**
     * 
     * @param {number} start    A Number that represents the starting value for the iterator (inclusive) 
     * @param {number} end      The end point of the range (exclusive)
     * @param {number} step     The step of the range
     * @returns {number[]}      A javascript array that contains the range represented by start, end, and step
     */
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

        //pre-check nodes, to populate their 'value' (if constant)
        darCheckNode(node.start, nodes, registeredNodes);
        darCheckNode(node.end, nodes, registeredNodes);
        darCheckNode(node.step, nodes, registeredNodes);

        //calculate range
        if (node.start?.outputType?.value != undefined && node.end?.outputType?.value != undefined && node.step?.outputType?.value != undefined){
            //if start, end, and step all are constant numbers

            const start = node.start?.outputType?.value;
            const end = node.end?.outputType?.value;
            const step = node.step?.outputType?.value;

            node.values = this.getRange(start, end, step);
        } else {
            errors.push(new TypeError("Non constant value used in iterator decleration", node.pos));
        }

        return errors;
    }
  }

/**
 * DarCheckAny exists as a blank default checker that does nothing
 * This helps appease the Typescript typechecker
 */
class DarCheckAny implements DarChecker {
    darCheck(node: AST.Node): TypeError[] {
        return [];
    }
}

const darCheckerMap: Partial<{[K in AST.NodeType]: DarChecker}> = {
'Number' : new DarCheckNumber(),
'Boolean' : new DarCheckAny(),
'BinaryOperation' : new DarCheckBinary(),
'Function' : new DarCheckFunction(),
'Choose': new DarCheckAny(),
'VariableAssignment': new DarCheckVariable(),
'Identifier': new DarCheckIdentifier(),
'Iterator': new DarCheckIterator(),
'RangeIdentifier': new DarCheckAny(),
'SinkAssignment': new DarCheckAny(),
'String': new DarCheckAny(),
'Pair': new DarCheckAny(),
'CalculatorReference': new DarCheckAny(),
'Program': new DarCheckAny(),
}






