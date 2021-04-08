import {Position} from './position';
import {BinaryOperationTokenType} from './lexer';

export type NodeType =
  | 'SinkAssignment'
  | 'VariableAssignment'
  | 'Number'
  | 'Boolean'
  | 'String'
  | 'BinaryOperation'
  | 'Choose'
  | 'Identifier'
  | 'Function'
  | 'Pair'
  | 'CalculatorReference'
  | 'Iterator'
  | 'Program'
  | 'RangeIdentifier';

export type NumberNode = {
  nodeType: 'Number';
  value: number;
  outputType: Definitely<ValueType>;
  pos: Position;
  nodeId: string;
};

export type BooleanNode = {
  nodeType: 'Boolean';
  value: boolean;
  outputType: Definitely<ValueType>;
  pos: Position;
  nodeId: string;
};

export type BinaryOperationNode = {
  nodeType: 'BinaryOperation';
  operator: BinaryOperationTokenType;
  left: Node;
  right: Node;
  outputType: Possible<ValueType> | undefined;
  pos: Position;
  nodeId: string;
};

// Built to support isDefined(test()), isDefined(boolean), and test()
export type FunctionNode = {
  nodeType: 'Function';
  name: string;
  args: Exclude<Node, ProgramNode>[]; //Everything except program node
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
}

export type ChooseNode = {
  nodeType: 'Choose';
  case: { predicate: Exclude<Node, ProgramNode>, consequent: Exclude<Node, ProgramNode> };
  otherwise: Exclude<Node, ProgramNode>;
  outputType: Possible<ValueType>;
  pos: Position
  nodeId: string;
}

export type VariableAssignmentNode = {
  nodeType: 'VariableAssignment';
  name: string;
  assignment: Node;
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
}

export type IdentifierNode = {
  nodeType: 'Identifier' | 'RangeIdentifier';
  name: string;
  assignmentId: string;
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
}

//export type RangeIdentiferNode = {
//  nodeType: 'RangeIdentifier';
///  name: string;
////  outputType: Possible<ValueType>;
//  pos: Position;
///  nodeId: string;
//}



export type ProgramNode = {
  nodeType: 'Program';
  outputType: Possible<ValueType>;
  children: Node[];
}

export type IteratorNode = {
  nodeType: 'Iterator';
  outputType: undefined;
  pos: Position;
  nodeId: string;
  index: number;
  values: number[];
  start: Node;
  end: Node;
  step: Node;
}

export type Node = 
  | BooleanNode 
  | NumberNode 
  | BinaryOperationNode 
  | FunctionNode 
  | ChooseNode 
  | VariableAssignmentNode 
  | IdentifierNode
  | ProgramNode
  | IteratorNode
  | undefined;

// on to the proof of concept stuff

export type Definitely<ValueType> = {
  status: 'Definitely'; // do we need a status anymore?
  valueType: ValueType; // does this ensure if Definitely<boolean> than value is of type boolean?
  value: number | undefined;
}

export type Maybe<ValueType> = {
  status: 'Maybe-Undefined'; // maybe only status here? This way we can "change" status to definitely?
  valueType: ValueType;
  value: number | undefined;
}

export type OutputType<ValueType> =  Definitely<ValueType> | Maybe<ValueType>;




export type ValueType = 'number' | 'boolean' | 'pair' | 'any' | 'range' |undefined;

export type Possible<ValueType> = Definitely<ValueType> | Maybe<ValueType>;


