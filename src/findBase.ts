import * as AST from './ast';
import {builtins} from './typechecker';

/*
    The findBases function, given an AST node and the current dependsMap, determines
    the "bases" of that node and returns them in a list of nodeIds.

    Bases are nodes that introduce the possibility of being undefined.
    For example, the InputN() function represents student input, and therefore
    introduces the possibility to be undefined.
*/

export function findBases(node: AST.Node, dependsMap: {[key: string]: string[]}): string[] {
    return baseMap[node.nodeType].findBase(node, dependsMap); 
}

export interface BaseFinder {
  findBase(node: AST.Node, dependsMap: {[key: string]: string[]}): string[];
}

// Numbers are constant, and therefore cannot have bases
class BaseNumber implements BaseFinder {
  findBase(node: AST.NumberNode): string[] {
    return []
  }
}

// Booleans are constant, and therefore cannot have bases
class BaseBoolean implements BaseFinder {
    findBase(node: AST.BooleanNode): string[] {
        return []
    }
}

// Binary operations could have bases on either side of their operator
class BaseBinary implements BaseFinder {
    findBase(node: AST.BinaryOperationNode, dependsMap: {[key: string]: string[]}): string[] {
        let baseList: string[] = [];
        // recursively call findBases on left and right
        let leftList = findBases(node.left, dependsMap);
        baseList = baseList.concat(leftList);
        let rightList = findBases(node.right, dependsMap)
        // combine bases from left and right
        baseList = baseList.concat(rightList);
        return baseList;
    }
}

// In this proof of concept, functions are the only bases
// They can produce an undefined value (e.g. Inverse(0)) or are inherently non-constant (e.g. InputN)
// Otherwise, the base of the function is determined by its argument(s)
// This means that the base is the id of the function node itself
class BaseFunction implements BaseFinder {
    findBase(node: AST.FunctionNode, dependsMap: {[key: string]: string[]}): string[] {
        let baseList: string[] = [];

        if (node.outputType.status == 'Def-Undefined') {
            // e.g. with Inverse(0)
            baseList.push(node.nodeId);
        } else if (builtins[node.name].status == 'Variable') {
            // recursively call findBases on argument(s)
            for (let i = 0; i < node.args.length; i++) {
                baseList = baseList.concat(findBases(node.args[i], dependsMap));
            }
        } else if (builtins[node.name].constType == 'Non-Constant') {
            // e.g. with InputN(2)
            baseList.push(node.nodeId);
        }

        return baseList;
    }
}

// The bases of choose nodes are determined by the bases of their consequent and their otherwise
class BaseChoose implements BaseFinder {
    findBase(node: AST.ChooseNode, dependsMap: {[key: string]: string[]}): string[] {
        let baseList: string[] = [];
 
        let consBases = findBases(node.case.consequent, dependsMap);
        baseList = baseList.concat(consBases);

        let otherBases = findBases(node.otherwise, dependsMap);
        baseList = baseList.concat(otherBases);

        return baseList;
    }
}

// Variable assignments are constant, and therefore cannot have bases
class BaseVariableAssignment implements BaseFinder {
    findBase(node: AST.VariableAssignmentNode): string[] {
        return []
    }
}

// The bases of an identifier are stored in the dependsMap, which has a reference
// to its assignment.
class BaseIdentifier implements BaseFinder {
    findBase(node: AST.IdentifierNode, dependsMap: {[key: string]: string[]}): string[] {
        // follow the chain in the dependsMap
        return dependsMap[node.assignmentId];
    }
}

const baseMap: Partial<{[K in AST.NodeType]: BaseFinder}> = {
  'Number' : new BaseNumber(),
  'Boolean' : new BaseBoolean(),
  'BinaryOperation' : new BaseBinary(),
  'Function' : new BaseFunction(),
  'Choose': new BaseChoose(),
  'VariableAssignment': new BaseVariableAssignment(),
  'Identifier': new BaseIdentifier()
}