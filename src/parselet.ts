import { TokenStream } from './tokenstream';
import { Token, TokenType, BinaryOperationTokenType} from './lexer';
import * as AST from './ast';
import { AbstractParser } from './parser';
import {ParseError, token2pos, join, pos2string} from './position';
import {findBases} from './findBase';

export interface InitialParselet {
  parse(parser: AbstractParser,
        tokens: TokenStream, token: Token,
        varMap: {[key: string]: string},
        registeredNodes: {[key: string]: AST.Node},
        dependsMap: {[key: string]: string[]}): AST.Node;
}


export class NumberParselet implements InitialParselet {
  parse(_parser: AbstractParser,
        _tokens: TokenStream,
        token: Token,
        varMap: {[key: string]: string},
        registeredNodes: {[key: string]: AST.Node},
        dependsMap: {[key: string]: string[]}) {
    const position = token2pos(token);
    const id = pos2string(position);
    // add node to the map
    let newNode : AST.NumberNode = {
      nodeType: 'Number' as 'Number',
      value: parseFloat(token.text),
      outputType: { status: 'Definitely' as 'Definitely',
                    valueType: 'number' as 'number',
                    value: undefined },
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}

export class BooleanParselet implements InitialParselet {
  constructor(private value: boolean) {}
  parse(_parser: AbstractParser,
        _tokens: TokenStream, token: Token,
        varMap: {[key: string]: string},
        registeredNodes: {[key: string]: AST.Node},
        dependsMap: {[key: string]: string[]}) {
    const position = token2pos(token);
    const id = pos2string(position);
    let newNode = {
      nodeType: 'Boolean' as 'Boolean',
      value: this.value,
      outputType: { status: 'Definitely' as 'Definitely',
                    valueType: 'boolean' as 'boolean',
                    value: undefined},
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}

export class ParenParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    _token: Token,
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}) {

    const exp = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    tokens.expectToken(')');

    return exp;
  }
}

export class BracketParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream, token: Token,
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}) {

    const arg1 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);  // allow for one argument
    const arg2 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);  // allow for one argument
    const arg3 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);  // allow for one argument
    tokens.expectToken(']');


    const position = token2pos(token);
    const id = pos2string(position);
    // add node to the map
    let newNode : AST.IteratorNode = {
      nodeType: 'Iterator' as 'Iterator',
      outputType: undefined,
      pos: position,
      nodeId: id,
      index: 0,
      values: [],
      start: arg1,
      end: arg2,
      step: arg3,
    };

    console.log("The Iterator parslet is running!")
    registeredNodes[id] = newNode;


    return newNode;

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
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}
  ): AST.Node;
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
    left: Exclude<Exclude<AST.Node, AST.ProgramNode>, undefined>,
    token: Token,
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}
  ): AST.Node {
    const bindingPower = parser.bindingPower(token);

    const right = parser.parse(
      tokens,
      this.associativity == 'left' ? bindingPower : bindingPower - 1,
      varMap,
      registeredNodes,
      dependsMap
    );
    const position = join(left.pos, token2pos(tokens.last()));
    const id = pos2string(position);
    let newNode = {
      nodeType: 'BinaryOperation' as 'BinaryOperation',
      operator: this.tokenType,
      left,
      right,
      outputType: { status: 'Maybe-Undefined' as 'Maybe-Undefined',
                    valueType: undefined,
                    value: undefined},
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;

    return newNode;
  }
}

// Parse function calls
// Limitation: Functions are allowed to take exactly one argument
export class FunctionParselet implements InitialParselet {
  
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}) {

    const position = token2pos(token);
    const id = pos2string(position);
    tokens.expectToken('(');
    const arg1 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);  // allow for one argument
    let args = [arg1];
    if (token.text == "ParseOrderedPair") {
      const arg2 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);  // allow for second argument
      args.push(arg2);
    }
    tokens.expectToken(')');
    let newNode = {
      nodeType: 'Function' as 'Function',
      name: token.text,
      args: args,
      outputType: { status: 'Maybe-Undefined' as 'Maybe-Undefined',
                    valueType: undefined,
                    value: undefined },
      pos: position,
      nodeId: id
    };


    registeredNodes[id] = newNode;
    return newNode;
  }
}

export class ChooseParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}) {
    const position = token2pos(token);
    const id = pos2string(position);

    const predicate = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    const consequent = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    tokens.expectToken('CHOOSE2');
    const otherwise = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);

    let newNode = {
      nodeType: 'Choose' as 'Choose',
      case: { predicate: predicate, consequent: consequent },
      otherwise: otherwise,
      outputType: { status: 'Maybe-Undefined' as 'Maybe-Undefined',
                    valueType: undefined,
                    value: undefined },
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}

export class VariableAssignmentParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}) {

    const position = token2pos(token);
    const id = pos2string(position);
    
    //is this a special '%' assignment or identifier?


    

    // deal with variable assignment
    tokens.expectToken('=');
    const assignment = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);


    // need to save the variable and its assignment in a lookup table
    varMap[token.text] = id;

    if (token.text.indexOf("%") != -1){

      let newNode = {
        nodeType: 'VariableAssignment' as 'VariableAssignment',
        name: token.text,
        assignment: assignment,
        outputType: { status: "Maybe-Undefined" as "Maybe-Undefined",
                      valueType: assignment?.outputType?.valueType,
                      value: undefined },
        pos: position,
        nodeId: id
      };
      registeredNodes[id] = newNode;
      dependsMap[id] = findBases(assignment, dependsMap); // NEW FUNCTION HERE
      return newNode;

    } else {
      let newNode = {
        nodeType: 'VariableAssignment' as 'VariableAssignment',
        name: token.text,
        assignment: assignment,
        outputType: { status: "Maybe-Undefined" as "Maybe-Undefined",
                      valueType: assignment?.outputType?.valueType,
                      value: undefined },
        pos: position,
        nodeId: id
      };
      registeredNodes[id] = newNode;
      dependsMap[id] = findBases(assignment, dependsMap); // NEW FUNCTION HERE
      return newNode;
    }

 

  }
}

export class IdentifierParselet implements InitialParselet {
  parse(parser: AbstractParser,
    tokens: TokenStream,
    token: Token,
    varMap: {[key: string]: string},
    registeredNodes: {[key: string]: AST.Node},
    dependsMap: {[key: string]: string[]}) {
    
    const position = token2pos(token);
    const id = pos2string(position);
    // need to look up known variables in a lookup table (map?)


    const assignmentId = varMap[token.text];

    if (!assignmentId) {
      //if the variable is an assignment
      const varParselet = new VariableAssignmentParselet();
      return varParselet.parse(parser, tokens, token, varMap, registeredNodes, dependsMap);

    }
    else {
      if (token.text.indexOf("%") != -1){
        let newNode = {
          nodeType: 'RangeIdentifier' as 'RangeIdentifier',
          name: token.text,
          assignmentId: assignmentId,
          outputType: { status: "Maybe-Undefined" as "Maybe-Undefined",
                        valueType: undefined,
                        value: undefined },
          pos: position,
          nodeId: id
        };
        registeredNodes[id] = newNode;
        return newNode;
      } else {
        let newNode = {
          nodeType: 'Identifier' as 'Identifier',
          name: token.text,
          assignmentId: assignmentId,
          outputType: { status: "Maybe-Undefined" as "Maybe-Undefined",
                        valueType: undefined,
                        value: undefined },
          pos: position,
          nodeId: id
        };
        registeredNodes[id] = newNode;
        return newNode;
      }

    }
  }
}
