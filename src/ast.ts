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
  valueType: ValueType;
  pos: Position;
  nodeId: string;
};

export type BooleanNode = {
  nodeType: 'Boolean';
  value: boolean;
  valueType: ValueType;
  pos: Position;
  nodeId: string;
};

export type BinaryOperationNode = {
  nodeType: 'BinaryOperation';
  operator: BinaryOperationTokenType;
  left: Node;
  right: Node;
  pos: Position;
  nodeId: string;
};

// This supports only builtin functions (defined in typechecker.ts)
export type FunctionNode = {
  nodeType: 'Function';
  name: string;
  args: Node[];
  pos: Position;
  nodeId: string;
}

// This only allows one predicate-consequent pair per choose node
export type ChooseNode = {
  nodeType: 'Choose';
  case: { predicate: Node, consequent: Node };
  otherwise: Node;
  pos: Position
  nodeId: string;
}

export type VariableAssignmentNode = {
  nodeType: 'VariableAssignment';
  name: string;
  assignment: Node;
  pos: Position;
  nodeId: string;
}

export type IdentifierNode = {
  nodeType: 'Identifier';
  name: string;
  assignmentId: string;
  pos: Position;
  nodeId: string;
}

export type Node = 
  | BooleanNode 
  | NumberNode 
  | BinaryOperationNode 
  | FunctionNode 
  | ChooseNode 
  | VariableAssignmentNode 
  | IdentifierNode;

export type ValueType = 'number' | 'boolean' | 'pair' | 'any' | undefined;
