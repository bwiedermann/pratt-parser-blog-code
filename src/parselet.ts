import { TokenStream } from './tokenstream';
import { Token, TokenType, BinaryOperationTokenType} from './lexer';
import * as AST from './ast';
import { AbstractParser } from './parser';
import {token2pos, join, pos2string} from './position';

// All parselets add their nodeType to the AST
export interface InitialParselet {
  parse(parser: AbstractParser,
        tokens: TokenStream, token: Token,
        varMap: {[key: string]: string}): AST.Node;
}


export class NumberParselet implements InitialParselet {
  parse(_parser: AbstractParser,
        _tokens: TokenStream,
        token: Token,
        varMap: {[key: string]: string}) {
    const position = token2pos(token);
    const id = pos2string(position);

    let newNode = {
      nodeType: 'Number' as 'Number',
      value: parseFloat(token.text),
      valueType: 'number' as 'number',
      pos: position,
      nodeId: id
    };
    
    return newNode;
  }
}

export class BooleanParselet implements InitialParselet {
  constructor(private value: boolean) {}
  parse(_parser: AbstractParser,
        _tokens: TokenStream, token: Token,
        varMap: {[key: string]: string}) {
    const position = token2pos(token);
    const id = pos2string(position);

    let newNode = {
      nodeType: 'Boolean' as 'Boolean',
      value: this.value,
      valueType: 'boolean' as 'boolean',
      pos: position,
      nodeId: id
    };

    return newNode;
  }
}

export class ParenParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    _token: Token,
    varMap: {[key: string]: string}) {

    const exp = parser.parse(tokens, 0, varMap);
    tokens.expectToken(')');

    return exp;
  }
}

export abstract class ConsequentParselet {
  constructor(
    readonly tokenType: TokenType,
    readonly associativity: 'left' | 'right'
  ) {}
  abstract parse(
    parser: AbstractParser,
    tokens: TokenStream,
    left: AST.Node,
    token: Token,
    varMap: {[key: string]: string}): AST.Node;
}

export class BinaryOperatorParselet extends ConsequentParselet {
  constructor(
    public tokenType: BinaryOperationTokenType,
    associativity: 'left' | 'right'
  ) {
    super(tokenType, associativity);
  }

  parse(
    parser: AbstractParser,
    tokens: TokenStream,
    left: AST.Node,
    token: Token,
    varMap: {[key: string]: string}): AST.Node {
    const bindingPower = parser.bindingPower(token);

    const right = parser.parse(
      tokens,
      this.associativity == 'left' ? bindingPower : bindingPower - 1,
      varMap
    );
    const position = join(left.pos, token2pos(tokens.last()));
    const id = pos2string(position);
    let newNode = {
      nodeType: 'BinaryOperation' as 'BinaryOperation',
      operator: this.tokenType,
      left,
      right,
      pos: position,
      nodeId: id
    };

    return newNode;
  }
}

export class FunctionParselet implements InitialParselet {
  
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string}) {

    const position = token2pos(token);
    const id = pos2string(position);

    // All functions have at least one argument inside parens
    tokens.expectToken('(');
    const arg1 = parser.parse(tokens, 0, varMap);  // allow for one argument
    let args = [arg1];
    // ParseOrderedPair is the only function that takes two arguments
    if (token.text == "ParseOrderedPair") {
      const arg2 = parser.parse(tokens, 0, varMap);  // allow for second argument
      args.push(arg2);
    }
    tokens.expectToken(')');

    let newNode = {
      nodeType: 'Function' as 'Function',
      name: token.text,
      args: args,
      pos: position,
      nodeId: id
    };

    return newNode;
  }
}

export class ChooseParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string}) {
    const position = token2pos(token);
    const id = pos2string(position);

    // Choose nodes include two nodes followed by the keyword "OTHERWISE" (CHOOSE2)
    // which is followed by another node
    const predicate = parser.parse(tokens, 0, varMap);
    const consequent = parser.parse(tokens, 0, varMap);
    tokens.expectToken('CHOOSE2');
    const otherwise = parser.parse(tokens, 0, varMap);

    let newNode = {
      nodeType: 'Choose' as 'Choose',
      case: { predicate: predicate, consequent: consequent },
      otherwise: otherwise,
      pos: position,
      nodeId: id
    };

    return newNode;
  }
}

export class VariableAssignmentParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string}) {

    const position = token2pos(token);
    const id = pos2string(position);
    
    tokens.expectToken('=');
    const assignment = parser.parse(tokens, 0, varMap);

    // Save the variable and its assignment in the variable map
    varMap[token.text] = id;

    let newNode = {
      nodeType: 'VariableAssignment' as 'VariableAssignment',
      name: token.text,
      assignment: assignment,
      pos: position,
      nodeId: id
    };

    return newNode;
  }
}

export class IdentifierParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string}) {
    
    const position = token2pos(token);
    const id = pos2string(position);

    // Look up the node this identifier was assigned to
    const assignmentId = varMap[token.text];

    // An identifier must be previously assigned,
    // otherwise we call the variable assignment parselet
    if (!assignmentId) {
      const varParselet = new VariableAssignmentParselet();
      return varParselet.parse(parser, tokens, token, varMap);
    }
    else {
      let newNode = {
        nodeType: 'Identifier' as 'Identifier',
        name: token.text,
        assignmentId: assignmentId,
        pos: position,
        nodeId: id
      };
      
      return newNode;
    }
  }
}
