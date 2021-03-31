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
  | 'Program';

export type NumberNode = {
  nodeType: 'Number';
  value: number;
  outputType: Definitely<ValueType>;
  pos: Position;
  nodeId: string;
  neg: boolean;
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
  args: Node[];
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
}

export type ChooseNode = {
  nodeType: 'Choose';
  case: { predicate: Node, consequent: Node };
  otherwise: Node;
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
  nodeType: 'Identifier';
  name: string;
  assignmentId: string;
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
}

// export type ProgramNode = {
//   nodeType: 'Program';
//   children: Node[];
//   nodeId: string;
// }

export type Node = 
  | BooleanNode 
  | NumberNode 
  | BinaryOperationNode 
  | FunctionNode 
  | ChooseNode 
  | VariableAssignmentNode 
  | IdentifierNode
  // | ProgramNode
  | undefined;

// on to the proof of concept stuff

export type Definitely<ValueType> = {
  status: 'Definitely';
  valueType: ValueType;
  asserts: string[];
  constType: ConstantType;
}

export type Maybe<ValueType> = {
  status: 'Maybe-Undefined';
  valueType: ValueType;
  asserts: string[];
  constType: ConstantType;
}

export type Und<ValueType> = {
  status: 'Def-Undefined';
  valueType: ValueType;
  asserts: string[];
  constType: ConstantType;
}

export type ValueType = 'number' | 'boolean' | 'pair' | 'any' | undefined;
export type ConstantType = 'Constant' | 'Non-Constant' | undefined;

export type Possible<ValueType> = Definitely<ValueType> | Maybe<ValueType> | Und<ValueType>;
