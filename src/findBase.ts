import * as AST from './ast';

export function findBases(node: AST.Node, dependsMap: {[key: string]: string[]}): string[] {
    return baseMap[node.nodeType].findBase(node, dependsMap); 
}

export interface BaseFinder {
  findBase(node: AST.Node, dependsMap: {[key: string]: string[]}): string[];
}

class BaseNumber implements BaseFinder {
  findBase(node: AST.NumberNode): string[] {
    return []
  }
}

class BaseBoolean implements BaseFinder {
    findBase(node: AST.BooleanNode): string[] {
        return []
    }
}

class BaseBinary implements BaseFinder {
    findBase(node: AST.BinaryOperationNode, dependsMap: {[key: string]: string[]}): string[] {
        let baseList: string[] = [];
        // recursively call findBases on left and right
        let leftList = findBases(node.left, dependsMap);
        baseList = baseList.concat(leftList);
        let rightList = findBases(node.right, dependsMap)
        baseList = baseList.concat(rightList);
        return baseList;
    }
}

// examples: x = Input(3); x = IsDefined(Input(3)); z = Inverse(x)
// need dependsMap for the third example
class BaseFunction implements BaseFinder {
    findBase(node: AST.FunctionNode, dependsMap: {[key: string]: string[]}): string[] {
        let baseList: string[] = [];
        
        // If the builtin status IS a variable, then it does depend on its arguments
        // Unlike for Definitely and Maybe-Undefined functions, which status is the same always
        if (builtins[node.name].status == 'Variable') {
            // recursively call findBases on argument(s)
            for (let i = 0; i < node.args.length; i++) {
                baseList = baseList.concat(findBases(node.args[i], dependsMap));
            }
        } else if (builtins[node.name].status == 'Maybe-Undefined') {
            // If Maybe-Undefined funtion, it IS a base (the root of a maybe-undefined status)
            baseList.push(node.nodeId);
        }

        return baseList;
    }
}

// assume that choose nodes will never create their own bases
// they can still error check previously defined bases
class BaseChoose implements BaseFinder {
    findBase(node: AST.ChooseNode, dependsMap: {[key: string]: string[]}): string[] {
        let baseList: string[] = [];
        // the bases of the cons and the otherwise
        let consBases = findBases(node.case.consequent, dependsMap);
        baseList = baseList.concat(consBases);
        let otherBases = findBases(node.otherwise, dependsMap);
        baseList = baseList.concat(otherBases);
        return baseList;
    }
}

class BaseVariableAssignment implements BaseFinder {
    findBase(node: AST.VariableAssignmentNode): string[] {
        return []
    }
}

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

const builtins : {[name: string]: {inputType: AST.ValueType, resultType: AST.ValueType, status: string} } = {
    "IsDefined": {inputType: 'any', resultType: 'boolean', status: "Definitely"},
    "Inverse": {inputType: 'number', resultType: 'number', status: "Variable"},
    "InputN": {inputType: 'number', resultType: 'number', status: "Maybe-Undefined"},
    "Sink": {inputType: 'any', resultType: 'any', status: "Variable"},
    "ParseOrderedPair": {inputType: 'number', resultType: 'pair', status: "Maybe-Undefined"},
    "X": {inputType: 'pair', resultType: 'number', status: "Variable"},
    "Y": {inputType: 'pair', resultType: 'number', status: "Variable"},
    "Not": {inputType: 'boolean', resultType: 'boolean', status: "Definitely"},
    "InputB": {inputType: 'boolean', resultType: 'boolean', status: "Maybe-Undefined"}
}
