import {Position} from './position';
import {BinaryOperationTokenType} from './lexer';

export type NodeType =
  | 'VariableAssignment'
  | 'Number'
  | 'Boolean'
  | 'BinaryOperation'
  | 'Choose'
  | 'Identifier'
  | 'Function';

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
  left: AnalyzedNode;
  right: AnalyzedNode;
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
  value: number | boolean | undefined;
};

// This supports only builtin functions (defined in typechecker.ts)
export type FunctionNode = {
  nodeType: 'Function';
  name: string;
  args: AnalyzedNode[];
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
  value: number | boolean | undefined; // the builtin functions we have that return values are only numbers or booleans
}

// This only allows one predicate-consequent pair per choose node
export type ChooseNode = {
  nodeType: 'Choose';
  case: { predicate: AnalyzedNode, consequent: AnalyzedNode };
  otherwise: AnalyzedNode;
  outputType: Possible<ValueType>;
  pos: Position
  nodeId: string;
  value: number | boolean | undefined;
}

export type VariableAssignmentNode = {
  nodeType: 'VariableAssignment';
  name: string;
  assignment: AnalyzedNode;
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
  value: number | boolean | undefined;
}

export type IdentifierNode = {
  nodeType: 'Identifier';
  name: string;
  assignmentId: string;
  outputType: Possible<ValueType>;
  pos: Position;
  nodeId: string;
  value: number | boolean | undefined;
}

export type AnalyzedNode = 
  | BooleanNode 
  | NumberNode 
  | BinaryOperationNode 
  | FunctionNode 
  | ChooseNode 
  | VariableAssignmentNode 
  | IdentifierNode;

// These are the new types
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
