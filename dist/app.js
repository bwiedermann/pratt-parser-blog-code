(function() {
  var f = window.__fuse = window.__fuse || {};
  var modules = f.modules = f.modules || {}; f.dt = function (x) { return x && x.__esModule ? x : { "default": x }; };

f.modules = modules;
  f.bundle = function(collection, fn) {
    for (var num in collection) {
      modules[num] = collection[num];
    }
    fn ? fn() : void 0;
  };
  f.c = {};
  f.r = function(id) {
    var cached = f.c[id];
    if (cached) return cached.m.exports;
    var module = modules[id];
    if (!module) {
      
      throw new Error('Module ' + id + ' was not found');
    }
    cached = f.c[id] = {};
    cached.exports = {};
    cached.m = { exports: cached.exports };
    module(f.r, cached.exports, cached.m);
    return cached.m.exports;
  }; 
})();
__fuse.bundle({

// src/lexer.ts @19
19: function(__fusereq, exports, module){
exports.__esModule = true;
var stream_parser_1 = __fusereq(7);
function getTokens(text) {
  const tokens = [];
  const state = {
    line: 1,
    stack: ['default']
  };
  for (const line of text.split('\n')) {
    const stream = new stream_parser_1.StringStream(line, 4, 1);
    stream.string = line;
    while (!stream.eol()) {
      const token = getToken(stream, state);
      const emitToken = makeEmit(stream, state);
      const fullToken = emitToken(token);
      if (token != undefined) {
        tokens.push(fullToken);
      }
      if (stream.start == stream.pos) {
        throw new Error(`getToken failed to advance stream at position ${stream.pos} in string ${stream.string}`);
      }
      stream.start = stream.pos;
    }
    state.line += 1;
  }
  return tokens;
}
exports.getTokens = getTokens;
function getToken(stream, state) {
  switch (state.stack[state.stack.length - 1]) {
    default:
      return getDefaultToken(stream, state);
  }
}
exports.getToken = getToken;
function makeEmit(stream, state) {
  return function emitToken(type) {
    return {
      type,
      first_column: stream.start,
      last_column: stream.pos,
      line: state.line,
      text: stream.current()
    };
  };
}
function getDefaultToken(stream, state) {
  if (stream.eatSpace()) {
    return undefined;
  }
  if (stream.match(/\+/)) {
    return '+';
  }
  if (stream.match(/\-/)) {
    return '-';
  }
  if (stream.match(/\*/)) {
    return '*';
  }
  if (stream.match(/\//)) {
    return '/';
  }
  if (stream.match(/\|/)) {
    return '|';
  }
  if (stream.match(/\&/)) {
    return '&';
  }
  if (stream.match(/\(/)) {
    return '(';
  }
  if (stream.match(/\)/)) {
    return ')';
  }
  if (stream.match(/\[/)) {
    return '[';
  }
  if (stream.match(/\]/)) {
    return ']';
  }
  if (stream.match(/\=/)) {
    return '=';
  }
  if (stream.match(/-?[0-9]+(\.[0-9]+)?/)) {
    return 'NUMBER';
  }
  if (stream.match(/True/)) {
    return 'TRUE';
  }
  if (stream.match(/False/)) {
    return 'FALSE';
  }
  if (stream.match(/#/)) {
    if (!stream.match(/\n/)) {
      stream.match(/.*/);
    }
    return 'COMMENT';
  }
  if (stream.match(/WHEN/)) {
    return 'CHOOSE1';
  }
  if (stream.match(/OTHERWISE/)) {
    return 'CHOOSE2';
  }
  if (stream.match(/[A-Z]([a-z|A-Z])*/)) {
    return 'FUNCTION';
  }
  if (stream.match(/[A-Za-z][(\w|\%)$]*(\.[\w$]+)?(\[\d+])?/)) {
    return 'IDENTIFIER';
  }
  stream.next();
  return 'ERROR';
}
exports.getDefaultToken = getDefaultToken;

},

// src/typechecker.ts @20
20: function(__fusereq, exports, module){
var _1_, _2_;
var _3_, _4_;
var _5_, _6_;
var _7_, _8_;
var _9_, _10_;
var _11_, _12_;
var _13_, _14_;
var _15_, _16_;
var _17_, _18_;
var _19_, _20_;
var _21_, _22_;
var _23_, _24_;
function typecheck(nodes, registeredNodes) {
  const errors = nodes.map(n => typecheckNode(n, registeredNodes));
  return [].concat(...errors);
}
exports.typecheck = typecheck;
function typecheckNode(node, registeredNodes) {
  if (node != undefined && node.nodeType != undefined && checkerMap[node.nodeType] != undefined) {
    return checkerMap[node.nodeType].check(node, registeredNodes);
  } else {
    return [];
  }
}
class TypeError {
  constructor(message, position) {
    this.message = message;
    this.position = position;
  }
}
exports.TypeError = TypeError;
class CheckNumber {
  check(node) {
    return [];
  }
}
class CheckBoolean {
  check(node) {
    return [];
  }
}
class CheckBinary {
  check(node, registeredNodes) {
    const errors = typecheckNode(node.left, registeredNodes).concat(typecheckNode(node.right, registeredNodes));
    if (((_2_ = (_1_ = node.left) === null || _1_ === void 0 ? void 0 : _1_.outputType) === null || _2_ === void 0 ? void 0 : _2_.valueType) != ((_4_ = (_3_ = node.right) === null || _3_ === void 0 ? void 0 : _3_.outputType) === null || _4_ === void 0 ? void 0 : _4_.valueType)) {
      errors.push(new TypeError("incompatible types for binary operator", node.pos));
    } else if (((_6_ = (_5_ = node.right) === null || _5_ === void 0 ? void 0 : _5_.outputType) === null || _6_ === void 0 ? void 0 : _6_.valueType) == 'boolean' && (node.operator != "|" && node.operator != '&')) {
      errors.push(new TypeError("incompatible operation for boolean operands", node.pos));
    } else if (((_8_ = (_7_ = node.right) === null || _7_ === void 0 ? void 0 : _7_.outputType) === null || _8_ === void 0 ? void 0 : _8_.valueType) == 'number' && (node.operator == "|" || node.operator == '&')) {
      errors.push(new TypeError("incompatible operation for number operands", node.pos));
    }
    node.outputType.valueType = (_10_ = (_9_ = node.left) === null || _9_ === void 0 ? void 0 : _9_.outputType) === null || _10_ === void 0 ? void 0 : _10_.valueType;
    return errors;
  }
}
class CheckFunction {
  check(node, registeredNodes) {
    let errors = [];
    const arg1Errors = typecheckNode(node.args[0], registeredNodes);
    errors = errors.concat(arg1Errors);
    if (node.args.length > 1) {
      const arg2Errors = typecheckNode(node.args[1], registeredNodes);
      errors = errors.concat(arg2Errors);
      if (((_12_ = (_11_ = node.args[0]) === null || _11_ === void 0 ? void 0 : _11_.outputType) === null || _12_ === void 0 ? void 0 : _12_.valueType) != ((_14_ = (_13_ = node.args[1]) === null || _13_ === void 0 ? void 0 : _13_.outputType) === null || _14_ === void 0 ? void 0 : _14_.valueType)) {
        errors.push(new TypeError("arguments must have same type", node.args[0].pos));
      }
    }
    const functionName = node.name;
    const argType = builtins[functionName].inputType;
    if (argType) {
      if (argType != 'any' && ((_16_ = (_15_ = node.args[0]) === null || _15_ === void 0 ? void 0 : _15_.outputType) === null || _16_ === void 0 ? void 0 : _16_.valueType) != argType) {
        errors.push(new TypeError("incompatible argument type for " + functionName, node.pos));
      }
    } else {
      errors.push(new TypeError("unknown function", node.pos));
    }
    return errors;
  }
}
class CheckChoose {
  check(node, registeredNodes) {
    let errors = [];
    const predicate = node.case.predicate;
    const consequent = node.case.consequent;
    const otherwise = node.otherwise;
    const predErrors = typecheckNode(predicate, registeredNodes);
    const consErrors = typecheckNode(consequent, registeredNodes);
    const otherErrors = typecheckNode(otherwise, registeredNodes);
    errors = errors.concat(predErrors).concat(consErrors).concat(otherErrors);
    if (((_18_ = (_17_ = consequent) === null || _17_ === void 0 ? void 0 : _17_.outputType) === null || _18_ === void 0 ? void 0 : _18_.valueType) != ((_20_ = (_19_ = otherwise) === null || _19_ === void 0 ? void 0 : _19_.outputType) === null || _20_ === void 0 ? void 0 : _20_.valueType)) {
      errors.push(new TypeError("Return types are not the same for both cases", consequent.pos));
      errors.push(new TypeError("Return types are not the same for both cases", otherwise.pos));
    }
    if (predicate.outputType.valueType != 'boolean') {
      errors.push(new TypeError("Predicate must return a boolean", predicate.pos));
    }
    node.outputType.valueType = (_22_ = (_21_ = consequent) === null || _21_ === void 0 ? void 0 : _21_.outputType) === null || _22_ === void 0 ? void 0 : _22_.valueType;
    return errors;
  }
}
class CheckVariable {
  check(node, registeredNodes) {
    let errors = [];
    const assignmentErrors = typecheckNode(node.assignment, registeredNodes);
    errors = errors.concat(assignmentErrors);
    node.outputType.valueType = (_24_ = (_23_ = node.assignment) === null || _23_ === void 0 ? void 0 : _23_.outputType) === null || _24_ === void 0 ? void 0 : _24_.valueType;
    return errors;
  }
}
class CheckIdentifier {
  check(node, registeredNodes) {
    let errors = [];
    let assignmentNode = registeredNodes[node.assignmentId];
    let valueNode = assignmentNode.assignment;
    if (valueNode == undefined) {
      errors.push(new TypeError("This variable doesn't have a value", node.pos));
    }
    node.outputType.valueType = valueNode.outputType.valueType;
    return errors;
  }
}
class CheckIterator {
  check(node) {
    return [];
  }
}
class CheckRangeIdentifier {
  check(node) {
    return [];
  }
}
const builtins = {
  "IsDefined": {
    inputType: 'any',
    resultType: 'boolean'
  },
  "Inverse": {
    inputType: 'number',
    resultType: 'number'
  },
  "Input": {
    inputType: 'number',
    resultType: 'number'
  },
  "Sink": {
    inputType: 'any',
    resultType: 'any'
  },
  "RandomChoice": {
    inputType: 'number',
    resultType: 'number'
  },
  "TestConstant": {
    inputType: 'any',
    resultType: 'any'
  },
  "ParseOrderedPair": {
    inputType: 'number',
    resultType: 'pair'
  },
  "X": {
    inputType: 'pair',
    resultType: 'number'
  },
  "Y": {
    inputType: 'pair',
    resultType: 'number'
  }
};
const checkerMap = {
  'Number': new CheckNumber(),
  'Boolean': new CheckBoolean(),
  'BinaryOperation': new CheckBinary(),
  'Function': new CheckFunction(),
  'Choose': new CheckChoose(),
  'VariableAssignment': new CheckVariable(),
  'Identifier': new CheckIdentifier(),
  'Iterator': new CheckIterator(),
  'RangeIdentifier': new CheckRangeIdentifier()
};

},

// src/darChecker.ts @21
21: function(__fusereq, exports, module){
var _1_, _2_, _3_;
var _4_, _5_;
var _6_, _7_;
var _8_, _9_;
var _10_;
var _11_;
var _12_, _13_;
var _14_, _15_;
var _16_, _17_;
var _18_, _19_;
var _20_, _21_;
var _22_, _23_;
var _24_, _25_;
var _26_, _27_;
function darCheck(nodes, registeredNodes) {
  const errors = nodes.map(n => darCheckNode(n, nodes, registeredNodes));
  return [].concat(...errors);
}
exports.darCheck = darCheck;
function darCheckNode(node, nodes, registeredNodes) {
  if (darCheckerMap != undefined && node != undefined && node.nodeType != undefined && darCheckerMap[node.nodeType] == undefined) {
    return [];
  } else {
    return darCheckerMap[node.nodeType].darCheck(node, nodes, registeredNodes);
  }
}
class TypeError {
  constructor(message, position) {
    this.message = message;
    this.position = position;
  }
}
exports.TypeError = TypeError;
class DarCheckNumber {
  darCheck(node) {
    node.outputType.value = node.value;
    return [];
  }
}
class DarCheckFunction {
  darCheck(node, nodes, registeredNodes) {
    const errors = [];
    if (node.name == "TestConstant") {
      darCheckNode(node.args[0], nodes, registeredNodes);
      if (((_3_ = (_2_ = (_1_ = node) === null || _1_ === void 0 ? void 0 : _1_.args[0]) === null || _2_ === void 0 ? void 0 : _2_.outputType) === null || _3_ === void 0 ? void 0 : _3_.value) == undefined) {
        errors.push(new TypeError("Input to TestConstant() is not constant", node.pos));
      }
    }
    return errors;
  }
}
class DarCheckBinary {
  evaluateOperation(left, right, operator) {
    if (typeof left == 'number' && typeof right == 'number') {
      if (operator == "+") {
        return left + right;
      } else if (operator == "-") {
        return left - right;
      } else if (operator == "*") {
        return left * right;
      } else if (operator == "/") {
        return left / right;
      } else {
        return 999999;
      }
    } else {
      return undefined;
    }
  }
  darCheck(node, nodes, registeredNodes) {
    const errors = darCheckNode(node.left, nodes, registeredNodes).concat(darCheckNode(node.right, nodes, registeredNodes));
    if (((_5_ = (_4_ = node.left) === null || _4_ === void 0 ? void 0 : _4_.outputType) === null || _5_ === void 0 ? void 0 : _5_.value) != undefined && ((_7_ = (_6_ = node.right) === null || _6_ === void 0 ? void 0 : _6_.outputType) === null || _7_ === void 0 ? void 0 : _7_.value) != undefined) {
      node.outputType = {
        status: node.outputType.status,
        valueType: (_9_ = (_8_ = node.left) === null || _8_ === void 0 ? void 0 : _8_.outputType) === null || _9_ === void 0 ? void 0 : _9_.valueType,
        value: this.evaluateOperation((_10_ = node.left) === null || _10_ === void 0 ? void 0 : _10_.outputType.value, (_11_ = node.right) === null || _11_ === void 0 ? void 0 : _11_.outputType.value, node.operator)
      };
    } else {
      console.log("One or both sides has no 'value'");
    }
    return errors;
  }
}
class DarCheckVariable {
  darCheck(node, nodes, registeredNodes) {
    darCheckNode(node.assignment, nodes, registeredNodes);
    if (((_13_ = (_12_ = node.assignment) === null || _12_ === void 0 ? void 0 : _12_.outputType) === null || _13_ === void 0 ? void 0 : _13_.value) != undefined) {
      node.outputType.value = node.assignment.outputType.value;
    }
    return [];
  }
}
class DarCheckIdentifier {
  darCheck(node, nodes, registeredNodes) {
    const assignmentNode = registeredNodes[node.assignmentId];
    if (((_15_ = (_14_ = assignmentNode) === null || _14_ === void 0 ? void 0 : _14_.outputType) === null || _15_ === void 0 ? void 0 : _15_.value) != undefined) {
      node.outputType.value = assignmentNode.outputType.value;
    }
    return [];
  }
}
class DarCheckIterator {
  getRange(start, end, step) {
    let current = start;
    let out = [];
    while (current < end) {
      out.push(current);
      current += step;
    }
    return out;
  }
  darCheck(node, nodes, registeredNodes) {
    const errors = [];
    darCheckNode(node.start, nodes, registeredNodes);
    darCheckNode(node.end, nodes, registeredNodes);
    darCheckNode(node.step, nodes, registeredNodes);
    if (((_17_ = (_16_ = node.start) === null || _16_ === void 0 ? void 0 : _16_.outputType) === null || _17_ === void 0 ? void 0 : _17_.value) != undefined && ((_19_ = (_18_ = node.end) === null || _18_ === void 0 ? void 0 : _18_.outputType) === null || _19_ === void 0 ? void 0 : _19_.value) != undefined && ((_21_ = (_20_ = node.step) === null || _20_ === void 0 ? void 0 : _20_.outputType) === null || _21_ === void 0 ? void 0 : _21_.value) != undefined) {
      const start = (_23_ = (_22_ = node.start) === null || _22_ === void 0 ? void 0 : _22_.outputType) === null || _23_ === void 0 ? void 0 : _23_.value;
      const end = (_25_ = (_24_ = node.end) === null || _24_ === void 0 ? void 0 : _24_.outputType) === null || _25_ === void 0 ? void 0 : _25_.value;
      const step = (_27_ = (_26_ = node.step) === null || _26_ === void 0 ? void 0 : _26_.outputType) === null || _27_ === void 0 ? void 0 : _27_.value;
      console.log("start, end, step:", start, end, step);
      node.values = this.getRange(start, end, step);
    } else {
      console.log("Iterator used with non constant stuff");
      errors.push(new TypeError("Non constant value used in iterator decleration", node.pos));
    }
    return errors;
  }
}
class DarCheckAny {
  darCheck(node) {
    return [];
  }
}
const darCheckerMap = {
  'Number': new DarCheckNumber(),
  'Boolean': new DarCheckAny(),
  'BinaryOperation': new DarCheckBinary(),
  'Function': new DarCheckFunction(),
  'Choose': new DarCheckAny(),
  'VariableAssignment': new DarCheckVariable(),
  'Identifier': new DarCheckIdentifier(),
  'Iterator': new DarCheckIterator(),
  'RangeIdentifier': new DarCheckAny(),
  'SinkAssignment': new DarCheckAny(),
  'String': new DarCheckAny(),
  'Pair': new DarCheckAny(),
  'CalculatorReference': new DarCheckAny(),
  'Program': new DarCheckAny()
};

},

// src/position.ts @41
41: function(__fusereq, exports, module){
function token2pos(token) {
  return {
    first_line: token.line,
    last_line: token.line,
    first_column: token.first_column,
    last_column: token.last_column
  };
}
exports.token2pos = token2pos;
function join(start, end) {
  return {
    first_line: start.first_line,
    last_line: end.last_line,
    first_column: start.first_column,
    last_column: end.last_column
  };
}
exports.join = join;
function pos2string(pos) {
  return pos.first_line.toString() + "." + pos.first_column.toString() + "." + pos.last_line.toString() + "." + pos.last_column.toString();
}
exports.pos2string = pos2string;
class ParseError {
  constructor(message, position) {
    this.message = message;
    this.position = position;
  }
}
exports.ParseError = ParseError;

},

// src/findBase.ts @49
49: function(__fusereq, exports, module){
function findBases(node, dependsMap) {
  if (node == undefined || node.nodeType == undefined) {
    return [];
  } else {
    return baseMap[node.nodeType].findBase(node, dependsMap);
  }
}
exports.findBases = findBases;
class BaseNumber {
  findBase(node) {
    return [];
  }
}
class BaseBoolean {
  findBase(node) {
    return [];
  }
}
class BaseBinary {
  findBase(node, dependsMap) {
    let baseList = [];
    let leftList = findBases(node.left, dependsMap);
    baseList = baseList.concat(leftList);
    let rightList = findBases(node.right, dependsMap);
    baseList = baseList.concat(rightList);
    return baseList;
  }
}
class BaseFunction {
  findBase(node, dependsMap) {
    console.log("in base function");
    let baseList = [];
    if (node.name == "Input") {
      baseList.push(node.nodeId);
    } else {
      for (let i = 0; i < node.args.length; i++) {
        baseList = baseList.concat(findBases(node.args[i], dependsMap));
      }
    }
    return baseList;
  }
}
class BaseChoose {
  findBase(node, dependsMap) {
    let baseList = [];
    let consBases = findBases(node.case.consequent, dependsMap);
    baseList = baseList.concat(consBases);
    let otherBases = findBases(node.otherwise, dependsMap);
    baseList = baseList.concat(otherBases);
    return baseList;
  }
}
class BaseVariableAssignment {
  findBase(node) {
    return [];
  }
}
class BaseIdentifier {
  findBase(node, dependsMap) {
    return dependsMap[node.assignmentId];
  }
}
class BaseIterator {
  findBase(node) {
    return [];
  }
}
const baseMap = {
  'Number': new BaseNumber(),
  'Boolean': new BaseBoolean(),
  'BinaryOperation': new BaseBinary(),
  'Function': new BaseFunction(),
  'Choose': new BaseChoose(),
  'VariableAssignment': new BaseVariableAssignment(),
  'Identifier': new BaseIdentifier(),
  'Iterator': new BaseIterator()
};

},

// src/parselet.ts @39
39: function(__fusereq, exports, module){
var _1_, _2_;
var _3_, _4_;
exports.__esModule = true;
var position_1 = __fusereq(41);
var findBase_1 = __fusereq(49);
class NumberParselet {
  parse(_parser, _tokens, token, varMap, registeredNodes, dependsMap) {
    const position = position_1.token2pos(token);
    const id = position_1.pos2string(position);
    let newNode = {
      nodeType: 'Number',
      value: parseFloat(token.text),
      outputType: {
        status: 'Definitely',
        valueType: 'number',
        value: undefined
      },
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}
exports.NumberParselet = NumberParselet;
class BooleanParselet {
  constructor(value) {
    this.value = value;
  }
  parse(_parser, _tokens, token, varMap, registeredNodes, dependsMap) {
    const position = position_1.token2pos(token);
    const id = position_1.pos2string(position);
    let newNode = {
      nodeType: 'Boolean',
      value: this.value,
      outputType: {
        status: 'Definitely',
        valueType: 'boolean',
        value: undefined
      },
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}
exports.BooleanParselet = BooleanParselet;
class ParenParselet {
  parse(parser, tokens, _token, varMap, registeredNodes, dependsMap) {
    const exp = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    tokens.expectToken(')');
    return exp;
  }
}
exports.ParenParselet = ParenParselet;
class BracketParselet {
  parse(parser, tokens, token, varMap, registeredNodes, dependsMap) {
    const arg1 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    const arg2 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    const arg3 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    tokens.expectToken(']');
    const position = position_1.token2pos(token);
    const id = position_1.pos2string(position);
    let newNode = {
      nodeType: 'Iterator',
      outputType: undefined,
      pos: position,
      nodeId: id,
      index: 0,
      values: [],
      start: arg1,
      end: arg2,
      step: arg3
    };
    console.log("The Iterator parslet is running!");
    registeredNodes[id] = newNode;
    return newNode;
  }
}
exports.BracketParselet = BracketParselet;
class ConsequentParselet {
  constructor(tokenType, associativity) {
    this.tokenType = tokenType;
    this.associativity = associativity;
  }
}
exports.ConsequentParselet = ConsequentParselet;
class BinaryOperatorParselet extends ConsequentParselet {
  constructor(tokenType, associativity) {
    super(tokenType, associativity);
    this.tokenType = tokenType;
  }
  parse(parser, tokens, left, token, varMap, registeredNodes, dependsMap) {
    const bindingPower = parser.bindingPower(token);
    const right = parser.parse(tokens, this.associativity == 'left' ? bindingPower : bindingPower - 1, varMap, registeredNodes, dependsMap);
    const position = position_1.join(left.pos, position_1.token2pos(tokens.last()));
    const id = position_1.pos2string(position);
    let newNode = {
      nodeType: 'BinaryOperation',
      operator: this.tokenType,
      left,
      right,
      outputType: {
        status: 'Maybe-Undefined',
        valueType: undefined,
        value: undefined
      },
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}
exports.BinaryOperatorParselet = BinaryOperatorParselet;
class FunctionParselet {
  parse(parser, tokens, token, varMap, registeredNodes, dependsMap) {
    const position = position_1.token2pos(token);
    const id = position_1.pos2string(position);
    tokens.expectToken('(');
    const arg1 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    let args = [arg1];
    if (token.text == "ParseOrderedPair") {
      const arg2 = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
      args.push(arg2);
    }
    tokens.expectToken(')');
    let newNode = {
      nodeType: 'Function',
      name: token.text,
      args: args,
      outputType: {
        status: 'Maybe-Undefined',
        valueType: undefined,
        value: undefined
      },
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}
exports.FunctionParselet = FunctionParselet;
class ChooseParselet {
  parse(parser, tokens, token, varMap, registeredNodes, dependsMap) {
    const position = position_1.token2pos(token);
    const id = position_1.pos2string(position);
    const predicate = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    const consequent = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    tokens.expectToken('CHOOSE2');
    const otherwise = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    let newNode = {
      nodeType: 'Choose',
      case: {
        predicate: predicate,
        consequent: consequent
      },
      otherwise: otherwise,
      outputType: {
        status: 'Maybe-Undefined',
        valueType: undefined,
        value: undefined
      },
      pos: position,
      nodeId: id
    };
    registeredNodes[id] = newNode;
    return newNode;
  }
}
exports.ChooseParselet = ChooseParselet;
class VariableAssignmentParselet {
  parse(parser, tokens, token, varMap, registeredNodes, dependsMap) {
    const position = position_1.token2pos(token);
    const id = position_1.pos2string(position);
    tokens.expectToken('=');
    const assignment = parser.parse(tokens, 0, varMap, registeredNodes, dependsMap);
    varMap[token.text] = id;
    if (token.text.indexOf("%") != -1) {
      let newNode = {
        nodeType: 'VariableAssignment',
        name: token.text,
        assignment: assignment,
        outputType: {
          status: "Maybe-Undefined",
          valueType: (_2_ = (_1_ = assignment) === null || _1_ === void 0 ? void 0 : _1_.outputType) === null || _2_ === void 0 ? void 0 : _2_.valueType,
          value: undefined
        },
        pos: position,
        nodeId: id
      };
      registeredNodes[id] = newNode;
      dependsMap[id] = findBase_1.findBases(assignment, dependsMap);
      return newNode;
    } else {
      let newNode = {
        nodeType: 'VariableAssignment',
        name: token.text,
        assignment: assignment,
        outputType: {
          status: "Maybe-Undefined",
          valueType: (_4_ = (_3_ = assignment) === null || _3_ === void 0 ? void 0 : _3_.outputType) === null || _4_ === void 0 ? void 0 : _4_.valueType,
          value: undefined
        },
        pos: position,
        nodeId: id
      };
      registeredNodes[id] = newNode;
      dependsMap[id] = findBase_1.findBases(assignment, dependsMap);
      return newNode;
    }
  }
}
exports.VariableAssignmentParselet = VariableAssignmentParselet;
class IdentifierParselet {
  parse(parser, tokens, token, varMap, registeredNodes, dependsMap) {
    const position = position_1.token2pos(token);
    const id = position_1.pos2string(position);
    const assignmentId = varMap[token.text];
    if (!assignmentId) {
      const varParselet = new VariableAssignmentParselet();
      return varParselet.parse(parser, tokens, token, varMap, registeredNodes, dependsMap);
    } else {
      if (token.text.indexOf("%") != -1) {
        let newNode = {
          nodeType: 'RangeIdentifier',
          name: token.text,
          assignmentId: assignmentId,
          outputType: {
            status: "Maybe-Undefined",
            valueType: undefined,
            value: undefined
          },
          pos: position,
          nodeId: id
        };
        registeredNodes[id] = newNode;
        return newNode;
      } else {
        let newNode = {
          nodeType: 'Identifier',
          name: token.text,
          assignmentId: assignmentId,
          outputType: {
            status: "Maybe-Undefined",
            valueType: undefined,
            value: undefined
          },
          pos: position,
          nodeId: id
        };
        registeredNodes[id] = newNode;
        return newNode;
      }
    }
  }
}
exports.IdentifierParselet = IdentifierParselet;

},

// src/tokenstream.ts @40
40: function(__fusereq, exports, module){
exports.__esModule = true;
var lexer_1 = __fusereq(19);
var position_1 = __fusereq(41);
class TokenStream {
  constructor(text) {
    this.pos = 0;
    this.tokens = lexer_1.getTokens(text).filter(t => t.type != 'COMMENT');
  }
  consume() {
    const token = this.tokens[this.pos];
    if (token) {
      this.pos += 1;
    }
    return token;
  }
  peek() {
    return this.tokens[this.pos];
  }
  last() {
    return this.tokens[this.pos - 1];
  }
  expectToken(expectedType) {
    const actual = this.consume();
    if (!actual) {
      throw new position_1.ParseError(`Expected "${expectedType}" token but found none.`, position_1.token2pos(this.last()));
    }
    if (actual.type != expectedType) {
      throw new position_1.ParseError(`Expected "${expectedType}" token type but found "${actual.type}".`, position_1.token2pos(actual));
    }
    return actual;
  }
}
exports.TokenStream = TokenStream;

},

// src/parser.ts @22
22: function(__fusereq, exports, module){
exports.__esModule = true;
var parselet_1 = __fusereq(39);
var tokenstream_1 = __fusereq(40);
var position_1 = __fusereq(41);
function parse(text, varMap, registeredNodes, dependsMap) {
  const nodes = [];
  const tokens = new tokenstream_1.TokenStream(text);
  const parser = new Parser();
  while (tokens.peek()) {
    try {
      nodes.push(parser.parse(tokens, 0, varMap, registeredNodes, dependsMap));
    } catch (e) {
      return {
        nodes,
        errors: [e]
      };
    }
  }
  return {
    nodes,
    errors: []
  };
}
exports.parse = parse;
class AbstractParser {
  constructor() {
    this.bindingPowers = {};
    const bindingClasses = this.bindingClasses();
    for (let i = 0; i < bindingClasses.length; i++) {
      for (const tokenType of bindingClasses[i]) {
        this.bindingPowers[tokenType] = 10 * i + 9;
      }
    }
    for (const tokenType of Object.keys(this.consequentMap)) {
      if (this.bindingPowers[tokenType] == undefined) {
        throw new Error(`Token ${tokenType} defined in consequentMap has no associated binding power.
          Make sure it is also listed in bindingClasses.`);
      }
    }
  }
  bindingPower(token) {
    if (this.bindingPowers[token.type] != undefined) {
      return this.bindingPowers[token.type];
    } else {
      throw new position_1.ParseError(`Unexpected token type ${token.type}.`, position_1.token2pos(token));
    }
  }
  parse(tokens, currentBindingPower, varMap, registeredNodes, dependsMap) {
    const token = tokens.consume();
    if (!token) {
      throw new position_1.ParseError(`Unexpected end of tokens.`, position_1.token2pos(tokens.last()));
    }
    const initialParselet = this.initialMap()[token.type];
    if (!initialParselet) {
      throw new position_1.ParseError(`Unexpected token type ${token.type}`, position_1.token2pos(token));
    }
    let left = initialParselet.parse(this, tokens, token, varMap, registeredNodes, dependsMap);
    while (true) {
      const next = tokens.peek();
      if (!next) {
        break;
      }
      const consequentParselet = this.consequentMap()[next.type];
      if (!consequentParselet) {
        break;
      }
      if (currentBindingPower >= this.bindingPower(next)) {
        break;
      }
      tokens.consume();
      left = consequentParselet.parse(this, tokens, left, next, varMap, registeredNodes, dependsMap);
    }
    return left;
  }
}
exports.AbstractParser = AbstractParser;
class Parser extends AbstractParser {
  initialMap() {
    return {
      NUMBER: new parselet_1.NumberParselet(),
      TRUE: new parselet_1.BooleanParselet(true),
      FALSE: new parselet_1.BooleanParselet(false),
      '(': new parselet_1.ParenParselet(),
      '[': new parselet_1.BracketParselet(),
      FUNCTION: new parselet_1.FunctionParselet(),
      CHOOSE1: new parselet_1.ChooseParselet(),
      IDENTIFIER: new parselet_1.IdentifierParselet()
    };
  }
  consequentMap() {
    return {
      '+': new parselet_1.BinaryOperatorParselet('+', 'left'),
      '-': new parselet_1.BinaryOperatorParselet('-', 'left'),
      '*': new parselet_1.BinaryOperatorParselet('*', 'left'),
      '/': new parselet_1.BinaryOperatorParselet('/', 'left'),
      '|': new parselet_1.BinaryOperatorParselet('|', 'right'),
      '&': new parselet_1.BinaryOperatorParselet('&', 'right')
    };
  }
  bindingClasses() {
    const classes = [['+', '-'], ['*', '/'], ['|', '&']];
    return classes;
  }
}
exports.Parser = Parser;

},

// src/parseResults.ts @8
8: function(__fusereq, exports, module){
exports.__esModule = true;
var state_1 = __fusereq(15);
var parser_1 = __fusereq(22);
exports.parseResults = state_1.StateField.define({
  create() {
    return emptyParseResults;
  },
  update(value, tr) {
    return tr.docChanged ? parseProgram(tr) : value;
  }
});
function parseProgram(tr) {
  const contents = tr.state.doc.toString();
  let varMap = {};
  let registeredNodes = {};
  let dependsMap = {};
  const ast = parser_1.parse(contents, varMap, registeredNodes, dependsMap);
  return {
    nodes: ast.nodes,
    parseErrors: ast.errors,
    varMap: varMap,
    registeredNodes: registeredNodes,
    dependsMap: dependsMap
  };
}
const emptyParseResults = {
  nodes: [],
  parseErrors: [],
  varMap: {},
  registeredNodes: {},
  dependsMap: {}
};

},

// src/miniCL.ts @6
6: function(__fusereq, exports, module){
exports.__esModule = true;
var lexer_1 = __fusereq(19);
var typechecker_1 = __fusereq(20);
var darChecker_1 = __fusereq(21);
var parseResults_1 = __fusereq(8);
exports.miniCL = {
  startState: function () {
    return {
      line: 1,
      stack: ['default']
    };
  },
  token: function (stream, state) {
    if (stream.eatSpace()) return null;
    return token2tag(lexer_1.getDefaultToken(stream, state));
  }
};
exports.miniCLLinter = () => view => {
  const results = view.state.field(parseResults_1.parseResults);
  let assertMap = [];
  const darErrors = darChecker_1.darCheck(results.nodes, results.registeredNodes);
  const typeErrors = typechecker_1.typecheck(results.nodes, results.registeredNodes);
  const parseDiagnostics = results.parseErrors.map(makeDiagnostic(view));
  const typeDiagnostics = typeErrors.map(makeDiagnostic(view));
  const darDiagnostics = darErrors.map(makeDiagnostic(view, 'warning'));
  return parseDiagnostics.concat(typeDiagnostics).concat(darDiagnostics);
};
const makeDiagnostic = (view, severity = 'error') => error => {
  return {
    from: firstLine(view, error) + error.position.first_column,
    to: lastLine(view, error) + error.position.last_column,
    message: error.message,
    severity: severity
  };
};
function firstLine(view, error) {
  return view.state.doc.line(error.position.first_line).from;
}
function lastLine(view, error) {
  return view.state.doc.line(error.position.last_line).from;
}
function token2tag(token) {
  switch (token) {
    case 'NUMBER':
      return 'number';
    case 'TRUE':
      return 'boolean';
    case 'FALSE':
      return 'boolean';
    case '(':
    case ')':
      return 'bracket';
    case '+':
    case '-':
    case '*':
    case '/':
    case '|':
    case '&':
    case '=':
      return 'operator';
    case 'COMMENT':
      return 'comment';
    case 'CHOOSE1':
    case 'CHOOSE2':
      return 'choose';
    case 'FUNCTION':
      return 'function';
    case 'IDENTIFIER':
      return 'variable';
    case 'ERROR':
      return 'error';
    default:
      return undefined;
  }
}

},

// src/visualization.ts @29
29: function(__fusereq, exports, module){
var _1_;
exports.__esModule = true;
var d3_hierarchy_1 = __fusereq(46);
var d3_selection_1 = __fusereq(47);
var d3_shape_1 = __fusereq(48);
function visualize(nodes) {
  const margin = {
    top: 20,
    right: 90,
    bottom: 20,
    left: 90
  };
  const height = 300 - margin.top - margin.bottom;
  const width = 500 - margin.left - margin.right;
  d3_selection_1.select('#viz').selectAll('svg').remove();
  const viz = d3_selection_1.select('#viz').append('svg');
  viz.selectAll('*').remove();
  viz.attr('width', width + margin.left + margin.right).attr('height', height + margin.top + margin.bottom);
  const root = {
    nodeType: 'Program',
    children: nodes
  };
  const treemap = d3_hierarchy_1.tree().size([height, width]).separation(() => 1);
  const treelayout = d3_hierarchy_1.hierarchy(root, getChildren);
  const tree = treemap(treelayout);
  const g = viz.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`).attr("font-family", "sans-serif").attr("font-size", 12);
  const link = g.selectAll('path.link').data(tree.links());
  const linkEnter = link.enter().append('path', 'g');
  linkEnter.attr('class', 'link').attr('fill', 'none').attr("stroke-opacity", 0.4).attr('stroke', '#555').attr("stroke-width", 1.5).attr('d', connection);
  const node = g.selectAll('g.node').data(tree.descendants());
  const nodeEnter = node.enter().append('g');
  nodeEnter.attr('class', 'node').attr('transform', d => `translate(${d.y}, ${d.x})`);
  nodeEnter.append('circle').attr("fill", getFill).attr('r', '2.5').attr('stroke-width', 10);
  nodeEnter.append('text').attr("dy", "0.31em").attr("x", d => d.children ? -8 : 8).attr("text-anchor", d => d.children ? "end" : "start").attr('fill', d => isUndefined(d) ? '#fc6666' : 'black').style("fill-opacity", 1).call(getTextBox).datum(d => d.data).text(getText).clone(true).lower().attr("stroke", "white");
  nodeEnter.filter((d, i) => isUndefined(d)).call(yep).insert('rect', 'text').attr("x", function (d) {
    return d.bbox.x;
  }).attr("y", function (d) {
    return d.bbox.y;
  }).attr("width", function (d) {
    return d.bbox.width;
  }).attr("height", function (d) {
    return d.bbox.height;
  }).attr('fill', 'black');
}
exports.visualize = visualize;
function getTextBox(selection) {
  selection.each(function (d) {
    d.bbox = this.getBBox();
  });
}
function yep(selection) {}
const connection = d3_shape_1.linkHorizontal().x(d => d.y).y(d => d.x);
function getChildren(node) {
  var children = [];
  switch (node.nodeType) {
    case 'Program':
      node = node;
      children = node.children;
      break;
    case 'Function':
      node = node;
      children = node.args;
      break;
    case 'Choose':
      node = node;
      children = [node.case.predicate, node.case.consequent, node.otherwise];
      break;
    case 'BinaryOperation':
      node = node;
      children = [node.left, node.right];
      break;
    case 'VariableAssignment':
      node = node;
      children = [node.assignment];
      break;
    default:
      children = [];
  }
  return children;
}
function getText(node) {
  var text = "";
  switch (node.nodeType) {
    case 'Program':
      text = '';
      break;
    case 'Function':
      node = node;
      text = node.name;
      break;
    case 'Choose':
      text = "choose";
      break;
    case 'BinaryOperation':
      node = node;
      text = node.operator;
      break;
    case 'VariableAssignment':
      node = node;
      text = node.name;
      break;
    case 'Identifier':
      node = node;
      text = node.name;
      break;
    case 'Number':
      node = node;
      text = node.value.toString();
      break;
    case 'Boolean':
      node = node;
      text = node.value.toString();
      break;
    default:
      text = "";
  }
  return text;
}
function getFill(node) {
  if (isUndefined(node)) {
    return '#fc6666';
  }
  if (node.children) {
    return '#555';
  } else {
    return '#999';
  }
}
function isUndefined(d) {
  return ((_1_ = d.data.outputType) === null || _1_ === void 0 ? void 0 : _1_.status) === 'Maybe-Undefined';
}

},

// src/devTools.ts @9
9: function(__fusereq, exports, module){
exports.__esModule = true;
var lang_json_1 = __fusereq(27);
var fold_1 = __fusereq(28);
var visualization_1 = __fusereq(29);
var basic_setup_1 = __fusereq(4);
var lint_1 = __fusereq(5);
var parseResults_1 = __fusereq(8);
function updateDevTools(tr) {
  const results = tr.state.field(parseResults_1.parseResults);
  const astJSON = JSON.stringify(results.nodes, null, 2);
  replaceContents(astViewer, astJSON);
  const dependsJSON = JSON.stringify(results.dependsMap, null, 2);
  replaceContents(dependsViewer, dependsJSON);
  visualization_1.visualize(results.nodes);
}
exports.updateDevTools = updateDevTools;
function newJSONViewerState() {
  return basic_setup_1.EditorState.create({
    extensions: [basic_setup_1.basicSetup, lang_json_1.json(), lint_1.linter(lang_json_1.jsonParseLinter()), basic_setup_1.EditorView.editable.of(false)]
  });
}
let astViewer = new basic_setup_1.EditorView({
  state: newJSONViewerState(),
  parent: document.querySelector("#ast-json")
});
let dependsViewer = new basic_setup_1.EditorView({
  state: newJSONViewerState(),
  parent: document.querySelector("#depends-json")
});
function replaceContents(editor, contents) {
  const update = editor.state.update({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: contents
    }
  });
  editor.update([update]);
  fold_1.foldAll(editor);
}

},

// src/styles.css @10
10: function(__fusereq, exports, module){
__fusereq(11)("src/styles.css","main h1 {\r\n  color: darkslategray;\r\n}\r\n\r\n#miniCL {\r\n  margin-top: 50px;\r\n  margin-bottom: 50px;\r\n}\r\n\r\n#analysis {\r\n  margin-top: 50px;\r\n  padding: 50px;\r\n}\r\n\r\n#icons {\r\n  display: none;\r\n}\r\n\r\n/** Bootstrap overrides **/\r\n.nav-pills .nav-link.active, .nav-pills .show > .nav-link {\r\n  background-color: #bbb;\r\n}\r\n\r\n/** From Desmos's styles **/\r\n\r\n.instructions {\r\n  color: #bbb;\r\n}\r\n\r\n.title {\r\n  font-family: \"HelveticaNeue-Light\", \"Helvetica Neue Light\", \"Helvetica Neue\", Helvetica, Arial, \"Lucida Grande\", sans-serif;\r\n  font-weight: 300;\r\n  font-size: 20.8px;\r\n  text-transform: uppercase;\r\n}\r\n\r\n.instructions .pillow-icon-sparkline {\r\n  font-size: 150%;\r\n  position: relative;\r\n  top: 3px;\r\n  margin: 0 2px;\r\n}\r\n\r\n")
},

// src/desmos_icons.css @12
12: function(__fusereq, exports, module){
__fusereq(11)("src/desmos_icons.css","@font-face {\r\n  font-family: 'desmos-icons';\r\n  src: url(\"data:application/x-font-ttf;charset=utf-8;base64,AAEAAAALAIAAAwAwT1MvMg8SBtwAAAC8AAAAYGNtYXAXVtMFAAABHAAAAFRnYXNwAAAAEAAAAXAAAAAIZ2x5ZvijFdAAAAF4AACe1GhlYWQcYmz/AACgTAAAADZoaGVhCJQFHgAAoIQAAAAkaG10eB3EJ2UAAKCoAAACDGxvY2F8PaP0AACitAAAAQhtYXhwAJwCLwAAo7wAAAAgbmFtZWUrmMAAAKPcAAABwnBvc3QAAwAAAACloAAAACAAAwQ0AZAABQAAApkCzAAAAI8CmQLMAAAB6wAzAQkAAAAAAAAAAAAAAAAAAAABEAAAAAAAAAAAAAAAAAAAAABAAADpfgPA/8AAQAPAAEAAAAABAAAAAAAAAAAAAAAgAAAAAAADAAAAAwAAABwAAQADAAAAHAADAAEAAAAcAAQAOAAAAAoACAACAAIAAQAg6X7//f//AAAAAAAg6QD//f//AAH/4xcEAAMAAQAAAAAAAAAAAAAAAQAB//8ADwABAAAAAAAAAAAAAgAANzkBAAAAAAEAAAAAAAAAAAACAAA3OQEAAAAAAQAAAAAAAAAAAAIAADc5AQAAAAADAKkAGAMWA2gAFAApAGkAAAEUBgcVIiYjIgYjNS4BNTQ2MzIWFREUBiMiJjU0NjcRMjYzMhYzER4BFRMHDgEjIiYnJjY/AS4BJyImIyIGIwYHDgEHBhUUBiMiJjU0Nz4BNzY3NjIzOgEXHgEXJyY2Nz4BMzIWHwEWBgcCTRwWCA8ICBAIFhsvIiEwMCEiLxwVCBAICA8IFhy6dQMHAwkPBAYJCy0eRiUIDwgIEAgzLS1CEhMTDQ0SGBhTODhACBAHCBAILFMlGQYJDAMHAwkPBDgGCQwDFxkpCWABAWAJKRkhMDAh/VIhMDAhGSkJARUBAf7rCSkZAVY4AQIKCAwYBhUQEwMBAQQQEDAgHyQNEhINMCsrQRUVBAEBAxYTNgwYBQICCgh1DBgGAAADAC0BRQPTAjsADAAYADcAAAEiBhUUFjMyNjU0JiMFIgYVFBYzMjY1NCYFJyYiBwYUHwEjIgYVFBY7AQcGFBceATMyNj8BNjQnA1czSEgzM0lJM/0rIzIyIyMyMgHrWwkaCQkJJvYMExMM9iYJCQULBgYLBVsJCQI7SDMzSEgzM0goMSMjMjIjIzE9WgkJCRkJJhINDRImCRoJBAUFBFsJGgkAAAIAUwAaA6gDbAALADAAAAEUBiMiJjU0NjMyFgcVFAYjIiY9AQEeARUUBiMiJjU0NjMyFhcBIyImNTQ2OwEyFhUDqDAiIi8vIiIwmxMNDRL+IgMDMCIiLy8iCRAHAd02DRMTDYMMEwMaITAwISIwMImCDRMTDTb+IgcPCCEwMCEiMAMDAd0SDQ0TEw0AAQCQABADbQN0ADUAAAEVFAYjIiY9ATQmKwEDFBY7ATIWFRQGIyEiJjU0NjsBMjY1EyMiBh0BFAYjIiY9ATQ2MyEyFgNtGRESGBoSxAIZEj4RGRkR/tsSGBgSPBIZAsQSGRkREhkZEgKIERkDSqwRGRkRVhIa/XASGRkREhkZEhEZGRICkBoSVhIYGRGsERkYAAAAAAYACABIA/gDNwAMADEAQABPAH4AiwAAJQ4BIzI2NzQwMQ4BBwEjNTQmJy4BIyIGBy4BIyIGBw4BHQEjIgYVERQWMyEyNjURNCYlPgEzMhYXES4BIyIGBxEFPgEzMhYXES4BIyIGBxEBIREzERQWFx4BMzI2Nz4BMzIWFx4BFx4BMzI2Nz4BNz4BMzIWFxY2Nz4BNREzESUwIiMiJiceARceARcCDAMGAwYLBQIGAgHBRgwKKmI0MFonJ1owNGIqCgxGEhkZEgOaEhkZ/kYgRyUnSCAhSCYlRiH+myBIJydIICFIJiZIIQLx/J4qCAcFCgUEBgQjVC4qTyICBgIDBgMDBgMCBgIiTyouVCMJEQgHCCr+TwEBBQsEAgYCAwYDtAECAwMBAQIBAhQsCxIEEREODg4OEREEEgssGhL92BIaGhICKBIaFAoKCwr+KwkJCAkB1QEKCwsK/isJCQkJAdX9tQHx/lQJEAUDAwIBDg8NDAECAQECAgEBAgEMDQ8OBAIFBRAJAaz+DyEEAwECAQEBAQAABAARAA8D7wNxACQAKQAuAEkAAAEjNTQmIyEiBh0BIyIGFREUFjsBFRQWMyEyNj0BMzI2NRE0JiMlIRUhNQEhNSEVNxQGKwE1NCYjISIGHQEjIiY1ETQ2MyEyFhURA4JrIBb+PxcfbC1AQC1yHhUBxhUeZi1AQC39tQGS/m4Bmf5tAZLTEw1lHxX+OhUecg0TEw0DBA0TAn2+Fx8fF71ALf7TLUA1FR4eFTVALQEsLj+np6f9OIODiA0TNRUfHxU1Ew0BLA4SEg7+1AAAAgB/AKoDgQLWABAAFAAAExEUFjMhMjY1ETQmIyEiBhUlESERfx0VAp4UHh4U/WIVHQKp/bACpf42FB0dFAHKFB0dFAv+IAHgAAAAAAUAGACWA+gC6gATABgAOgBcAH4AACUyNj0BIRE0JiMhIgYVESEVFBYzJSERIREXMAYHIwciBiMhIiYjJy4BIzU0NjMhHgE7ATI2NSEyFh0BDwEiBiMhIiYjJy4BIzU0NjMhHgE7ATI2NSEyFh0BMAYHIzcVMAYHIwciBiMhIiYjJy4BIzU0NjMhHgE7ATI2NSEyFhUCXgMFARkUD/1IDhUBJAQDAab9XAKklgMCATwCBgL8ygIGAj8CAgEGBQFxAQoHswcKAXQEBgY8AgYC/MoCBgI/AgIBBgUBcQEKB7MHCgF0BAYDAgEGAwIBPAIGAvzKAgYCPwICAQYFAXEBCgezBwoBdAQGxAQDCAH0DxQUD/4MCAMFOgG//kFDAgEgAQEgAQIGAwQHCQkHBAMGAyABASABAgYDBAcJCQcEAwYCAQkGAgEgAQEgAQIGAwQHCQkHBAMAAAAAAgEhAEEC3wM/ABAAFQAAASEiBhURFBYzITI2NRE0JiMTIREhEQKo/rAXICAXAVAXICAXDf6WAWoDPyAX/XAXICAXApAXIP1lAjj9yAAAAAAIAA8AAgQ7A34AGAAxAEoAYgBnAGwAcQCKAAATLgEjIgYHDgEVFBYXHgEzMjY3PgE1NiYnBw4BIyImJy4BNTQ2Nz4BMzIWFx4BFRQGBxcuASMiBgcOARUUFhceATMyNjc+ATU2JicHDgEjIiYnLgE1NDY3PgEzMhYXHgEVFgYTIRUhNREhFSE1ESEVITUDFAYHDgEjIiYnLgE1NDY3PgEzMhYXHgEV2BEpGRgpERAUEBEQKRkZKRARFAITECoJFQwNEwkICAgICRUMDRUJCAgJCSoRKRkYKREQFBARECkZGSkQERQCExAqCRUMDRUICQgICQgVDQwVCQgIAgmWArP9TQIv/dEC7v0SURETESkZGCkREBMSExAqGBkpEQ8TAhIRFBITECkZGSkQERQSExApGRkpEHwICQkICBYMDBYICAkJCAgWDAwWCM8RFBEQECoYGSkREBQRExEpGRMrEH4ICAgICBYMDRUICAkJCAgVDQ4SAulWVv6qVlb+tFZWAm8ZKRARFBEQESsYGSkREBQREw4pGgAAAAAEAKwAQgQqA8AAFgAmAGEA4AAAASIGByEiBhURFBYzITI2NRE+ATU0JiMDFAYjISImNRE0NjMhHgEXNwYmKwEcARU4ATEcARUcAQcGIicmNj0BIyIGJyY0Nz4BMzE6ATsBNiY1NDY3NhYXFhQdATM2FhcOAQcDMQYmJy4BJzQmNS4BJzAiIyIGBw4BBw4BBw4BJy4BJy4BJzUuAScuAScmBgcOAQ8BDgEPAQ4BBw4BIyoBJy4BJyY0Nz4BPwE+ATc+AT0BPgE3PgE3PgEXHgEXHgEXHgEXHgEXFjY3PgE3PgE3PgE3NhYXHgEXFBYVHgEXFgYHA25Gagv+dzRKSjQB5TRKQ1puTiElG/4dGiYlGwGHClU9lAQfDSoHBBsECAEqDh4EAgIDEwsEBwQqAQECCwsXAgJACg0FAgEB3Q0YBQMEAwEDBQUBAQMFAwMEBAQLCRY8IxcdBAMFAgEFAwkRCAYOBA0PBQQBBQMCAQYEBA8KAwcDBQkCAwMCBAECAQMBAgIBAQIHExMRLBYiJAgEBgMBBAIGDgQOFAgHCQQEBwQOHAsMGgsSDQQCAQMBBwgLA8BaQ0o0/hs0Sko0AYcLakZPb/0AGiYmGgHjGiY7VwqwCAEJEgoHDgYKDwMDAwQgDSsBCAQaBQYDDSIPDBABAgMIBAwEPgECBwUbBP5vBQoMBw0FAwMCCwgDBQQDCgYIFQseEg0KMAoHDwUCBwwFFRYBAQcFDigTDQMTBwYFDggICgEDCAYFDQYFCwYDBAoEAwgCBAMFAxY1FhMQBAc2EggSBwcKBQ0TAgYGDAkSBgcNBhIOAQEGCA4bDAEFAwQKAwwYBgAAAAQAuQClBEcC2wAhAC8APQBEAAABKgEjIgYHLgEjISIGFREUFjMhDgEHISImNRE0NjMhMhYXByIGFRQWMzEyNjU0JiMXDgEjIiYnMzgBMQ4BBxchPgEzMhYDiQMDAwwZDAocD/4XGyYmGwGhDRcJ/owyRkcxAecmPQ4JQFpbPz9bWz9jETQgJj8O6AMIBWT+cB1qQEFsAo0DBQ0PJhz+3BwmDRsPSDIBJTNHLCIfWz9AWVo/QVnjFxwqIwcMB+Y1Q0IAAAADAFIABQPqA3sAKwBXAH4AABMyNj8BFxY2Nz4BLwE3PgEnLgEjLwEuASMiBg8CIgYVBhYfAQcGFhceATMBMjY/ARcWMjc+AS8BNz4BJy4BIy8BLgEjIgYPAiIGBwYWHwEHBhYXFBYzEyInLgEnJicmNjc2FhcWFx4BFxYzOgEzPgE3NhYXFgYHDgEHMCIjkAMEA0lJBQsEAQIBEkAEAgEDCAVVIAIHBAQIASNUBQgBAwRAEwECAQIFAgHPAwMDSUoFCwQBAgISQAQDAQIHBlQhAQgEBAcCIVQFCAECAwRAEgEBAgQDaEFCQYVCQ0IKCQ8RIgo7OzpxNzc0AgEBN3E7DiQMDAENR49HAgICZQIBLCwDAQQBCAZSNwMJBAQFCE4EBgYFTQgFBAQIBDdSBgYDAwL+tQIBLCwCBAEIBlI3AwkEBAUITgUGBQZOCAUEBAgEN1IGBgMDAv7rHBxvU1NuECMJCgkPZEtLZBkaAjY2DAIMDiQMQkICAAAAAAIAO//bA8QCqwAkAFIAAAEVFAYrASczMjY9ATQmIyEiBh0BFBYzIRchIiY9ATQ2MyEyFhUBIgYfARYGDwEiBiMiJi8BNCYjIgYxBw4BIyImNS8CNDYzNDIxMhYXARYGDwEDxC0fgE3NBAUFBP0PBAUFBAERAf7uHy0tHwLxHy3+sgICAWMCAwQuAQMBAwUCYwIBAQJaAgMBAwIEAQICAgICAwIBLAUCB34CX+sfLUMFBOsEBQUE6wQFQy0f6x8tLR/+fAQC1QQJARYBBALVAgEBWwECBAXFQ4UEBAEBAv78BQcBCgAAAAADAQD/7gNJA5IAIAAtADkAAAUhIiY3EzUjIiY1NDY3PgE7ATIWFRQGBw4BKwEVExYGIwEeAQcOAScuATc+ARcXHgEHDgEnLgE3PgEDEv4lKSASuwgOEwUEBQwH3w4TBQQEDQcHvhMhKf7SFRoCAyEVFRsDAiIVXxgeAwMmGBgeAwMmEjQlASzaEw4HDAQFBRQNBwwFBAXY/tIlNAOkAyEVFRoCAyEVFRoCbwMmGBgeAwMmGBgeAAAAAQAU/8UD/AO+AGoAAAEVFBYHBiYjKgEjIiYnJjY3PgE3LgEjIgYHDgEVFBYXHgEzMjY3PgE3PgE3PgEXHgEHDgEHBgcOAQcGBwYjLgEnJicuAScmJy4BNzY3Njc+ATc2NzY3PgE3NhcWFx4BFxYXPgE3PgEzHgEVA+sBCBCEMBsvHBU5AwIvChIaEjBkSlB6Kyo9PC0reVNVeishMw4CBQQEMB0dJgMCBAMUJSRmPj9INDAxWSgnIUdlIxMKCwcFBAwLEhIuGxodHyMkUS4tMjMrK0wiIiEOHxMOJBcQAQNpuBUyDh8DAhMVKAgRHBUhKT8rLYFOTn0vKz86KCBPMwUUCQ8NBAQhEw0ZB0Y7PFwfIA4KARIQDxQpb0gmLS5fLzArKCQlQRwcFhgTFB0HBwEBCQkgFRYaDSATDykCPRYAAAAAAgDP/90DeQOjABoAJgAABSImLwEHDgEnLgE1ETQ2MyEyFhURFAYHDgEjATIWHwERIRE3PgEzA0QLFAj4+wsgDxARHxYCQBYfEg8ECwX+4QkVCMX+K8UHFAojCAf6+gsHBwUcEANcFh8fFvyiEBoHAQEBiQcHxgKn/VfGCAgAAAAFAKYAUAQzAzUAEAAVABkAJQAoAAABISIGFREUFjMhMjY1ETQmIwcBLwITBxEXAzcXHgEzMjY/ARchJSc3A+r9BB4qKh4C/B4rKx4q/qwsJvm+8PDA9D8FDgcHDgVB/P1cAsrt7QM1Kh79rB4rKx4CVB4qSf6yLSb7/tjyAePx/tb2QAUFBQVA9kHp6QAAAAAFABAAmwQ5A10ABAAMACAAMQBjAAAJARUzAQUHNSM1NxcHEwcGIiMiJjU0NjU3NjIzMhYVHAE3FAYPASc3PgEzMhYfAR4BFQUWFx4BFxYXHgE3NiY3NhceARcWFxY2Jy4BJy4BBw4BBw4BBwYmJyYnLgEnJicmBhcxA0v+4ZABH/7PJiwfUh+xvAEDAQUDArwCAwEEA9wGBzmQOAcPCgkQBlIHBvvXCgcIEQsMEhNhKSgEHhkdHjscHBQaIRobJhgaQSRILgoEBA8RGAcRCwsQBwcKBj8FAwD+35ABIfQBKyUfTx8BPb0BAwQBAwG9AQMEAQQmChAFOZE4BwYGB1IHEAiFMTIzZDExLjFAPDuZPzMBAjMjIw8TOhIUPhgYFAgSgT8dSRobKxMtMDBiMDEwHhMfAAIA9//AA1IDwABZAHwAAAE0Jy4BJyYnMQYHDgEHBhUUFx4BFxYXHgEVDgEdARQWOwEOAR0BFBY7AQ4BHQEUFjsBHgEzMjY3MzI2PQE0JiczMjY9ATQmJzMyNj0BNCYnPAE3Njc+ATc2NQcOAQcOARUjLgEnLgEnLgE1NDc+ATc2MyMyFx4BFxYVFAYHA1IXGFE3Nz8/NzdSFxgUFDQYFwcKAQQHEwwTCw8TDBILDhINEAYhFhYgBhANEg4LEgwTDgsSDBMFBAsGFxgzFBSmFSIHBwZ3AQYGByIVGjYRETooJywBLCcoOhERNxkCkD83N1IYGAEBGBhSNzc/Ki4tVSQkGCJNDwYNCQUPFgIVDQYPFQMUDgUPFhceHhcWDwUOFAMVDwYNFQIWDwUJDQQOTCQZJCVVLS4qrSE7GxkyFhYyGRs7IShiIy0nKDoREREROycoLCNiKAAACwAH/9oE0wPBAIUAkQC2ASwBXwFjAWcBcAF2AX4BhQAAATA0MTgBOQE4ATEnLgErASc3NjQvATc+ATU4ATE+ATUwNDE0JicuAScuASMiBgcOAQcOAQcwFDEUFhU4ATEUFh8CBwYWHwEHIS4BJy4BJzUwNDE0JicuASMuASsBIgYHIgYHDgEVMBQxFQ4BBw4BByMiBg8CDgEVERQWMyEyNjURNCYnATIWFw4BIyImJz4BAzE3MTc2Ji8BNzY0LwEeATMyNjcHBhQfAQcGFh8BDgEjIiYnNyU+ATM0Nj0BOgEzMDIzOAExOgExOAExOgExOgEzMhYzMDIzOAEzMDIzOgExOgE7AToBMzoBMToBMzgBMToBMzA2MzoBMzAyMzgBMToBMTgBMToBMzAyMRUUFhcwFhceARUOASMqASM4ATEwIjEqASMiJic0NjcHMx4BFx4BMzoBMzoBMzI2Nz4BNzMHDgEVFBYXHgEXHgEzMjY3PgE3PgE1NCYvATMXITcBIREhJQ4BBwMmNDUwFDEUFiUUBgc+AQUuATUUFhcnBQc+ATcUBgTRQwMJBkwoNQMETGwBAgEBFwYHFg0aRCUlRBoNFgcFFgIBAgEEYEoEAQQ7Lv7+AhYcER4FBQwDBwQIFAoBChQHBQcCDQUEHxEcFQI9BgoCQwIBAQwIBKQIDAEB/sYdMRQUMR0dMRMTMWoGOgUBBDxJBARJG0MlJEIaUAQETTYDAQRNE0w3OEwTEP3nEyABAQEBAQEBAQIBAQECAQEBAQEBAQIBAQEBAgEBAQIBAQEBAgEBAQEBAQECAQEBAQIBAQECAQEgFCMQAUk2AgMBAQEDAjZJARAkijQGGBIWOyECAwIBAwIiOhcRFwfpCgICFwYHFg0aRCUlRBoNFgcGFwMCCh0w+50xBD77hAR8/msBAwJCAQEBkwEBAQH+cAECBQIEAYsDAgMBAgE9AZIFBjJYBQwFaIkBAgECBAIBDwwBAwQBBAQEBAEEAwEMDQIBAgECBAIGhGkFDQZKPQxJUjJUC5MBAw8DAQIBAQEBAgEDDwMBkwtUMlFIDQcFkgMCBQL+vAkLCwkBRwIEAgJAAwECAgICAQP+OghNBg0GS2gFDQVlAwQDBGQGDQZpWQUNBV0EBwcEFsA4WgIDAn0BAX0CAwJaOGc9BBkiIhkEPWfDDhgJDA0NDAkXDg0DBgMPDAEDBAIDBAQDAgQDAQwPBAYDDGpq/k8BH54DAwIBvgEEAQIBAgICBAICBAkCBAIFBwIGAQUCBAMBAgAABABM/8ID/QO7AEoAWgB/AKcAAAEGBw4BBwYjIicuAScmPQE0Njc4ATEXMBYXHgEzMjY3MDYxMjQzPgE3OAExPgExMDYxPgE3PgEzMhYXFBYzHgEzMjY3PgExNx4BFRMlNjc+ATc2MzIXHgEXFhcTFAYHIgYjDgErASImJyImJy4BNTQ2Nx4BFx4BMzI2Nz4BNx4BJQ4BIyImJy4BJy4BNz4BNz4BFx4BFxY2Nz4BNzYWFx4BFx4BFwY2MQM0ARUVSjEyODgxMkkVFgMDQQobChQLEiMOAQEBAQIBAQEBCQsEBAoIEg8YAQEOHw8SHQcODkECA1D9PxklJVs1NTk5NTVbJSQZeW5cAwQCOIVIAUiFOAMHBFprknYHEgshWTMyWSELEgh1kv7jKmYwGjMaDhwNCBEDDBkNByoTCBURDyEMDA8ODh4GBgYEChUKAQEB2TkxMUoVFRUVSjExOAEOGg0TWg8FBQsIAQEBAgEBAQELGgsMEEAVAQEJCQoJEE0TDBkM/ekBLygnOA8PDxA4JycwAqsXJw0BBwgJBwEBDCcXGysLBgoFDxERDwQLBQssfxgPBgUDCQUDBQkkSSQVFBQPGgcGBwoKHgYFCQ4KFwseOx4BAQAAAAcAWv/AA+8DwAAhADAAMwA2AEUAVQCgAAABIzU0JiMhIgYPAQ4BFREUFjsBFRQWMyEyNjURPAE1NCYjJSEVIyIGDwE+AT0BPAE1FxUjAxUjFw4BFREjETIWOwEyNjcHASERFjI7ATI2PQE8ASchESU8ATc0Njc4ATE2MDU3PgEXHgEPATY3NhYXFhceAQcOASMiJicmBgcXHgEHDgEjIiYvAS4BJy4BNS4BJzAmMTQmNTwBNTwBNTwBNQOtfScb/pQOGArlCQonHHwnGwJRHCcnG/34AUmuDRkJbgEBfaQbpG0JCnwBAgHjAwcDZQKA/a8BAgHkDRQBAUn+DQEBAQFGBxoMDAcHGCAmJ1EpKCQLAwgFDggFCgU5lDUuDQgHBBAJBAgDcgMEAgECAQEBAQEDD28bJwoK6QkZDf4fGydvGycnGwLIAQEBGydvbwoKcQMGBOMBAgHRpwFZp6YKGA3+0QHCAQIBZv3wAcMBFA3kAQIB/TXhAQIBAgMCAQF0DAcHBxsMJwkFBgQMDBwIGwsHBgMELAcPGQYaDAkJAgI7AgQCAQIBAQICAgEBAQEBAQECAgECAQAABwAK/9IESQOsAEkATwBcAG0AgQDzAQ0AAAE0Ji8BNz4BNTQmJyUmIgcFDgEVFBYfAQcOARUUFh8BBw4BFRQWHwEHDgEVFBYXBR4BMzI2NyU+ATU0Ji8BNz4BNTQmLwE3PgE1LQENASclAQUlNwUeATMyNjclFzUFJTcfAh4BMzI2PwMXJw8BJzElNwUeATMyNj8EFwcnLgEHDgEHNCY1MTQmJzQmJzwBJy4BJy4BJy4BJz4BNz4BJy4BBw4BBw4BBw4BByoBMSYGBwYWFx4BNzI2Nw4BFQYWFx4BMzI2Nx4BFzAUMR4BFx4BOwEyNjc+AScuAQcOASMiJiM0Jic+ATc+ATc+AScFLgE1NDY3MhYXHgEXFRQWFx4BFxwBFQYmJwRJCQeEhAcJCQf9+wULBf38CAkJCISECAkJCISECAkJCIODCAkJCAIEAgYDAgYCAgUHCQkHhIQHCQkHhIQHCfwjAb4Bvf5DQP6CA3v+Q/5CeQE6AgYDAgYDATp4/kP+Qnl4R3sCBgMCBgJ7R3h5eUb+QP6CeQE6AgYDAgYCA3hHeHl5FQQUC1GEMgEBBAEBAQECAgYRDAMGAg0gEgoGBgYWCiE6FgkSCQsWCQQGChUGBgQJCBYPBAgEBwgBDw8IHhsOIxYDBwUEBgQIEgsBDyEPCwwDAxMMDBsKBAQBAgEECARJjigLCgT+PgIBFRUKEAcFBwMCBAECAScxCQISCA4DOTgDDggJDQTdAgLdBA0JCA4DODkDDggJDQQ4OAQOCAgOAzk4Aw4ICQ0E3QEBAQHdBA0JCA4DODkDDggIDgQ4OAQNCaO/v74bo/4Wv78zhgEBAQGGM6O/vzQ0HjQCAQECNB40NHAebRukM4YBAQEBATQeMzM08AoKBBwnCgECAQEGDgMFAwIFAwMGAw8WCAIDAQsVCwYWCgoFBRQrFQIEAgIFAQUECQoWBwUEAQEBDhkMERwJBQkDBAkQBgEEBgIFBAcDAxQLCwwDAwYBAQQCAQIBES0OBBULRwECAgsjFwMEAwsHAQEFEAYKAgICAgYBBgACAIf/zwN5A7AAcQCTAAABIgYHES4BJyMiJiMiJiMmIgcjIgYHIgYjBw4BIw4BBw4BDwEOAQ8BDgEHDgEHDgEPAQ4BFRwBFR4BHwEUFh8BHgEXHgEfAR4BFzMeARceARceATsBMjYzOgEzMDIxNzYyMz4BNx0BHgEXMz4BNRE0JiMDFAYHDgEjIiYnJiIjJy4BJy4BJy4BNTQ2Nz4BMzIWFx4BAzcZJQQrZDgCBAcEAwgDCRAKAwQIAwUKBQQEBgMFCQUsUSMCAwYDBQEFAgYMBgIDAgIfIAEBAQMCAQINMCQPHxELAQIBAQcNBgUIBCJKKAIECQUCBAMCCAIDATlkKgQfFhEZIScbRSMkI1U0FykUAQEBAxYpEhgfCAMDIyQlVDEyVCQlIwOwIBj++yYtBgEBAQEBAQEBAQEBAgEMLCEBBAYDBQIFAgcPCAIFAwIvbTwFCQYJEggPAwgEDDBWJQ8bCwcBAQEFBgQCBAEODwEBAQYsJR4DFiACAyYZA1wcJv2cNVglJSQHBwECCBwTGTshDh8PNVomJiUlJiZZAAQABQBTA/sDJQAqAFUAcACCAAABBwYiJyYnLgEnJiMiBw4BBwYHBiIvAS4BNzY3PgE3NjMyFx4BFxYXFhQHDwEGIicmJy4BJyYjIgcOAQcGBwYiLwEmNDc2Nz4BNzYzMhceARcWFxYUBw8BBiYnLgEjIgYHDgEvASY0Nz4BMzIWFxYUBw8BBiIvAS4BNz4BMzIWFxYGBwP7LwMKBCozMnE9PUFBPT1xMjMqBAoDLwMBBDE6OYFGRkpKRkaBOToxAwOSLgQKAx0iIkspKisrKilLIiIdAwoELgQEIykpWzIyNTUyMlspKSMEBJIuBAoDHk4sLE4eAwoELgQEKW8/P28pBASFSQQKA0oDAQQQKhgYKhAEAQMCRS4EBCohIi8MDQ0MLyIhKgQELgQKAzAnJjYODg4ONiYnMAMKBJIuBAQcFxcfCQgICR8XFxwEBC4ECgMjHBsnCgoKCicbHCMDCgSRLwQBAx0hIR0DAQQvAwoEKDAwKAQKA4ZJBARJBAoDEBEREAMKBAAAAwAH//gD+QOIABIAIwA0AAAlFRQGIyEiJjURNDY7ARMUFjMhEyEiBhURFBYzITI2NRE0JiMDFAYjISImNRE0NjMhMhYVEQMpJRv9XhslJRtMAQwJAoCQ/V4bJSUbAqIbJSUbTA0J/iIJDAwJAd4JDYZOGyUlGwI9Gib95QkLAwIlG/3DGyUlGwI9GyX95QkMDAkBeQkMDAn+hwAAAgCO/9EDvAOvACQALgAAATQnLgEnJiMiBw4BBwYdATAiIyIGFREUFjMhMjY1ETQmKwE1MSE0NjMyFh0BITUDNRIRRTIzQ0MzM0UREiccHCcuIQKPIS8oHEP+UkxSUUz+xQKiMjAxSxcYGBdLMTAysC4i/n8hLy8hAYIhLrA4YmI4sLAAAQAx/+AEGAOgACsAAAUiJi8BBwYmJy4BNxMnLgE3PgE3JRM+ATMyFhcTBR4BFxYGDwETFgYHDgEjAz4HEAj6+xMlCwUIBELcDgoFBBoSASNyBxkPDxgHcwEjERoEBQoO3EIECAUGEwsgBQWWlgsEDgcXEgEcwAwdDw4SARoBDRATExD+8xoBEg4PHQzA/uQSFwcICQAAAAACADH/4AQYA6AAKwA2AAAFIiYvAQcGJicuATcTJy4BNz4BNyUTPgEzMhYXEwUeARcWBg8BExYGBw4BIyUXAzclCwEFFwM3Az4HEAj6+xMlCwUIBELcDgoFBBoSASNyBxkPDxgHcwEjERoEBQoO3EIECAUGEwv+5/NA1v7mb2/+5dY/8yAFBZaWCwQOBxcSARzADB0PDhIBGgENEBMTEP7zGgESDg8dDMD+5BIXBwgJ9ZEBFLoZAQX++xm6/uyRAAABAA7/xAP3A7wAbAAAEx4BFx4BFzY3PgE3Njc2Fx4BFxYXFhceARcWFxYXFgYHBgcOAQcGBw4BBwYnJicuAScmJy4BJyY2NzYWFx4BFx4BFx4BMz4BNz4BNTQmJy4BJyIGBx4BFx4BBw4BIyoBIyIGJyY2NTwBNTQ2MzMWJA8SHg8hIiJMKyozMi4tUSMkHx0aGy0SEgsNBAUHCwoTImdGIScoWTExNEg/P2UlJRQCBAICJh0dLwQEBQIOMiIqelVSeistOz0rK3pQSmUwERoTCTEDAjkVHC4cL4UPCAICEwO8ASgPEiANGRYVHwoJAQEIBxwUFBcXHBxAJSQoKjAwXy0tJ0luKRQPEBEBAQoPHx9dOzxGBxkNEyAEBA4OChMFMlAfKDoBPywtfk5PfyssPwEqIRQbEgkoFBMDAx4PMxUyUTUWPgAABAE7/8EDowPBAIoAlgCdAKQAAAEuAScuASMiBhUUFjM6ATMOAQcOASMuAScuASc6ATMyNjU0JiMiBgcVIxUwFDEcAR0BFBYXHgEXHAEVFgYHDgEHDgEPAQ4BFx4BFx4BMx4BFx4BFw4BFx4BMzI2Nz4BJy4BJy4BJyYiJyImJy4BNTQ2Nz4BNz4BNz4BJz4BNz4BNTA0PQE4ATEmNCcBMhYVFAYjIiY1NDYTNCY1LgEnFxUwFBU1MQOhAQUDDC4dKzc3KwEEAQQfGxdEQD9DFxweBAEDAio4OComNgUBJyEgWkcBCBYHCgQJDgwGFS8BAS8ZDBAHBQoJBAcEJycEBlIrGS0RGg8NCyobCjMlBAYCAgQJCgwNCwgNBQkTDS0VAU1SHiAoAQH+0xMaGhMSGxsSAQEFAwUDjwUJBA8RIhoaIjs5LygyATEoLzg8IhoaIh0WAwICAQEBBFxkPDxBDwEDAiQWBQIBAQEEBQMLJSsrPw0GAwECAwEGBhFOJjY4EhEZSyUeKQgmMQYBAQEDBA4JCQ8EAwIBAQUHGkI1D0g2OWZdAgECAgMC/NsbEhMaGhMSGwFJAgQBBQkFCwIBAQQAAAAGACb/xgS4A7oABQAMAFAAagDmAO8AACUVBSE1MSUUFhcxNCYBLgEHLgEjKgEHDgEHJgYHDgEHBhYXHgEXFRQGFQYWFx4BMzoBMzoBMyE6ATM6ATMyNjc+ASc8AT0BNjc+ATc2NzYmJwMhNT4BNx4BFx4BFzIWMzI2Nx4BFx4BFzEVEw4BBwYmJz4BNz4BNz4BJy4BIyoBByoBIw4BBw4BBw4BBw4BFQ4BFQ4BBw4BBw4BIyImJy4BJyY0Jy4BIyoBIw4BBwYWHwEeARcUFhUxDgEHOAExDgEHDgEHBiYnLgE3PgEzMhYfATc+ATc2MjMyFh8BNz4BMzIWFx4BBwUxDgEHPgE3MQNp/iUB2/4zAQECAsord0Ake2QGDAZacSlAfDIrMgQELCwkXTkBAwcPBxYVBQsFBAkDAb8DBwQECAQXHQgMAwE0LCtAExIEAyks/f4lFyoTAQMBG0ElBAoEI0clAgMCFCsa9AVoShglEgMEAggQBQcFCwYSCwEDAQEDAQQHAwEBAQkKBAEBAQECBAIMEgUXQiQnQhcJGgUBAQIRHwECAgoSBQoLCgEFCwUCAwcDAwcDCxgOLVIeHBwCBnJOESISFQsmVkUFCQVJXSgKEgoUCi5PHRsaA/1BAwcDAwcD4L8BwHQBAgEBAgF7LS0EM2MBBlk4CSQrJmY6PXIuJSwGdQQMB0E6DAUEBQkLJRcDBwS+ChcYRSwtND5wLv1SxQYQCwEBAQwZAwESEgEBAQgPBMAB1UtpBQIHBgIGAwwhERMnDwgJAQEDAgECAQcXDAEDAQICAgYLAxgWAxIUFhQIKBABBQIMLQELCRIvGAIMEwcBAgEBAwIBAwEDBQEDICAeUSpOagUGBxNBTgUBTUAPAwECIR4dTiulAQMCAgMBAAAAAAIAT//FBI4DuwBvAPIAACUuAScuAScuAScuAS8BLgEnLgEnLgEnMDQxLgEvATwBNS4BJy4BIyIGDwEOAQcOAQcuAS8BLgEnLgEvAS4BJy4BKwEOAQcOAQcOAQcOAQ8BDgEHBhYXHgEXHgEXHgEfAR4BHwEeARceATMyNjc+AScHDgEjIiYnLgEvAS4BLwEuAScuAScuAScuATc+AT8BPgE3PgE3PgE3PgE3MhYzHgEfAR4BFx4BHwEeARcyFjMyNjc+AT8BPgEzOgEXHgEXHAEXFRwBFScmBgcGFh8BHgEXJyYGBwYWHwEeARcnJgYHBhYfAR4BFx4BFx4BFx4BFxYGBwSOCEIkBg0FBgsEDBAIAQcOCAscBgQGAgECAQECFC8KEwoiPRcHBQcEAQQCBQ4FBBgYDgIFAgINLSYDBwUCNkQaCREICRcNECEPAQobBQQQEiJqOBUmEREeEBMlSSYJJ182KVUnM04ZGRMFYw0xIB9GIixSJQklRyQTESMWEikUMl8aCQkBAwsIAQkZDQ4eDgsUChckFAECAQsWBwICBQIPKSoECx0QAgMBEBkJAgQDCBIqEwMGAwcEAQFUER4EBBERcQEDAkoRHgQEERF7AwgDRBEeBAQREYkJGxcLFQkECAIVKAQCCApuL0sSAwUCAgQDCBYNAwwcERtHHBEnFQIPHw8CBAoFKmgPAgMZDAMDBAIBAwECBgMCCyAXBAgEAxU4BwEBAUEhCxUICRAICxgRAQwnIRs6HDFMIw0YDQsdDxMlRSIIIUoVEBAbGhk7IDoNDg4MEUEgByFEJBIRIQ8NGg0gQicOGwsPEgkBChIICRYOCxgMHSQCAQEfDAQDCAMaNxMCBQ0BAQ0FAgICBAkSAQs8DQYLBAICAgEVBRIRER4EHQoVChMFEhERHgQgCRIJEQUSEREeBCMQJRAICAMCAwELLBcNFQsAAwBh/9YD0gOrAEkAfACFAAABBiYHFhcWBgcGJy4BJy4BJy4BJy4BJy4BJyYGIyIGJy4BNTwBNTQmNz4BMzIWNz4BNz4BMzIWFxYGFx4BFxYGFx4BFxYGBxYGBwM2Jic2JicmBgcOASMUFRwBFRQVHgEXHgEXHgEXHgEXFjYnLgEnNhcWNjc2NzYmJzYmJyUeARcWNicmBgObIlozGAQDJCgoPhgiChIJDwUYChQlEwkaChQ0FxcxEicKAwcNUDQcNRcZOBw7eExQbBACAQQEEwQGAwQDEAIBAgMqJzYzERUYDTU0PHI3NmIwNDwYChYMCxoIFwsaNyoEBTMBJzAxVR4eAgEXFRYIGv1EAg8MEh4BAlIBFRMDATI3N1scHAUCHBEcUCMNGgwYMBcKHQIFBQIGDU42P2Q8Gz0TJwoDAwQXCRMVPT4LGhAOFg0SJxoNIBUOHBA9jB0BVR1KDDpEBAUNEBAjLy8wXi8vLwFGHw0cDg4aDSZmHAVMNDBULQYDBAMPDisaLgcaVxN7BxEDBBUVJwcAAAAAAwBh/9UD0gOqAEkAfACFAAABHgEHDgEHBhYHDgEHBhYHDgEjIiYnLgEnJgYjIiYnJjY1PAE1NDY3NhYzMhY3PgE3PgE3PgE3PgE3PgE3NhceAQcGBxY2Fx4BByc+AScmJy4BBwYnPgE3NiYHDgEHDgEHDgEHDgEHFBUcARUUFTIWFx4BNz4BJz4BJz4BJwE2JgcOAQcGFgPOAwIBAhADBAMGBBMEBAECEGxQTHg7HDgZFzUcNFANBwMKJxIxGBY0FAoaCRMlFAoYBQ8JEgoiGD4oKCQDBBgzWiI2JypaFRcBAh4eVTEwJwEzBQQqNxoLFwgaCwwWChg8NDBiNjdyPDQ1DRgVERoIFv2EAR4SDA8CCFIBhRAcDhUgDRonEg0WDhAaCz49FRMJFwQDAwonEz0bPGQ/Nk4NBgIFBQIdChcwGAwaDSNQHBEcAgUcHFs3NzIBAxMdjD0VBy4aKw4PAwQDBi1UMDRMBRxmJg0aDg4cDR9GAS8vL14wLy8jEBANBQREOgxKHRNXGv72FRUEAxEHKwcAAAAAAgAz//MDzQONABsAKwAAEwYHBhQXFhcWFxYyNzY3Njc2NCcmJyYnJiIHBhc2NzYyFxYXASYnJjQ3NjegSSQlJSRJSVxbwFtcSUkkJSUkSUlcW8BbXBE2RESOREQ2/fY2GxsbGzYDIElcW8BbXElJJCUlJElJXFvAW1xJSSQlJSSjNxsbGxs3/fQ2REWORUQ2AAAAAAMABP/EA/wDvAAcADgATwAAASIHDgEHBhUUFx4BFxYzMjc+ATc2NTQnLgEnJiMRIicuAScmNTQ3PgE3NjMyFx4BFxYVFAcOAQcGNyImLwEuATURNDYzMhYVERceAQcOASMCAGldXYonKCgnil1daWldXIooKCgoilxdaVhOTnQhIiIhdE5OWFhOTnQhIiIhdE5OcQgQBtkGBxkSEhnLDQENBhAIA7woJ4pdXWlpXV2KJygoJ4pdXWlpXV2KJyj8WSIhdE5OWFhOTnQhIiIhdE5OWFhOTnQhIp0GBtEGEAgBQREZGRH+0cQMIw0GBwAAAAMAlgAXA2oDagB0AHoAjQAAASE4ATEqASMwIiMwBiMwIiMwBjEqASMwBjEiBjEqARUiMCMUIgcwIhUiFCMwBjEiFCMUIhUwIjEBMAYxFAYxIhQjFAYxFCIVMAYxFAYxHAEjFDAVMAYVMBQVMAYVMBQVMBQVMBQVMBQxERQWMyEyNjURNCYjBRUwBisBARQGMSEwJjURMzI2PQEhMBYVEQMX/qoBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH+/gEBAQEBAQEBAQEBMSICLiIxMSL+gQEBdwH6Av3SAq8jMQEtAgNqAQEBAQEBAQEBAQEBAf71AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf41IzExIwKrIzGOfAL+DAEBAQEBojIiuAEB/VQAAAAABwAA/+UEAAObADUAYAB8AKMA7gE5AYQAAAEGBw4BBwYjIicuAScmJy4BJx4BMzI2Nz4BNzkBPgE3FhceARcWMzI2Nz4BNx4BFx4BMzI2NwEOAQcOAQcOAQcGFBUuASMiBgcOAQcuAS8BIy4BIyIGBzY3PgE3NjMyFhcBDgEHIgYxDgEHJzI2Nz4BNzkBPgE3OQE+ATcXBxQWFyE+ATc0NjU2NDU0JiclHgEXHgEXHgEXBSEOAQcOARUcAR0BNxQGFQ4BBw4BBw4BBw4BBw4BIyImIy4BJy4BJy4BJy4BJy4BJzEwNDE8ATU0NjU+ATc0NjU+ATc+ATcwMjE+ATMyFhcxHgEVHAEVAS4BJy4BJy4BNTE4ATU8ATU0NjU+ATc+ATE+ATc+ATcwMjE+ATMyFhcxHgEVHAEVFAYVDgEHDgEHDgEjDgEHDgEjKgEnLgEnLgEnARQGFQ4BBw4BBw4BBw4BBw4BIyImIy4BJy4BJy4BJy4BJy4BJzEwNDE8ATU0NjU+ATc0NjU+ATc+ATcwMjE+ATMyFhcxHgEVHAEVA8QXLSx3SEdOKikpTiQkIDNLFAUMBwgRCQcPBwIEAhQkI144Nz1EgDQkOBEKFwwGDQcGDAb+2QMHAwECAQkNAgEcOh1BeDMpPhIGDAcJAgkRCQYMBhctLHdIR04pTyUBAw0ZDAEBChIILgQHBAcPBgQGAwgPBzCJBAP9xAIDAQEBGRUBtgIGBQIHAwQIBP6AAgQCAwEBAekBAQYFBQ8IAgQCAwkEBQkFBAcDCBAHAgQCBQgDAgQBBAMBAQIHBgEDBQIFCwUBCBIJBw0GGSH+0gUIBAIDAgMEAQIHBQEBAgUDBQoGAQgSCQcNBhkhAQIGBAUPCQEEAgQIBAUJBQQHAwkPBwIEAv3WAQEGBQUPCAIEAgMJBAUJBQQHAwgQBwIEAgUIAwIEAQQDAQECBwYBAwQDBQoGAQgSCQcNBhkhAS1JPDxXGBgHCBwVFRorbz8BAgICAgUDAQICOC4tQhMSMCwgUC4GCAIBAgECAlQEBwQBAwEOHhEBAgIJCSooIVUxAwUCBAICAQFIPDxXGBgNDf7UAQYGAQUMB1QBAQIFAwIDAgULB1idChQJBQwGBAoEAgMBHzgV2QsWCwYLBQYKBL8FDAYGDQYBAwEDBQMFAwgQBgkOBQIBAQIDAQEBAQIGBAEDAgQJBQMGAwcQCAEBAQEEBwMKEQcBAQEDBQMEBwMEBAICCCwcAQEBARkECAYCBwMHDwkBAQEBBAcDCRIHAQEDBgIFBwMEBAICCSscAQEBAwUDCBAHCA4GAQICAwEBAQEBBgUBAwL+5wMFAwgQBgkOBQIBAQIDAQEBAQIGBAEDAgQJBQMGAwcQCAEBAQEEBwMKEQcBAQEDBQMEBwMEBAICCCwcAQEBAAABAFT/yAIAA7gARAAAJRQGBw4BIzEiJicuAScDNDY3PgEzMhYVExQGByImNQM3ExQWMzI2Nz4BNQM0JiMiBgcOARcTFBYXHgEzMjY3PgE1AzMTAgAgHh5OKytOHh4gAQEYFxY4H0FcAjcqKDkBSAENDAUNBAECAjIjEiAMCwwBARYUFDMdHDQUFBUBSAGeK04eHiEgHh5OKwKMHzcTEhRUO/3dJTABMiQBxQH+OgQKAwQBBAICIx4pCgoKGg/9dB0zFBQVFRQVMx0COv3GAAAAAQAvACEEIwNfAB8AAAEUBiMiJicBHgEVFAYjIiY1NDYzMhYXAS4BNTQ2MzIWBCNWPRIjD/4GAgFWPT1WVj0SIhAB+QEBVj09VgLMPFcJCP6GBw4HPVZWPTxXCQgBegcOBz1WVgAAAAADAAkAEwP1A2sADwAgADAAACUVFAYjISImPQE0NjMhMhYRFRQGIyEiJj0BNDYzITIWFREVFAYjISImPQE0NjMhMhYD9RYO/FwPFRUPA6QOFhYO/FwPFRUPA6QOFhYO/FwPFRUPA6QOFoJLDhYWDksQFBUBU0oPFhYPShAVFg8BYkoPFhYPShAVFgAAAAEACwCEA/cC/AA0AAABFgYHAQ4BBwYmJyYnLgEnJicuAScmNjc+ATMyFhcWFx4BFxYXNjc+ATc2Nz4BMzIWFx4BFwP3BCYT/o8OJRMaJBExLy9dLS4vECcECi8QECQXHjQSISMjRiIhHyQiIkMiIiQQNyIWIxEQIAMCgh0nE/6PDyUCAx4SMC8vXS8uMA4iEiEyDxAfPhEhIyNHIiIfIyEiQyIiJBA/IBEQIRgAAAAAAQAJAIQD9wL8ADQAACUOAQcOASMiJicmJy4BJyYnBgcOAQcGBw4BIyImJy4BNz4BNzY3PgE3Njc+ARceARcBHgEHA/cBIhARIxYiNxAkIiJDIiIkHyIiRiMjIBI0HhUmEBAvCAQpDi8vLl0vLzERJBoTJQ4BcRMmBP4XIhARID8QJCIiQyIhIx8iI0cjIyARPh8QDzIjECQPLi4uXC8vMRIeAwIlD/6PEycdAAQAAv/CA/4DvgAEAAwAIAAxAAAJAREhAQEHNSM1NxcHCQEOASMiJjU0NjcBPgEzMhYVFAYlFAYPAQE3PgEzMhYfAR4BFQIx/dEBGAIv/a5KVj6gPgFa/pMBBgMIBwICAW0BBgMIBwEBqg0Nb/7pbw0dEhEgDJ4NDQMJ/dH+6AIv/ikDVkg+nD0CZP6TAgIHCAMGAQFtAgIGCAQGShIfC28BF28NDQ0NngwgEQAC//7/vAQEA8IAlACgAAABLgEnLgEnJjY3PgE3NiYvAS4BDwEOAScuAScuAScuASsBIgYHDgEHDgEHBiYvASYGBw4BBw4BFx4BFx4BBw4BBw4BBw4BHQEUFh8BHgEXFgYHDgEHBhYfAR4BNz4BNz4BFx4BFx4BFx4BOwEyNjc+ATc+ATc2FhceARcWNj8BPgEnLgEnLgE3PgE3PgE3PgE9AS4BJwEiJjU0NjMyFhUUBgPiFSkVDRkFBQQIDBoLCAMKWwocC0ULHwsLEgMCBQQBFg2ADRgBBQcDAhMLCx8MRAscChYvFwkDCA0ZCwgCAwUZDRMpFQ0TEw1TDRkFBQUHDBoLCAMKWwocCxIjEgsdCwsRAgMHBQEXDn4NFgEDBwUCEwsLHQsSIxILHApcCQMIDRkLCAMEBRgOFSkVDRMBFA3+Hktsak1LbGwCJgQHBAITCwweDBEjEAscClwJAwgxCAMFBBkNEigVDRMTDRUpFQ0ZBQUGCDEIAwkYLhYKHAsSIREMHwsLEQIEBwQBFw6ADRYDDQITCwsfDBEjEAscClwJAwgNGQsIAgMFGQ0VKRUNExMNFSoWDRcFBAMIDRkLCAMJXAocCxIhEQwfCwsRAgMHBQEXDoAOFQP+42xLS2xsS0tsAAAAAAEAAAAiBAADXgBLAAABDgEHFRQHDgEHBiMiJy4BJyYnFjIzMjY3IiYnHgEzMjY3LgE9AR4BFy4BNTQ2NxYXHgEXFhcuATU0Nz4BNzYzMhYXPgE3DgEHPgE3BAAVNR8nJ5dwb5EtKitRJiYjCxkNSoQ2RGsVChUKDhwNSGAWMBosMg8MKDAwbz09QAMDERA5JiYrLVAdJUMeCzEgID0dAv4gNhUcaGpqrDc2BgcYERIWAjApUz8CAwMEEHJNAgsNAh1cNh00GDAoJzgREQMLFw0rJiY5EBEkHggZEiU7EwUQDQAAAAMAD//NA/MDswA3AEwAfAAAASYnLgEnJicmJy4BJyYHDgEHDgEHBgcOAQcGFxYXHgEXFhcWFx4BFxY3Njc+ATc2NzY3PgE3NicBBiYjIgYnJjY1NCY3NhYXFhQVFBYTDgEHDgEPAQYiIyoBJyY2Nz4BNz4BJyYGBw4BIyImJy4BNTQ2Nz4BFxYXHgEXFgcD8wQODyscHB4fJydeNTY9OGcoK0EeHhkaIwgIBgQNDiocHCEgKCleNTY5NzAwVCQjHR0ZGSQICQT+RAYrDxAoCgkDARAbRhgFA4cGGg8YOQgJCSYTECkHCQQDBiEVGDoKCVkcBAsICxQKCRksECBAKyclJTMLCg8B4jcxMVUkIxwcGRkkCQkEBR0VFzYgICcmXDY2PjcwMFMjJB4dGRkkCQgEBA4NKxwcICAnJ102NT3+jwoCBAoKKg4VKAMGBwMNIRANJwGOFygOGigaQgcHCUYPGS0TFS8lKAUSAwodDAwWDxAdCA4PAwQRETsoKTAAAAEACwCpA/UC0wA6AAABBiYnJicmBgcGBx4BFx4BBwYmIyIGIyIGJyY2NTQ2NTQmNzYXHgEXFhc2Nz4BNzY3NhceARcWFx4BBwP1CBULT1BQolBPThUmFhIvCgtOEThpNxhAFCIEAgYQDBUVLhcWDTg1NWo2NTgoKShRKCgoEk8SAfoICAg0CQoxNzZLEyYYEjAREwICBA4XURg6aDQWPxUODg8wGBkHNSgnNQ4OAgMGBRwXFyEORxEAAAAAAQANAKsD9wLVADoAACUGJiMiJiMiBicmNjc+ATcmJy4BBwYHDgEnJjY3Njc+ATc2FxYXHgEXFhc2Nz4BNzYXFgYVFBYVFBYHA9oVQBg3aTgRTgsKMBEVJhZNUFCiUFBPCxUIEk4TKCgoUSkoKDg1Nmo1NjcNFxYvFBUMEQcCBiO1DAICBBURMBIWJhVLNTYxCQkzCAgIEUcOIRcXHAUGAwMODjQnKDUHGRgwDw4OFEIUNGg6GFEXAAEAC//JA/cDtwBiAAAlFAYHDgEnLgEnJicuAScmJwYHDgEHBgcOAScuAScuATc+ATc2Nz4BNzY3JicuAScmJy4BJyY2Nz4BFx4BFxYXHgEXFhc2Nz4BNzY3PgEXHgEXHgEHDgEHBgcOAQcGBwEeARUD9yIPECYjGzYRICIiRCEhHyIiIkMjIiMVNyUWIQsQKwgGOhMfIyNGISIdHiEhRSMiIRM6BggnEhArJRgyESEiIUIgIB8iIiFCIiEjFDwlFSANEigHBTkVICIiRCIhIAERFTxLHSAOECwFAzoUICIiRSIiHyAhIUMiIiMVQQUDIQ0QKiEaMxMgIiNGIiIeGyEhRiMiHxEyGCUoERAvDAY6EyEhIUMgIR8gICFDIiIiFUEFAyENESkhHTATICMiRiIiIP7zEjQeAAEACwFTA/UCLwAUAAABBiYjISIGJy4BNzYWMyEyFhcWFAcD9RGGOP22OoITCgIKEYY6AqQrPgwKCgF1JAIFJRJxFyUDBR0VbxQAAAABABH/zQPzA7UAMAAAAQYmKwEGFhUUBgcGIicmNj0BIyIGJy4BNzYWOwE2JjU0Njc2FhcWBhURITYWFxYUBwPzEYQ4tQMBBR0TbxQkArU4ghMJAwoShTizAwELLTFgDQYCAREoPQ4KCgF1JAI7kUMrPg4KChGIOLMFJRJxFSQCO5BEM0QEBwsiEDMV/vIDBRwUbhQAAQA3/80DyQOxACEAAAEWBgcGBw4BBwYHDgEnLgE1ETQmNzYWFxYXHgEXFhceARUDyQElC2VkY8ZjY2QLIg0JBAEIDisNY2JixGNiYw0lAcINFwQ4NzduNjc3BhYHBRkVAzccVAoOGwg3NzZsNzc4BhMLAAACAA3/ywPzA7cAEAAhAAABEQ4BIyEiJjURNDYzITIWFSERFAYjISImNRE0NjMhMhYVAbMBFxD+qhAYFxEBVhAYAkAXEf6qEBgXEQFWEBgDj/xiEBYXEQOcEBgWEvxiEBYXEQOcEBgWEgAAAAAEAAr/ygP2A7YAPQB6ALUA8AAAATQmNSY0Jy4BJy4BNS4BJyYiJy4BJyYiJyImIyYiKwEiBhUUFjsBBwYUFx4BMzI2PwEVFBYzMjY9ATwBJzEFMzI2NTQmKwEqAQciBiMGIgcOAQcOASMOAQcOAQcUBhUOARUUBgcUBh0BFBYzMjY9ARceATMyNjc2NC8BASIGHQEnJiIHBhQfASMiBhUUFjsBOgE3MjYzPgEzPgE3PgEzPgE3NjQ3PgE3NDY3NDY1NjQ9ATQmIzElBzU0JiMiBh0BHAEXFBYVFhQXHgEXFBYXHgEXMhYXHgEXMhYXMhYzFjI7ATI2NTQmKwE3NjQnJiIHMQP1AQEBAQEBAQEDCQQBAgIBAwECAwEBAwEDBgPTGCIiGEevEREJFQsLFgivIhgYIgH820cYIiIY0wMGAgICAgEDAQIDAQECAQUIAwEBAQIBAQEBASIYGSKuCRULCxYIERGvAuwYIq8RMBEREa9HGCIiGNMDBgICAgIBAwIBAwECAgEECQMBAQEBAQEBAQEiGP1xryIYGCIBAQEBAQEBAQEDCQQCAQIBAwECAwECAgICBgPTGCIiGEevERERMBEDhwICAgEDAgEDAQICAQQJAwEBAQEBAQEBASIYGCKvETARCQgICa9HGCIiGNMDBgJFIhgYIgEBAQEBAQEBAQMJBAICAQEDAQIDAQICAgIGA9MYIiIYR68JCAgJETARr/3PIhhHrxERETARryIYGCIBAQEBAQEBAQEECAUBAgEBAwIBAwIBAwECBgPTGCIur0cYIiIY0wMGAgICAgEDAgEDAQECAQUIBAEBAQEBAQEBASIYGCKvETAREREAAAAAAgAz/9EDsQOxABcALwAAJRYGDwEGJicBJjQ3AT4BHwEeAQcBBhQXARYGDwEGJicBJjQ3AT4BHwEeAQcBBhQXAikMAg8kDiUN/nMNDQGNDSUOJA8CDP6uBAQC2g0DDiQPJQz+dQ0NAYsMJQ8kDgMN/q8FBTEOJQ0gDQMOAckOKA4Byw4DDSANJQ7+fAUOBf58DiUNIA0DDgHJDigOAcsOAw0gDSUO/nwFDgUAAAIAM//PA7EDsQAYADEAAAkBDgEvAS4BNwE2NCcBJjY/ATYWFwEWFAchAQ4BLwEuATcBNjQnASY2PwE2FhcBFhQHAib+dg0lDiUOAw0BUQUF/q8NAw4lDiUNAYoNDQGL/nUMJQ8kDgMNAVEFBf6vDQMOJA8lDAGLDQ0BnP43DgMNIA0lDgGEBQ4FAYYOJQ0gDQMO/jMOKA7+Nw4DDSANJQ4BhAUOBQGGDiUNIA0DDv4zDigOAAEBUv/6A4sDhAA6AAABDgEHBgcOAQcGBw4BJy4BJy4BNTQ2NzY3PgE3NjcmJy4BJyYnLgE1NDY3PgEXHgEXFhceARcWFx4BBwOLAiENKikpUykqKhEkGhUeDhAdOQ4gHx48Hh8gHB8fQB8gHRA3HQ4NLR8PIA0qKilUKiorEBwDAbcSIQ0qKSlTKSorECICAx0PDyAUHjIPIB4fPB8fIBsfHkAfIB0QLhwUIQ8OKggEJA0rKSpTKiosDyEXAAAAAAEBUv/6A4wDhAA6AAAlFAYHDgEHBiYnJicuAScmJy4BJyY2NzY3PgE3Njc+ATc2FhceARUOAQcGBw4BBwYHFhceARcWFx4BFQOMHRAOHxUZJBEqKipSKSoqDSECAhsQLCoqUyopKw0fEB4uDQ4dATYQHh8gPx8fHCAeHzweHyAOOWwUIA8PHQMCIhArKilTKSkqDSESFyEPLCoqUyopKw0kBAgqDg8hFBwuEB0gH0AeHxsgHx88Hx4gDzIeAAAAAAMADQAAA/MDYgALABsALAAAJQEmIgcBBhYzIRY2JRQGKwEiJj0BNDY7ATIWFTUUBisBIiY9ATQ2OwEyFh0BA/P+OhM1Ev46ExslA48kGf44CQhaCAkLBloICQkIWggJCwZaCAlNAxUgIPzrIC0CL2AHCgoHVQgJCgdzCAsLBv4ICQsG/AAAAAABAB0AGwTGA38APAAAATYWFx4BFxYGBwYHDgEHBgcOAQciJicmJy4BJyYnLgE1NDY3PgEXHgEXHgEXHgEzFjY3Njc+ATc2Nz4BNwQmJiwYEiMBAjcVREVEiEVERRU3HCNLFCUkJEolJSUOHioRESgiGiwRM1g1BB0EBjcKNjMzZjM0NhArFgN/CCsYEiQXITYVRUREiURFRBU3AVQUJCQkSCUlJw8fGh8jEREtAgIwETNWNQQjATsLNTQ0aDQ0NhArBQAAAQCIAAAEJQN/AD4AABMGFhceARceARcWNicuAScuAScyMzoBMzIzMhY3NjQnJgYjIiMqASMiIyY2Nz4BNz4BNzYmBw4BBw4BBw4BB4gZWx80ZTQWNh08YhkMPxocMxk1ODdxOjk4Jk8ZODgZTyY4ODhwNzc3AQ8GEyoUHjsMGmE+HDYXNWE3Fz8LAeY/Wh80ZTQXPQ0aW0AgOBocMB4ECxiIGAsECAoHEisUHjYcP18cDD8XNWE3FzgbAAACAJ//8gQ0A4oAPwBwAAABHgEHBiYHBgcOAQcGBwYWBw4BJyY2JyYnLgEnJicmBicuATc2Fjc2Nz4BNzY3NiY3NhYXFgYXFhceARcWFxY2ByYiJyY2NzYWNy4BJxwBBw4BJyY2Jw4BBxY2FxYUBwYmBx4BFzQ2Nz4BFxYGFz4BNwQ0BQEGCkolDhcYQCoqNAMHHQtPDRwFAjMpKkIXFw0mSgsFAQYKSiUOGBdAKio0AgQiIk4HBwgDMyopQhcXDiZKvyY4CAYBBQs7IBZaRRoPRxAcBgVDWhYiOwkFBQk8IRZaRQEaDkYRHAUCRVoWAfEOShAcBgMyKipBGBcNKUgKBAEFCkskDxcXQSopNAQJHg5KEBwGAzIqKkEYFw0oTgcGCxQTMR4PFxdBKik0BAmfARoSRg4dCAREWhYnNggFAQYJPCAXWUQCBB0PSA8aAwJEWhYlOAkEAgYKOCQWWkQACAEH/+4D0gOQAA8AHwAvAD8ATwBwAHwAlAAAJSEiJj0BNDYzITIWHQEUBicjIiY9ATQ2OwEyFh0BFAY3ISImPQE0NjMhMhYdARQGNyEiJj0BNDYzITIWHQEUBicjIiY9ATQ2OwEyFh0BFAYTFx4BFxQGIyEiJjc+AT8BIyIGFREUFjMhMjY1ETQmKwEnIgYVFBYzMjY1NCYBETQ2MyE0NjMyFhUhMhYVERQGIyEiJjUDIv5+BAYGBAGCBAYGq9sEBgYE2wQGBkP+3gQGBgQBIgQGBnP+ZwQGBgQBmQUFBcPbBAYGBNsEBgZlDi4iAQUF/mcEBgECIysPmAYJCQYCHgYJCQaYdw8VFQ8PFRX+iwwIAQoqHh4pAQoJCwsJ/V0IDNwGBAQEBgYEBAQGSAYEBAQGBgQEBAZHBgQEBAYGBAQEBkgGBAQEBgYEBAQGRwYEBAQGBgQEBAYBByoKMSAFBQUFHjALLAkG/VIGCQkGAq4GCWsVDw8VFQ8PFfyWAzIIDB4qKh4MCPzOCAwMCAAAAAMA2v/xBAQDjwAcAC0APAAAASIHDgEHBhUUFx4BFxYzMTI3PgE3NjU0Jy4BJyYTDgEHDgEjIiYnMyIwNSEUMBMhNjc+ATc2MzIXHgEXFgJvQDk5VRgZGRhVOTlAQTg5VRgZGRhVOTisCBEJImo/T30cGgEBvKj81h0qKmk8PUJCPTxpKioDjxkYVTk4QUA5OVQZGBgZVDk5QEE4OVUYGf5qDxoMLzlYRQEB/fg3LS1AEhISEkAtLQADABgAEATFA3AAHAArAFYAAAEiBw4BBwYVFBceARcWMzEyNz4BNzY1NCcuAScmASE2Nz4BNzYzMhceARcWARYGBwYHDgEHBicuAQcOAQcOAQcOAScmNjc+ATcuATc+ATc+ATc2FhceAQFPMSwrQRMTExNBKywxMiwrQRMTExNBKywBBv2RFiEgUC8vMjMvLlEgIAJVAxgOFR4eSywsMAcSBgcZBhQjHAseBAUbBgkMBiZLBAM1IiNcM0BnKSU+AtcTE0EsKzIxLCtBExMTE0ErLDEyKyxBExP9OSoiIzEODg4OMSMiAm0lOBMbFRYcBgUEAQQBAREDChEGAwMJDBgHCxYMHkxGMEgXGB8DAxsZFksAAAADAI3/3gRSA6IANgBIAHMAAAE2Fx4BFxYXFhceARcWFxYHDgEHBgcGBw4BBwYHBicuAScmJyYnLgEnJicmNz4BNzY3PgE3PgETFjYzMhY3NiYnJiIHBhYVFAYXIiYHBhYXFjYXBhYHBiYHBhYVFBYXFjYzMhY3NjQnJgYnPAE1NDYnJgYjAk07NTRaJiYeHRsbKw0OBAMICCMYGBwcIyJRLy81ODM0WycnHyAbGykNDQQFCAgiGRgcHT8rJ2IXCDAOFCYNBwEEHVMdBgEEMRRBEQ8DBQslEAECAxEhCAcBAQYHKRAzdSUEBAojEAIHFTMbA6IECAkjGBgcGiIiUi8wNTs0NFomJh8fGxspDQ4DBAgIIxgYHR0iIlAvLjY8NDNZJiUfHzQXFB3+/QkDAQUYTxoFBQkiEw4rRgUFBmMMBQMCPX47AgUIByYMDiIHBgECBxZEFgcDAUSNQxYtFAUBAAAAAAMARABIA6ADpAAQACEAMgAANwE2Mh8BFhQHAQYiLwEmNDclATYyHwEWFAcBBiIvASY0NwU3NjIfARYUDwEGIi8BJjQ3RAMQChwJEQoK/O8KGwoQCgoBPgHIChsKEAoK/jgJHAkRCgoBHsEJHAkRCgrBChsKEAoKlAMQCgoQChsK/O8KChEJHAoKAcgKChEJHAn+OAoKEAobChfBCgoQChsKwQoKEQkcCQAAAAACAH3/0ARdA7QAPwBZAAAlFgYnLgEnLgEnBgcOAScmJyYnLgEnJicmJyY2NzY3Njc+ATc2NzYXHgEXFhcWFx4BBwYHDgEHHgEXHgEXHgEXATYmJy4BBw4BBw4BBwYWFx4BFxY3PgE3NjcEXQ9FLhEfDitXKyMwMGo2NS4qJSY+GBkQEwQEDxMSGxshIVAvLzY/ODheJSYbHBMSCwkJGwYPCAodDx06Hg0hBv7QBTIiJGtKOkwfHisEBjMiIVE3ODMzThkZBDIvQxAGIg4rVioeERILBgYSEBkYQCcmLDM1NmUuLiUlHx8vDw4EBA4NMiMiJyk0NXM7OzYLFQ4PHQ8dOB8NIREBxkhpIiUvBwYsHx5LPE1lIiEpBAQREUMvMDgAAAAAAwAKAH4EPwLuABsAOABVAAABFAYjIQ4BIyImJyMiJjU0NjsBPgEzMhYXITIWBxQGIyEOASMiJicjIiY1NDY7AT4BMzIWFyEyFhUDFAYjIQ4BIyImJyMiJjU0NjsBPgEzMhYXITIWFQQ/EQv8tQkoGhooCRwLERELHAkoGhooCQNLCxG8EAz+WggpGRopCJ8MEBAMnwgpGhkpCQGlDBCkEAz+zAkpGRopCJkLERELmQgpGhooCQE0DBABnwwQFx0dFxAMDBAXHR0XEN0MEBcdHRcQDAwQFx0dFxAMAdAMERYdHRYRDAsRFx0dFxELAAAABwAOAFwEOwMkABwALgA+AGkAmgChAKkAAAEiBw4BBwYVFBceARcWMzEyNz4BNzY1NCcuAScmEw4BBw4BIyImJzMwIjEhOAExEyE2Nz4BNzYzMhceARcWFwEOASMxIiY1NDYzMhYXDgEVFBYXFBYXIzAyMSMeATMyNjc+ATceARceARclFAYjMSImJzgBMT4BNz4BNx4BMzI2Nz4BNzgBMyM4ATMjPgE1PgE1NCYnPgEzMhYVBSE+ATMyFgUhPgEzMhYXAiUyLCtBExMTE0ErLDIxLCxBEhMTEkEsLIUGDQcbUTA9YRUUAQFWgf2RFiAhUC8vMzIvL1AhIBb9whE3IDVMTDUaLRIEAwQEAQGyAQsMMyEZLA4DBQMBBAIBAQEC9ks1ITYSAgMCAQIBDDMfGSwOBAcDAbgBCAEBBAQDAxEuGjVL/Uj+shhZNjdZAvb+shhYNzZZGAMkExNBKywyMSwsQRMSEhNBLCwxMiwrQRMT/sgLFQkkLEQ1/nAqIiMyDQ4ODTIjIioBbBkdSzY1SxMQDx4PECEPAgQCHSQXFAMIBAYKBgIEAUs2Sx0ZBAkEAwcEGyEYEwULBgIEAg8hEA8eDhETSzX9LDg4LCw4OCwAAAAAAQER/8AC7wPAABQAAAUjESM1MzU0NjsBFSMiBh0BMwcjEwJRwICAUYCNWjETnhONAkACALFpa3uxJSFYsf4AAAIAAABABAADQAALABAAAAEUFjMyNjU0JiMiBgEhCQE3AwBLNTVLSzU1SwEA/AABAAFVqwLANUtLNTVLS/1LAqv+VYAABAAGAKQD/ALcAGMAfgDuAQwAAAEHDgEHDgEHDgEjIiYnLgE1NDY3PgEzMhYXHgEVFAYHDgEdARcyNjc+ATc+AT8BIzcyNjc+ATc+ATc+ATMyFhceARUUBgcOASMiJicuATU0Njc+ATU8AScmIiMiBgcOAQczDwElBw4BBw4BBw4BFRQWFwcuATU0Njc+ATc+ATcHNx4BFz4BNz4BNz4BMzIWFx4BFRQGBw4BIyImJy4BIyIGBw4BBx4BFx4BMzI2Nz4BNxcOAQcOASMiJicuAScuAScOAQcOAQcOASMiJicuATU0Njc+ATMyFhceATMyNjc+ATc+ATcuAScuASMqAQc3Ezc+ATc+ATc+ATc+ATU0Jic3HgEVFAYHDgEHDgEHAREkDRkLDRsQECYUDRMHBgcGBQUNCgYMAwMEAwIBAwQFBwMIDAQDCghAKwsLEgUFDAQSJBMTKhYPFQcGBwQFBQoGBwoFBAQDAQMBAgEDAgoTCRAaCi0LJgFABhcjDxYkDg8NDAsEKikNDxAwIhg7IiJtDhUFDxgGChIGBw8GCA0FBAQEBAULCAUMBgcJAQcNBggUDQ0WCAUJBQUHAwUNCgsPGg0JFAkKEAYHDAUEDQYSHAwJEgcGEAgIDAUFBAYFBQwIBQoFCAoDBQcFBQwHBBAMDxgIBQ0IBQoGBNcHER8MDBoNDRUIDAoNCwUpKg4OEDEhGjokAiCPM0oWFyILDAoGBQUMBgcKBQUDAwMDCQUFBwMDAgICAgMECBELBiYf9yQDBAMNCyAtDQ4OBgUGDgoIDQQFBAQFBAgHAwkFBQYCAQMCAgwLEjkoJQS8ERAkFSBPLy5XKBk5HBI4cDYgQB4lQRwVIw+iExczHRcfCA0OBQMEBAUFDAgICwUFAwICAQMEBAcaFS45CgYHAwIDEA0HFh4KBgkEBQUNCgkgFxciDAsNAwQDBAUFDAYIDQUFBgMCAwMDAQILBgUUEDZDCwcIAgv+exENHA8OKxobOh4oSiQZOR0ROHA2IEAeJUAdFSMPAAcAN//8A8kDhAAKABAAFgAcACAAJAAoAAATESERMCMiICMiMQEhNSEVMzUhNSEVMzUhNSEVMwEhNSE1ITUhNSE1ITcDko+P/qqPjwG9/nQBigL+dAGKAv50AYoCAaP+eQGH/nkBh/55AYcDhPx4A4j8o7Oz0L+/3rS0/lKzHb8ftAAAAAIACQAXA/wDaQAwAHQAAAEeAQcOAQcOAQcOAScuAT0BBgcOAQcGBw4BIyI2Nz4BNzY3PgE3Njc2JhceARceARcDBhYHDgEHBiYjISIGJy4BJyY2NTQmNz4BNzYWOwEOARUOAQcOAQcGJisBIgYHBhYVERwBFxY2MyEyNjc2Jjc+ATc+AQPADjYIBSkOIj8jCy0TEAFbUVB+KysQAggJFwYCCEIyJCgpYDg3QggPHhckDh5AIhUECQoMUDsmVCj+vihRJTNOAwUFBQUEWz48djvtAgIaLBYTJxUjVSRPLD0KCAQoGmYeAZQsPAsFBwYCEwcVJQKtDy0iFSQQIT8iCzEFBTkVZAEPD0Q2Nk8LElkTWIIvIBgYIAkIARqSAwQqDh8+I/6vOmAoNEoFAwMDCAtVOT2JRUWIPENYBQQEEB8RBQYHBBQBBQUMHRhSIP7oNmoPCQUKHxAqFAcNBhMrAAACAAL/6QP6A5cAGQAyAAABESERNDc+ATc2NzY3PgE3NjcXDgEHDgEHMwURIRE0Nz4BNzY3Njc+ATc2NxcOAQcOAQcBfv6EBAQQCwwPFhsaQiYnLFY3TxgaHQO6AmD+hAQEEAsMDxUaG0EmJi1WN08YGh0DAYL+ZwFEQTk5XyYnHSciIzsZGhSIFkQsLYFXAv5nAURBOTlfJicdJyIjOxkYFIgXQy0sgVcAAAAAAQANALoD6wLeAAwAAAkBBiYnASY2MyE2FgcD6/5IGTsW/kQXGCUDkRswJAJz/kcaAhgBwBRQAUQoAAAAAQD6/9UDHgOzAAwAAAUBJjY3ATYWFREWBicCs/5HGgIYAcAUUAFEKCsBuBk7FgG8Fxgl/G8bMCQAAAAAAQDi/80DBgOrAAwAAAkBFgYHAQYmNREmNhcBTQG5GgIY/kAUUAFEKAOr/kgZOxb+RBcYJQOWGC4kAAAAAQAPAKAD6wLEAAwAACUhIiY3AT4BFwEWBiMDyfxsJBgWAbwUOxsBtiQuGKBPFQHAGAIa/kkoRQAFAQv/xgPTA7oARABdAH8AiQCRAAABEz4BNTgBMTQmJy4BJy4BIyIGBw4BBw4BBzgBMRwBFRQWFTgBMRQWFRcTAw4BFRQWFx4BFx4BMzI2Nz4BNz4BNTQmJwMBPgEzMhYXHgEXDgEHDgEjIiYnLgEnPgE3AQ4BIyImJy4BJxM2NCcDHgEXHgEzMjY3PgE3AwYUFxMOAQEmNDUcARUUFhUXNCY1FBYXJwLq5wEBIAkNJhgwfEREfDAYJg0IHwIBAQTk5wECIAkNJhgwfEREfDAYJg0JIAEC5v6rLnA8PHAuHScLCycdLnA8PHAuHSYMDCYdAbQucDw8cC4pKwjkAgLSCxoPMHxERHwwDxsL0wIC5Qkr/ZoBAQEBAwIEAa0BwwIFAxIQAwQHAwcGBgcDBwQDDxABAQEBAwEBAgEH/kP+YgIFAhIQAwQHAwcGBgcDBwQDEBICBQIBngHbBQUFBQQHAwMHAwUGBgUDBwMDBwT8cAUFBQUFCgMBmQUKBAGaAgUCBgcHBgIFAv5mBAoF/mcDCgN4AgQCAQEBAQMBBAECAQMFAwcAAAAAAwF+/8cDYAO5ADEASQBjAAABNCYnLgEnLgEjIgYHDgEHDgEHOAEVMBQxERQWFx4BFx4BMzI2Nz4BNz4BNRE0MDEwNCU+ATMyFhceARcOAQcOASMiJicuASc+AQEOAQcOASMiJicuAScRHgEXHgEzMjY3PgE3A2AODwkaESBTLS1TIBEaCQ4OAQ4PCRoRIFMtLVMgERoJDw7+hB1IJiZIHRYZBwcZFh1IJiZIHRYZBwcZAWoDGyAdSCYmSB0gGwMIFQwgUy0tUyAMFQgDeQsSBgUHBAYHBwYEBwUGEQoBAfyOCxIGBQcEBgcHBgQHBQYSCwNwAQEOBQUFBQQHAwMHBAUFBQUEBwMDB/yIAgsFBQUFBQULAgNGAwUDBgcHBgMFAwAAAAMA5//GA/cDugBmAIABBAAAAS4BJy4BJzA1PgE1NDcwNDUxNDA1NCYnLgEnLgErASIGBw4BBw4BBw4BHQEOAQcGBwYWFxYXFjIVHgEXHgEXOAExHgEXHgEXHgEzMTI2Nz4BNz4BNz4BNzA2MT4BNzA2MT4BNTYmJwE+ATsBMhYXHgEzDgEHDgErASImJy4BJzI2AQ4BBw4BBxQiMTgBMSIwIzAUMSIwIzgBFSIwIzAUMSIGFSM4ATEUIjE4ARUwIjEwFDEOARUOASMxIiYnLgEnMSM0JicwIjEwJiM4ATEiMDEwIjEwNDEuAScuAScuAScmJy4BNzY3PgE3PgE9AR4BFx4BOwEyNjc+ATcHFBYXHgEXFgYHA9gPKhsZOyEBAQEJDgYSCxU2HQIdNhULEgYGBwMEBT9pHRoEAyImJjgBAQQJBAcPBxQqFgYTCgwgEhIgDAsUBh86Gh4yEwEKFQoBERMBEBD+QRIsFwIXLBIFBwMDBwUSLBcCFywSBQcDAwcBmwoTCiNpPQEBAQEBAQEBAQEBAQEBBiEbHCEGAQIBAQIBAQEBAQEWKBMHDgcECAQzIiIfAwQXG2Q8BgcFCwUVNR0CHTUVBAgFAQcGQGMcHQIfAfQlQBsaJw4eHkgfHgEBAQEBBhAHAwYCBAUFBAIGAwIGAwMIBswabUdAQUJ7NzcrAQECBQMECQQLEQYGBwICAwMCAggICBkREy4aARAjEgEkUyopUyYBmAMDAwMBAgEBAQMDAwMBAQEC/TgRIQ8vQw4BAQEBAQEBAQEBAQEDBQYCAQMBAQEBAQEEEAoFCAUCBQInMjFvOzs5Q2UUAwoGtQEDAQQEBAQBAgGvBgsCF2FFR5pBAAUAwv/DBBsDvQAJABoAfACJALMAADc0NjUHMBQxOAEFNjQ1PAE1LgEvAR4BFxYUBzcuAS8BMDQxARE8AScuAScuASMiBgcOAQcGFBURARQiMQcwFDEwBjE4ATEUMDE4ATEwFDEwIjEwFDEwFDEwFDE4ARU4ATE4ATEVFBYXHgEXHgEzMjY3PgE3PgE3NjQ1PAE1ATIWFw4BIyImJz4BMwEOAQcOASMiJicuAScuATU4ASM3AT4BNREeARceATMyNjcRFBYXARcUBsQCAgNWAQEBAQUCAwEDAgEBAQEO/twBAh8JDygVFicQBx4EAf7bAQ4BAQUGE1ooOYpJSoo4KVoTBAUBAf5UGSYLCyYZGSYLCyYZAYsMRjM3iEhIiDczRgsBAQELASgBAgQJBg8kExcxEQIBASYLAjEBAgEDAQ4BAwEBAQIBAwIIAgQCAwkDCAIDAhUBAYIBzQEDAQ4LAQQDAwQBCg0BAwL+L/6BARUBAQEBAQEBAQIHDQYVGwcKCgoKBxsVBQoGAQMBAQECA3MEAwMEBAMDBPyDDBgJCgoKCgkYDAECARABggIFAwG7AQIBAwMFBf5IAwQC/noQAQIAAAAABAAZ/80D5wOhADwAeQCzAO0AAAE0Jic0Jic0JicuAScuASciJicmIiciJiMuASsBIgYVFBY7AQcGFBceATMyNj8BFRQWMzI2PQE0JjUmNCcFMzI2NTQmKwEqAQciBgciBiMOASMOAQcOAQcOARUOARUOARUOARUGFB0BFBYzMjY9ARceATMyNjc2NC8BASIGHQEnJiIHBhQfASMiBhUUFjsBOgE3MjY3MjYzPgEzPgE3PgE3PgE1PgE1PgE1PgE1NjQ9ATQmIwEUFhcUFhcUFhUeARceARcyFhcyFhcyFjMWMjsBMjY1NCYrATc2NCcmIg8BNTQmIyIGHQEUFhccARcBlQEBAgEBAQMJBQECAQEDAgEDAgEDAQMGA9gZIyMZSLMREQkWCwwWCbMiGRkjAQEBAZ9IGSMjGdgDBgMBAwECAwECAwEBAgEFCQMBAQECAQEBAQEjGBkjswkWCwwWCBISsv4oGSKzEjESERGzSBkjIxnYAwYDAQMBAgMBAgMBAQIBBQkDAQEBAgEBAQEBIxkBDwEBAgECBAgFAQIBAgMBAQQBAQMBAwYD2BkjIxlIsxISETIRsyMZGSMBAQEBMwEDAgEDAgECAQUIAwEBAQIBAQEBAQEjGRkisxIxEgkICAmzSBkjIxnYAwYDAQICTSMZGCMBAQEBAQIBAQEDCAUBAwEBAwIBAwIBAgIDBQPZGCMjGEmzCQkJCREyEbMCjCMYSbMSEhEyEbMjGRgjAQEBAQECAQEBAwgFAQMBAQMCAQMCAQICAwUD2Bkj/tsBAwIBAwIBAgEFCAMBAQECAQEBAQEiGRkjsxEyERISs0gZIyMZ2AMGAwECAgAAAwAB/8ED/wO/ABUAKwA1AAABIxE0JisBIgYVERQWMyEyNj0BNCYjARUUFjMhMjY1ETQmKwEiBhURIyIGFRczMjY1ETMRITUD54UOCZ0KDg4KATkKDg4K/BoOCgE5Cg4OCpwKDoUKDjCECg5t/vcB6gG9Cg4OCv2OCQ4OCZ0KDv6LnAoODgoCcgkODgn+Qg4KGA4KAb79vmwAAAAAAgCDAP0DgALmAAsAQAAAASIGFRQWMzI2NTQmAyIHDgEHBgcnLgEHDgEfAR4BMzoBPwE+AScuAQ8BPgEzMhceARcWFRQWMzI2NTQnLgEnJiMCACg3NygnODghLy0sUSIiGwwEFg0NDgMgAhILAgMCggwOAwMXDTYriU1BOTlWGBkTDQ4SHR5nRUVOAbs4Jyg3NygnOAErDAsqHx4mNQ0OBAMWDYEMDQEfAxcNDQ4EDT5IGBlVOjlBDRMTDU9FRWYeHgAAAAMAeAAVA4cDRgAsAE4AbQAAAScmIg8BBhQfAQcnLgEjIgYPAQYUHwEeATMyNj8BNjQvATceATMyNj8BNjQnARYUDwEOASMiJi8BJjQ/AT4BMzIWHwEHBhQXHgEzMjY/AQEHDgEjIiYnNzY0JyYiDwEnJjQ/AT4BMzIWHwEWFAcDhy8mayWrJiYCHQMSLxoaLxKrJiYqFDIaGjIUpiYmAh0TMBsbMhOmJib+VxUVpQscEA8cCyoUFKsKGQ4OGQoDYwkJBAsGBgsEYwGBpgscDw4bCmMICAkZCWMCFBSrChoNDRoKLxQUAxcvJiaqJmsmAh4DEhMTEqsmayUrFBMTFKYmayYCHhIUFROmJmsl/lgVORWlCwwMCyoUOhSrCgoKCgNjCBkJBAUFBGMBGqYLCwoKYgkZCQgIYwIUOhSrCgoKCi8UOhQAAAACAEUAFwO6A2kARQBsAAABERQGIyImPQEBDgEjIiYnJjQ3ASMiJjU0NjMhOgEzMhYxOgEXMhYXHgEXMhYXMhYXFBYXMhYXMhYxHgEXFBYVMBQxFhQVAyEiJjURNDY7ATIWFRQGKwEiBhURFBYzITI2PQE0NjMyFh0BFAYjA7YcFBQc/sMHEgkJEQcPDwE9wBQcHBQBMwIDAgEBAQIBAwQCAQIBAQIBAQIBAgEBAQEBAQIBAQEBl/3CQVtbQYAUHBwUgBkjIxkCPhkjHBQTHFtAAzn+zBMcHBPB/sIHBwcHDicOAT4cFBMcAQECAQEBAQIBAgEBAgECAgMDBAICAQIBAgQB/N5bQAIcQFscFBMcIxn95BkjIxl4FBwcFHhAWwAEAE0AeAOvAwwAGgBBAE4AWwAAJSEiJjURNDY7ATc+ATsBMhYfATMyFhURFAYjASIGFREUFjMhMjY1ETQmKwEiJi8BNCY1NCYrASIGFRQGFQcOASsBASImNTQ2MzIWFRQGIxEiBhUUFjMyNjU0JiMDUP1cJzg4J4UIAikc/RwpAQmFJzc3KP1cERcXEQKkERcXEZoKDgMOAQkH/AcJAQ4CDwqaAVJMa2tMTGxsTDVMTDU1TEw1eDgnAXAnNyQcJyccJDcn/pAnOAH3GBD+kBEXFxEBcBAYCwo7AQMCBwkJBwIDATsKC/57a0xMbGxMTGsBOEw1NUxMNTVMAAADAEsBTgO1AjIACwAXACMAAAEUBiMiJjU0NjMyFgUUBiMiJjU0NjMyFgUUBiMiJjU0NjMyFgEuQy8vQkIvL0MBREMvL0NDLy9DAUNCLy9DQy8vQgHAL0NDLy9DQy8vQ0MvL0NDLy9DQy8vQ0MAAAAACQABAVYD/wIqABgAMACjAMYBRAFYAcIB9wIsAAABLgEjIgYHDgEVFBYXHgEzMjY3PgE1NCYnBzIWFx4BFRQGBw4BIyImJy4BNTQ2Nz4BJSIGFQcuAScxIiYjKgExKgEjMSoBIyIGKwEwIjEGIiMOAQcjFAYPAQ4BMQ4BBxQGMQcOARUcARUcARUXMBQXFR4BFx4BHwEwFjkBHgEXMhYXHgEzMToBNzAyMzgBMTMwMjE+ATcVFxQWMxc1MjY9ATQmIwcUBgcOASMiJic4ATEjLgEnLgEnLgE1NDY3PgEzMhYXHgEVNzwBNS4BJy4BJy4BJyMqAScqASMwIiMqASMiBgcOAQcOAQcwBgcOARUUFhceARceARceARceARceARcyFjM6ATMyFjsBOgEzMToBMzA2OwE+ATc+ATc+ATc1NjQ1NCYjIgYHDgEHDgEjIiYnLgEvAS4BJy4BJzM+ATUxPAExJz4BPwE+ATc+ATMyFhceARceARclFRQGIyImJz0CNCYnLgEnMCIxIgYHDgEdAjEVFAYjIiY9AjA0MS4BMTAmJy4BIyIGBw4BHQEOASMiJj0BNDYzMhYXMjY3PgEzMhYXHgEXMhYzMDYzPgE3PgEzMhYzMhYXMhYXHgEVBxQGKwEiJjU0NjsBMjY1NCYrATAiIyImNTQ2OwEyFhUUBisBIgYVFBYzMTAyMTMyFhceARUhFAYrASImNTQ2OwEyNjU0JisBMCIxIiY1NDY7ATIWFRQGKwEiBhUUFjMxMDIxMzIWFx4BFQNcDB0QER0MCwwMCwwdEREcDAwLDAs5ChIICAcHCAcTCwsSBwgHBwgIEv16BQgBCRUMAQEBAQICBAIBAgEBAgEBAgECAQoRBwEBAQEBAQEDAQEBBwYBAQMKCAMGBAIBAgMBAQIBBw8JAQIBAQECAQwVCQEHBQMFBwgGDggHCBILBAkFAQQJBAUHAQEBCAgHEgsKEggHCNEBBgQDBgMJFAwBAQIBAQICAgECBAIKFAkBAgIBAwICAQsMAwIDCQYBAwICBQMBBAIECgQBAgIBAgEBAQEBAQIBAQIBAgEBDhkKAgQCAQEBAQgGBAYCAQQCBxMLCxIHAgIBAQEBAQICAXgEB4IBAwIBAQMCCBILChIIBAUCAQEBAYcIBgUIAQQFBAkFAgYKBQQECQUGCAEDBAEFCgYGCgQFBAEIBQYICAYEBwIBAQEGDgcLEwgBAQEBAQEBAQECAQcTCwECAgkQBwECAQgI3RsUOQYICAY5CAwMCRkBARQcHBQ5BQgIBTkIDAwIARoFCgUNDwIeGxQ5BggIBjgJDAwJGQIUHBwUOAYICAY4CAwLCQEaBQoFDQ8B4gwMDAwMHRERHQwMDAwMDB0RER0MBAgICBMLDBIICAgIBwgTCwwTCAgITAcFNwgJAQEBAQMJBwEBAQEBAQEEAQEBAQoXDQECAQIEAQQCAQIKEwgDBQMBAQEBAQEBAwMBAQoHBgEEBwEBCAW3BgiCCxMIBwgBAgIGBAYMBwMGBAsTCAgICAgIEwsDAgMCCRAIBAgDCQsDAQYGAQIBAQMBAgEMHREIDwcIDQcBAwECBAEBAgECAwEBAQEBDAoDBQIBAgEBAQMBBgkEAwIEAggICAcCAwEBAQMCAwcEAQcFAQELBAgDAQIEAggICAgECAUBBAILWwYJCAUBVgYGCwUEBAEFBAUKBgEBWwUJCAUBXAEECgUCBAUFBAULBl0GBwkFiAYJBQQBAQMECAYBAgECAgECAQYIAQcHAgEIFQw7Ex0IBgYIDAgJCx0TFB0JBQYIDAkIDAICBhgOEx0IBgYIDAgJCx0TFB0JBQYIDAkIDAICBhgOAAACABH/zQP8A74APgBEAAABJQYHDgEHBicGBw4BBwYHDgEnLgEnLgE3PgE3Njc+ATc2Nz4BNzYmJyY2Nz4BNzYWFw4BDwEOARUeARceARcBNiYHBhYC4gEaCx4fYUJBUCwtLlstLiwYRzITJRAaLhsOPhghIB8/ICAhCiQDAgsBBTIiJGg+VG4rSYxEFgEFAS8JEBwQ/eQqGS40HQIGZUM3OEoODhEpLS1bLi4sGDAXCCYQGFYwGTcYIR8fPiAfIgohCAopDUJvJCg6BQY2KBk1GG0IFgYLIgYQGgz+Og5eCglrAAAEAC4AgAQNAwAADwAgADAAlQAAJRUUBiMhIiY9ATQ2MyEyFjUVFAYjISImPQE0NjMhMhYVERUUBiMhIiY9ATQ2MyEyFgEOAQcOAQc8ATUxNDU8ATU0NTIWFx4BFx4BFxY2Jy4BJy4BJy4BJyYGBw4BBw4BBwYWNz4BNz4BNxQVHAEVFBUxHAEVIiYnLgEnLgEnJgYXHgEXHgEXHgEXFjY3PgE3PgE3NiYHBA0NCf2bCA4NCQJnCAwNCf2bCA4NCQJnCAwNCf2bCA4NCQJnCAz9BwkRCQgOCQMDAgUNBQoQCRMeCQQSBxAeEAcRBxMcCA8fEAcSBAkcEwoQCQgPCAMDAgUNBQoPChMeCQQSBxAeEAcRBxMcCA8fEAcSBQgcE9I3CxAQCzcNDxH+OAsREQs4DQ8RCwEKNwsREQs3DA8Q/jUFEgkIEAcgeiMWIyNKICAPBAIFDQUKEQUIHRQIEAcQHREHEwMIGwoPHxAHEAgSHQYFEgkIEAcQJCRRJSURJWseBAIFDQUKEQUIHRQIEAcQHREHEwMIGwoPHxAHEAgUHQgAAAAEAAcAewRLAwUAJgBVAJQBCQAANzgBMSImLwEHBiYnJjY/AT4BFx4BHwETPgEzITIWFRQGIyEDDgEjARUUBg8BDgEHDgEVFAYjIiY1NDY3MT4BNyMqAQcOAQ8BIzU/ATUzFRQyFzIWOwEFByM1NDY/AT4BNTQmJy4BIyIGBw4BBx4BFRQGBw4BIyImNTQ2Nz4BMzIWFx4BFRQGBw4BDwEzMjYzPgE/ATMBFAYHDgEjIiYnLgE1NDY3PgEzMhYXHgEVFAYHDgEHHgEXHgEzMjY3PgE1NCYnLgErASImNTQ2NzE6ATMyNjc+ATU0JicuASMiBgceARceARUUBgcOASMiJicuATU0Njc+ATMyFhceARUUBgcOAQceARceARWwCxAFTA0LHAkIAw0vBxAGCQsEQN8EEgkCdw8UFQ79nfYEEgkDHQMDQAkOBAMDDw4UCR4eCBYOYw0LAQIDBAISAQ8UAQEBEx95/u4RwAMEXBcYBwcHFg0KEQgGCAQNDgUEBA0HEBEODw4jExYmERARCggGEw5SSw8NAQEEAgIe/iQODQ4eEQ8dDA8PBAQECwcGCgQEBQUEAgQCAwYEBw4ICgwGBAMEAwQOCxQHCAULAwYCCg4EBAUDBAUJCAsRBwMDAwQDAwQDCgUGCgQEBA4MCxkNDhsLDQ4JCQQLBwgOBQsLewoKnwkJBAwMHQgjBAQDAQoHhQGsCAoVDg8U/icICgGACwYJBFkOKBcRMyEQEhoILlsuCx8UAgEQFQcHB1oJBwICBd5iDAYJBGQaMxYPFwsLCgYFBQoGARINBwwFBgMSEBQiDg4NDQ4OJRYPHA4IFA5QAgEQEwcBJxIeCwsLCQgJGhAHCwQDBAUEBAoGBwsEAQMBAwQDAgMICAcTDQwTBwgJBwUDCQEJCAgTCwgMBgUEBQQCAgIECQcFCwQDBAMEBAkHDhgIBwcHBwgYDgwYCwYJBAQJBwkaDgAAAAADAE4ABQOzA3oAMAA6AFkAACUnLgEnLgEnMDIjJjQ3MiYxPgE3PgE/ATYyFxYUDwEhMhYVFAYjIRceARUUBgcGIicDBhQXLgE1NDY3ASMiJjU0NjsBMjY1ETQmKwEiJjU0NjsBMhYVEQ4BBwE12QEBAQEDAQEBBQUBAQEDAQEBAdkOKA4ODogBwRQcHBT+P4gHBwcHDigO4QUFAwMDAwLD1BQcHBTUGSMjGdQUHBwU1UBbAVtAxtkBAQIBAwILGQoBAQQBAQIB2Q4ODicOiBwUFByHBxIJCRIGDg4BEQoZCwUMBgcLBf4uHBQUHCMZAj4ZIxwUExxaQf3CQFsBAAAACwC3//kDkAOJAA8AHwAvAD8ATwBfAG8AfwCPAJ8ArwAAASEiBhURFBYzITI2NRE2JgU0NjMhMhYdARQGIyEiJjUTFAYrASImPQE0NjsBMhYVNRQGKwEiJj0BNDY7ATIWFTUUBisBIiY9ATQ2OwEyFhUTFAYrASImPQE0NjsBMhYVNRQGKwEiJj0BNDY7ATIWFTUUBisBIiY9ATQ2OwEyFhUTFAYrASImPQE0NjsBMhYVJzU0NjsBMhYdARQGKwEiJjcUBisBIiY9ATQ2OwEyFhUDKP35LD4+LAIFLD4CPv3NFw8BuxAWFw/+RRAWgBYPOA8YFhE4DxYWDzgPGBYROA8WFg84DxgWETgPFsUVDzkPFRUPOQ8VFQ85DxUVDzkPFRUPOQ8VFQ85DxXGFhE4DxYWDzgQF34SDTgNExMNOA0SfhYROA8WFg84EBcDiT4s/UQsPj4sArwsPnoQFhcPcBAWFw/91A8XFhA5DxUVD3UPFxUROQ8XFhB2DxUVDzkPGBYR/moPFxYQOQ8VFQ91DxcVETkPFxYQdg8VFQ85DxgWEf5qDxcWEDkPFRUPdTkMExMMOQwTE7sPFRUPOQ8YFhEAAAADAAsALgQsA1AAGQAwAEIAACUiJi8BLgE1NDY/ATYyFxYUDwEXFhQHDgEjISImJyY0PwEnJjQ3NjIfARYUDwEOASMFKgEnLgE3Ez4BFx4BBwMOASMBFgwWCs0ICgoIzRI0EhISoaESEgoWDAIdDBYKEhKhoRISEjQSzRISzQoVDf6WBAgEGRoHtwcrGRgaBrcEIhW3CQnLCBgMDBgIzRISEjQSoaESNBIICAkJEjQSoaESNBIREc0SNBLNCQmJAgYsGQKqGBoHBiwZ/VYUGQAACQAJAAkEQAN3AAQACQAOAB4ALwA/AHAAgACxAAABIRUhNREhFSE1ESEVITUnIyImPQE0NjsBMhYdARQGJyIGHQEUFjsBMjY9ATQmKwETIyIGHQEUFjsBMjY9ATQmBw4BBw4BIyImJy4BJy4BNTQ2Nz4BFzIWFx4BFzAWMTI2Nz4BNz4BMzYWFx4BFxQGBwMjIgYdARQWOwEyNj0BNCYHDgEHDgEHIiYnLgEnLgE1NDY3PgEzMhYXHgEXMBYxMjY3PgE3PgEzNhYXHgEXFgYHAVICs/1NAjD90ALu/RKXdBokJBp0GiQkjgIFBQJ0AgUFAnR0dBgmJBp0GiQkAxQrFQMJBAYMAgsXDAEGBgMCBwUEBgMIDQgGAQgCEB8RAwYEBQcEAwUBCAMXdBokJBp0GiQkAxQqFgMJBAYMAgsYCwEGBgMCBwUEBgMIDQgGAQgCEB8PAwYEBQcEAwUBAggDAypWVv68Vlb+xlZWnSQadBokJBp0GiS3BQJ0AgUFAnQCBQF3JBp0GiQkGnQaJFwUKxUCCQ0ECxYNAQUDBQUCAwgBCQIJDAkFCQIQHxEDBgEGBAMFAwQIBf3eJBp0GiQkGnQaJFoWKhYDCAINBAsWCwIGBAYFAgMGCAMIDQgFCQIQIRECBwEGBAMGAgYIAwAAAAMADf/ABDwDswAoAD4AfgAAAR4BFz4BOwEHDgEXHgEzMjY/AT4BNTQmLwEmBgcGFh8BIyIHDgEHBgcHDgErASIGFRQWOwEyNz4BNzY3LgEnBScmBgcGFh8BIyInLgEnJicmJy4BJyYrASIGFRQWOwEyFx4BFxYXFhceARcWOwEHDgEXHgEzMjY/AT4BNTYmJwIxDxwOL2dHN1YQAw4HFAsIEgfACAoKCMAQKg0OAxBaOTAoKEQdHRp1LmpJmRUeHRaZMCkoRR0eGQ8cDgJuwBAqDQ4DEFo9KyQlPh0cHB8iIlU1NEOaFR4dFposJSRAHB0dHiIjUzQ0QjdWEAMOBxQLCREHwAgLAQoIAlgZMxlRc0kOKREICgYHowcUCwsVBqMOAxARKQ5LDxA1JCMozVFzHRYWHRAPNiMkKBoyGs2jDgMRECkOTRcXSzExNDo6Ol0dHRwVFR4XF0syMTU5OTpdHR1JDikRCAoGB6MGFQsMFAgAAAMARP/aA7wDlwAiAEIAYgAAASEiBhUROAExFBYXMxUUFjMyNjcxNzM+ATU4ATkBETQmIzEBMBQxFAYjMSEuATUwNDkBNTA0MTQ2NzEhHgEVMBQ5ASUWMBUUBgcxIS4BNTQwNTE1NDA1NDY3MSEeARUUMAcxA3b9FB0pKR3rDgoFCAP93B0pKR3+jwoI/wAICwsIAQAICgElAQsI/dsICwsIAiUICwEDlyod/ZUdKQGsCg4DA74BKR0Cax0q/eUBCAwBCwgBRAEICwEBCwgBmgEBCAsBAQsIAQFFAQEICwEBCwgBAQAAAAAEAKoAOwOUA0UAPQBFAE8AZgAAASYiDwERNCYjIgYVEScmIgcGFB8BHgEXMBYxMhYzOgEXOgEXOgEzOgEzMjY3MjY3MjQzMDI1PgE3MTc+AScBIwcjEzMTIy8BLgEnDgEPATMTFSE1Nz4BNyIGKwE1IRUHDgEHMjY7AQOUCx8LSRYPDxVJCx8LCwuHAQMBAgIBAQEBAgEBAQIEAgEEAgEBAgEBAQICAgEDAYcOAQv+CY0UUnxfgFUrFAYPCAcPBRRgYP7mcQ8gEBkyGEgBE3IPIA8ZMRlPARoLC0oCMA8WFg/90EoLCwsfC4gBAwECAgICAQEBAQICAQMBiAsfCwEUOwFS/q5+OxMtFhYtEzv+EUdAhRIjEgJIPoYSIxICAAAEAAIAZQQ8AxsAHAA4AE8AjAAAASIHDgEHBhUUFx4BFxYzMjc+ATc2NTQnLgEnJiMBFAcOAQcGIyInLgEnJjU0Nz4BNzYzMhceARcWBzU0JiMiBh0BFBYfAR4BMzI2NzY0LwEFJiIPARE0JiMiBhURJyYiBwYUHwEeATMwFhUyFjEwMjEwFjE6ATM6ATMyNjcwMjEyNjMwMjE+ATM3NjQnAV1IPz9fGxsbG18/P0hIQD9eGxwcG18/P0gBDxUWSTEyODcyMUkWFRUVSTIxODgxMUoVFucaERIaBwZ+BRAICBAHDA5uArcLHQtHFg8PFUgLHQsLC4YBAwECAQMBBAEFAQIEAgEDAQIBAwIBAgIChQsLAxsbG15AP0hIP0BeGxsbG15AP0hIP0BeGxv+pTgxMUoVFhYVSTEyODgxMUoVFhYVSjExLagSGhoSugkRBXkGBwcGDCQMbqELC0cBzQ8VFQ/+MUcLCwsdC4UCAgEBAgIBAQIBA4UNHwsAAAEAAABwBEkDEAAjAAAlKgEjLgEvASMiJjU0NjsBMhYfAQE+ATMhMhYVFAYjIQEOASMBBwEBAQ4WBVBdExsbE34PFwY4AQYFFwwB3RQaGhT+P/7XBhYOcAEQDuQbExMbEg2hAeoLDBoTExv90gsMAAAEAAUASwRHAzUAHAAsADwAbQAAASIHDgEHBhUUFx4BFxYzMTI3PgE3NjU0Jy4BJyYTDgEjIiYnMzUhMBQVDgEHEyE2Nz4BNzYzMhceARcWFyUGJisBBhQVFAYHBiInJjY9ASMiBicuATc2FjsBNjQ1NDY3NhYXFgYdATM2FhcWFAcDADQuLkUTFBQTRS4uNDQuLUQUFBMURC4ucRxWMT9mGBUBZgcOBqL9chciIlQxMjU1MjFUIiIX/ZQIPhpWAgMOCTQKEgJTGj0KBQEECT4aVQEFFRctBwMBghMdBgUFAzUUFEQuLjQ0Li5FFBQUFEUuLjQ0Ly5EExT+jyctRTkCAQELFgn+hywkJTQODg4ONCUkLM0SARtFIBQeBgQECEAaVAEQCjYJEgEbRSAYHwMDBRAIFwuAAQIOCDQJAAAAABgAGACmBMwDKAADAAcADAAQABQAGAAcACAAJAAoACwAMAA1ADkAPQBBAEUASQBNAFEAVQBZAF0AYQAAASM1MwcjNTMHITUhFSkBNSEFIzUzBSM1MwchNSEFITUhBSM1MwUjNTMFITUhBSE1IQUjNTMVKwE1MxUhNSEFIzUzBSM1MwchNSEFITUhBSE1IQUjNTMHIzUzBSM1MwUhNSEEzGVltVBQUP5vAZH+Hv7UASz+g1BQBGQpKSn+bwGR/h/+bwGR/h/JyQPr8fH+v/5vAZH+Hv5vAZEDI6Gh8VBQ/VYCqv0GyckD62VlZf6/AUH+b/7TAS3+g/6/AUEDc3l5ecjI/ufIyP7o/fYCCgMAKCgoKCgoKCgooSkpKSkpKSmhKCgoKCigKCgoKCgoKKEpKSkpKSkpoSgoKCgoKCgAAAAAAQAUAHgEygMIAHkAACUUBiMhIiY1ETQ2MzIWFRE+ATc+ATc+ATc+ATc+ARceARceARceARceARcWNjc+ATc+ATc+ATc2FhceARceARcWBgcGJicuAScuAScuAQcOAQcOAQcOAQcOAScuAScuAScuAScuAScmBgcOAQcOAQcOAQcOARUhMhYVBMoSDfuIDRISDQ0SBAgFAwUDAgUDEC4rIlYqRU4SCQ0FBQoGDzAVM1EhERkLCRAJGjcUFy0SIxoKBAoHBQkMCxgFCQsECREXCBULEB8NBw4JChwTOoMxMD8GCAsFBQsIDT4tHzgSJCkPAwUCAwYCDxcEMw0Slw0SEg0CUg0SEg3+WA4cDQkRCAgRCDl5MCYhCA14JhQmExAeDyJECBUYLRcuFREeDCQbAwMLDho3Hw0eEAwYBQUJDBMhDhwkEQYGAgIVEgoaEBUyGk8KFBNtDxEiEREiERxkCAYeEyltNAkRCAkRCCxZKxINAAAAAgAA/8QEAAO+AFoA3gAAAS4BIy4BBw4BByIGBwYHDgEHBh0BHgEfAR4BHwceARUfAx4BFx4BFx4BFzMfAh4BFx4BMx4BHwMeATMeATcyNj8BNjc+ATc2NTQnLgEnJicFFgYXHgEXHgE3NiYnNhYXHgEXHgEXDgEHHgEXHgEXPgE3PgE3PgE3JjYnLgEvAjYmJz4BFzYyMxczJz4BNy4BJz4BMzYmNTQ2NTYmNw4BByImJyY2NycGJgcOAQcuASc+ATczMhceARcWFRQHDgEHBiMiJy4BJyY1NDc+ATc2Nx4BFwKxAwcFKFcwMVknAQYBRjo5UxcXAgMEAgMJBQQLBBMNAg0BAw0GEQ0HDQgICwQEBQICDQINAwcFAQYBAgQDERcrBQcFI0sqHjcaCFNGRmYdHBkYWT49Sv5rDQ4DARAGBQ0OBBIFBw4HFTooBRAFDiMRECcTBCsgBQoFBAUOFVUYBRAHBCkKsRwFFQwNGBMGKRUJFwoRJBMCBgUFEQYDDhgBHAgQJwwIDAUDKAoPFSMPEREPDBsQBhAIE1dNTHIhISEhckxNV1dNTHIhIQoLKBwcIg0VBwOiAgINDAECEg4DAhwwL3pJSVArDhsODQ4dDA0aCicVBBQBAwIPCRMPBg0GBQkDAgUCCAMIAgUCAQMBAgEJChECAwkJAQgFAhUuL4JQUFlTTEt+LzAbxBs8HgwYCwodCwsYCgEQBxMdAwsSCRUnExUgEliIOwQLBiZAGiU6JRsuExMKEBMXHR0NCSEODCoqCBQHCAwFAwEHAwMICwUMFBMHGRECAiITFCoDDAQEIwYDBgEQIA4hIXNMTVZXTUxyISEhIXJMTVcxLS5TJCQdBhIOAAAAAAQALwAhBCMDXwAMABgAJAAwAAABFAYjIiY1NDYzMhYVAxQGIyImNTQ2MzIWJRQGIyImNTQ2MzIWExQGIyImNTQ2MzIWAg1WPT1WVj09VrhWPT1WVj09VgItVj09VlY9PVahVj09VlY9PVYCDT1WVj09VlY9/qc9VlY9PVZWZT1WVj09VlYBOT1WVj09VlYAABIAnf/LBFsDtgB2AIwAmwCpALIAuwDBAMoA4ADoAQEBDwEYASEBJwEvAT4BVgAAAT4BPQEHMAYrAS4BJz4BNz4BPQEHMAYjIiYxJxUUFhceARcOAQcqASMiJjUnFRQWFx4BFw4BFRQWFy4BMScVFBYXHgEzOgE3HgEXBzM3HgEXHgEzMjY3PgE3FzMnPgE3MhYzMjY3PgE9AQcwBgc+ATU0Jic+ATcBIy4BNTQ2NxY2NxcOARUUFhcHDgEjFy4BJz4BNz4BPwEeARcHEwcuATU0NjcXDgEVFBYXHgEXBy4BJzcTLgEnNx4BFxU1LgEnNxURDgEHJz4BNxU1DgEHJz4BNz4BPQEHMAYHPgE3HgEXEzkGEx4BFy4BMScVFBYXHgEXBy4BJzA0MT4BNxM+ATU0Jic3HgEVFAYHBw4BByc+ATcXAx4BFwcuASc1ExcOAQc1ETU+ATcXDgE3Jz4BNxcUFhceARcOAQc3IjAjIiYvAT4BNTQmJzceATceARUUBgcEVwICCTY5BS2BSwQFAgICCTY5OTYJAgICBQRMgC0BAwE5NgkCAgYkGw4ODg8hHggBAgpCKQQHBCJZMy4tIwgRCRE0HR00EQgQCSQsKTRaIQMHBClBCgIBCB8gDg4ODholBvy7AhARDw0RIA5WDQ0NDVAOHhLMK0oeFx8HAQEBJRIyHjRIbAoLCwpsAwMDEgMKBSsZKRBrNykuBioNGgwKFAspEBwKbBxVMTliIEsNEQQCAQgYGixyQQ0fEAZVQXMqGRgJAgIEEQ1KIGI5Dx4OCAMDAwNsCwsLCxAPKhkqBAkFaqIxVRtsChwQASkKFAsNGgwqBS5lNB4yEiUCAQYfFx1LKs0BARIkD0oNDQ0OVg4iEA4OEBACtwcPBwoEEUBXEwcOCAcOCAkFEBAFCQgOBwgOBhNXPxABAwoHDggbKwslTSgoTiUECgUJCA4HKTMBLUUVcmEDBAMYGxsYAgUDYW8XRS0BMygIDgcKBQsDJE0oKE4lDSob/nclUCgmSSMBBwcyGTcdHDYZLgICzBI4JAwpGAYKBRQcKw6PAUs9FS8XGS8WPgcQCQgOIgUJA3YNJBg+/skBDAF2BAQBe5sBAwNvdgEuAxAMPSkyAnuZAzkwKwweEQgOBwoFCAQyQw0LDQP+iQGQDEMyBAgECgcPBxAeDCovOQN3Ag4K/l4HEAgJEAg+FjAZGC8XGRclDHYDCAQ9AUwDMSg9DA8De/7NbwMDAXb+73wBBAR1AwsEjw4rGxUFCQUYKQwjORLOAwErGTccHTgaMQgHASNIJyhOJQAADAANAJED8QMNAA8AIAAxAEIAUwBkAHUAhQCXAKcAuADIAAAlISImNRE0NjMhMhYVERQGASIGFREUFjMhMjY1ETQmIyEXFAYrASImPQE0NjsBMhYdATMUBisBIiY9ATQ2OwEyFh0BMxQGKwEiJj0BNDY7ATIWHQEzFAYrASImPQE0NjsBMhYdAQUUBisBIiY9ATQ2OwEyFh0BMxQGKwEiJj0BNDY7ATIWFRcUBisBIiY9ATQ2OwEyFh0BIzMUBisBIiY9ATQ2OwEyFhU3FAYrASImPQE0NjsBMhYdAQMUBiMhIiY9ATQ2MyEyFhUDk/zYJzc3JwMoJzc3/LEMEBAMAygLEREL/NiXCQg1BwoJCDUGC5UJCDUGCwkINQcKlAkINgYLCQg2BguTCQg2BgsJCDYGC/6gCQg2BgsJCDYGC5MJCDUHCgkINQYLkwkIMwYLCQg1BwoCkwkINQYLCQg1Bwo+CQg1BgsJCDUHCnsJCP6IBgsJCAF6BguROCYBwCY4OCb+QCg2AjgRC/5ACxERCwHACxGNBwoJCDUGCwkINQcKCQg1BgsJCDUHCgkINQYLCQg1BwoJCDUGCwkINZgGCwkINgYLCQg2BgsJCDYGCwkINgYLCQg2BgsJCDYGCwkINgYLCQhiBwoJCDUGCwkINf7iBwoJCDUHCgkIAAMARgAOA7sDcgAwADoAWQAAAT4BMzIWHwERNDYzMhYVETc2MhcWFA8BDgEjDgEHOAExBiInOAExLgEnIiYvASY0NwEmIgc+ATMyFhcBNTQ2MzIWHQEUFjMhMjY9ATQ2MzIWHQEUBiMhIiYnAQYHEgkJEQeIHBQUHIcOKA4ODtkBAgECAwILGQoCAwIBAgHZDg4BEgsZCgUMBgYMBf4uHBQUGyQYAj8YJBsUFBxbQP3CQVoBAggIBgYIhwHBExwcE/4/hw4ODSgO2QECAgIBBQUBAgICAdkOKA0BZAYGAwMDA/091RMcHBPVGSMjGdQUHBwU1EBbW0AAAgACAFIESgMuAAQAJgAAJTchByEBHgEHDgEHAQ4BIyEiJicuAScuATc+ATcBPgEzITIWFx4BAgHA/knAAbcCQwQDAQIJB/4ACxsR/kkKFAkJDgQFAgECCAgCAAocEAG3CxQJCQ6b3NwCaAoUCwsSCP22DA0GBgYPCgoUCwsSCAJKDA0GBgYPAAUAFQBcA+YDJwAZACoAPQBNAF4AAAEhIgYdASMiBh0BFBYzITI2PQEzMjY9ATQmARQGIyEiJj0BNDYzITIWHQElFAYrATU0JisBNTQ2MyEyFh0BFyEiBh0BFBYzITI2PQE0JgcVFAYjISImPQE0NjMhMhYVAtf+nBol4BolJRoBZBol4BolJf7PBAP+mwMEBAMBZAQEAR8FA+AlGk0FAwFkAwXJ/psaJCQaAWQaJSUSBAP+mwMEBAMBZAQEAyclGlAlGsIaJCQaUCUawhol/nADBAQDwgMFBQPCjwMFOxskUAMFBQPCiyUawRolJRrBGiU/wgMEBAPCAwUFAwAAAAADAEYADgO7A3IAMAA6AFkAAAE3PgEzPgE3OAExNjIXOAExHgEXMhYfARYUBwYiLwERFAYjIiY1EQcOASMiJicmNDclJiIHPgEzMhYXATU0NjMyFh0BFBYzITI2PQE0NjMyFh0BFAYjISImJwEG2QECAQIDAgoZCwIDAgECAdkODg4oDoccFBQciAcRCQkSBw4OARILGQoFDAYGDAX+LhwUFBskGAI/GCQbFBQcW0D9wkFaAQKL2QECAgIBBQUBAgICAdkOKA4ODoj+PxQbGxQBwYgHBwcHDigO4QYGAwMDA/091RMcHBPVGSMjGdQUHBwU1EBbW0AAAAQAAP/ABAADwAAdAD0A0wEkAAAlHgEXHgEzMjY3Jy4BMQ4BIyImJy4BJzAGDwEeARcBISIHDgEHBhURFBceARcWMyEyNz4BNzY1ETQnLgEnJgEeARc3PgExLgEnJicuAScmJz4BMyEyFhcGBw4BBwYHDgEHDgEHMBYXHgEzPgE3Njc+ATc2Nx4BFREqASMiBgcOATEOAQcOATEOASciJicuATEuAScuAScuAScuAScuAQcwBgciBgcOAQcOAQcOAQcwBgcOAQcOATEOATEOASMqAScuATEuAScuAScRNDY3FhceARcWFwMeATcyNjM+ATc+ATc+ATc+ATcwNjM+ATcyFhceARceARceARceATEwFhcwFh8BHgEzFjY/ATI2Nz4BNzA2Nz4BNz4BMxUUBiMhIiY9AR4BFwF3Dx8QECAQIDcdEgshDx8OGicQCxcNCQImDhsQAbz9mislJTgQEBAQOCUlKwJmKyUlOBAQEBA4JSX9awweERMIGw8ZDBEQEB0MDAsPIBECVgsWCQ4ODhwODxATLh8BBAEdCQoQAiE0EREPEBwMDQwVGAUMBgcfBQMXFigVCSQLHA4LFAkEEAQQAwUSAwYNBgwWDRMqFg0FARMDCBIGCBAIAwkFHQwECgUBEgIHCRoJCgQDBAcIFAYFHA4OCwwODRwPEBB6FTMaCiYBCBAIEB0NCBIIBQcFFAEIEwwJEQoGDQQHCgUBCgIDEA8GLhILCxYMDhwNEQIfARgrFRAJCggKCBEJWD39qD5XAwcFzQ0UCAgHFhkNBhwLDBoOCx0SCQImEiAOAvMQETglJSr9nComJjgREBAQOCUlKwJmKiUlOBEQ/kIeRyMTCBgePBsrKytWKSonBwgDAzIuLlcpKScyZTABBgMXAwMBNm4tKisrVisrKRQ4Hv7VCgMBDhAnEwofCg0CCAcBDgMPAwUTBAYNBgoTCAsOAgEBBQIDBwcGDQYDCQMdCgQKBQEQAQUHCgIBAwMMBgUaDgGHGCoTKSgpTycnJ/7vDhUFDQUJBQscDwgSCAQIBQ8EBwEDBQMJBQUKBAIKAQMQDwcpCgYFCAIEBAcTAhIsFRAICAYFAwPgPldZPGkDBwMAAAAAAQAZ/9kD5wOnAGUAACUhPAExNjc+ATc2NzY3PgE3NjMyFx4BFxYXFhceARcWFxY2Nz4BNzYWFx4BFx4BNz4BJy4BJy4BBw4BBw4BJyYnLgEnJicmJy4BJyYjIgcOAQcGBxE0JiMiBhURFBYzITI2NTQmIwPE/KgBBAMLCQgLERMTJhISDh0VFiENDQoMDQwgFhcgSlogECkPFBoOAwUEAxoNDw4FAwUDCTFLKzkbITsjDgwMFgkKBw0QEC8iIjEhHR0zFhUTFA4PFBQPA4gPFBQPHgECEyYmYTk5OVs/P04RERscVjU0MjYyMU0YGAQKeT4eRQECJ0cOHA0ODgQEGg0KGQ4zeAYDUzM/TgQCGBdEJychPj4/ZCAgFRZWQEFXAcIPFBQP/HgPFBQPDhQAAAMALwBQA9EDMQASAC4AUgAAAQUjIgYdARQWOwEFFjY1ES4BBxMiJicmNjc+ATU0JicuATc+ARceARUUBgcOASMXIiYnJjY3PgE1NCYnLgE3PgEXFhceARcWFRQHDgEHBgcOASMCDv74nhciIheeAQgMHAEbDKUKFAUJCQ4fIiIfDgkJCSEOMDg4MAULBXsIEAYLAQw0OTk0DAIMDCENIBkZIwkJCQkjGRkgBg4IAzHQIhjNGCLQCg4PAroQDQn90goKDiEJEjwjIzwSCSEODgkJHWI5OWIdAQOBBgcMIgswgUdGgjALIgwNAQwdJCNPKiosLCoqTyMkHQUGAAIAiwBdA2sDuwBRANIAAAEmNCMuASMuASMqAQcOAQciBjEOAQcOAQcwBjEuAScuASc0JicuAScqATEiBhUUFhcWMBceARceARceARceATM5ATI2NzI2PwE+ATc+AScuASc3LgEnLgEnNCYjLgEnJgYHBhYXHgEXOAEVHgEXHgEXFgYHDgEHIgYjBiYnLgEnLgEnJjY3PgE3PgE3Fx4BFx4BMxY2PwE+ASc8ATU0Ji8BLgEHDgEHHAEVFw4BBw4BBw4BBxwBFRwBFx4BFx4BFx4BFx4BFxY2Nz4BNzY3NiYnJicCjAEBAQEBBBAMAgMDCQ0EAQEMGAsLGAwBBAgFBQsGAgEEDwsBAQ0pCgQBAQsXDAUKBgECAQcVDQwSBQEBAXwBAQEGDwEBCwWhAQYDBAsGAQEBAwMSLQ0LAw4CBAIDBgIWFwIEFiYhTicGDAUXLhcZMRgtLQUGEyQUPyIOIA8MAQQDAQMBBQ0IgQUDAQcGpQgPBQIDAg0IEQk9cSomKAIBBCEdCRUMHUYlChQLOW42NGojGQsLBxERIAIYAQEBAgUMAQILBQILGAwMGAwBBQcEBQsFAQEBBQ0BKQ0LDgQBAQwWDAUKBgECAQgSDwYCAX0BAQEFEw4KDgSHAgYEBgsFAQECAwENCBIRJw4CBAIBBAkDH0EhK2AwKSkIAwICBgYYEiRcLCxjLhkuEgUIAWUJCwIBAQEGCaUFDAcBAQEHCwWBBwQDAQUEBAgFZwEDAg1ENTJwOQIEAQgQCC9fKgwZDBwuDgQHAg0IFhRVRTAyMmQwMCsAAAIAvf+9AxgDvwAQAFwAAAUjIiY9ATQ2OwEyFh0BFAYjAz4BNz4BFxYXHgEXFgcOAQcOAQ8BFRQGBw4BBzgBMQ4BIyoBIyoBIyImJy4BPQE+ATc+ATc+ATc+AScuAQcOATEGJi8BJjY3MDY/AQIUnA8VFQ+bDxUVDvYRJQ4jTjA+OztREBEYCikXJlwMAgYFAwYECxoPChQLCBQKDBcKDQ8CAgIEDwsNIRInXQ8LVCcTRA4kC1ULBQ4TBkBDFQ+cDxUVD5sPFgPUCg4ECwoDBRwcXUA/TiQ/FyhBKBM2CA8FAwUCAwIBAgUWDkwMFgYSIRAUJhIgSjssHBMJOQsED28OJAsQAyoAAAYAKv/3BCEDiQALABcAIwA0AEUAVgAAARQGIyImNTQ2MzIWExQGIyImNTQ2MzIWERQGIyImNTQ2MzIWARUUBiMhIiY9ATQ2MyEyFhUDFRQGIyEiJj0BNDYzITIWFREVFAYjISImPQE0NjMhMhYVARtGMjJHRzIyRgJGMjJHRzIyRkYyMkdHMjJGAwQMCv13CA4MCgKLCAwCDAr9dwgODAoCiwgMDAr9dwgODAoCiwgMAcAyR0cyMkdHAR4yRkYyMkdH/S4yR0cyMkZGAoo3CxAQCzcMDxAL/q82CxERCzYNDxEL/rA3CxAQCzcMDxALAAEAgwAeA4gDWQBDAAAlIicuAScmMTAmNzYWMRcnMCY3NhYxFwMwJjc2FjEXJzAmNzYWMTAXHgEXFhcWNjc2FgcOARUUFx4BFxYHBgcOAQcGIwJOLkhIiTIxLRgYRnvLOB4eSL3bNhwcVNulJR8fSR0dTSYmEyYiBBGYDAYxBQQJAwMCAhsbUjExLR4yMXYxMkoYGDVq7VUWFTi6AQlZFhY+699NGBdFJydhKysIDm0UUgIjDn4WCh4dTiwtKCgqKUQVFgAEAAQAcQREAw8AVAClAKoA/wAAEz4BPQE8ATc+ATc+ATczPgE1NCYjIgYHDgEHDgEdARQGByoBByIGFRQWFx4BFx4BHQEUFhceARceATMyNjU0JicjLgEnLgEnJjQ9ATQmJy4BJz4BNyUyNjU0JisBNzY0NTQmIyIGDwEjNzY0NTQmIyIGDwEjIgYVFBY7AQcjIgYVFBY7AQcGFBUUFjMyNj8BMwcGFBUUFjMyNj8BMzI2NTQmKwE3Mw8BIzczBS4BJy4BPQE0JicuAScuASMiBhUUFhczHgEXHgEXFBYdARQWFx4BFw4BBw4BHQEcAQcOAQcOAQcjDgEVFBYzMjY3PgE3PgE9ATQ2NzoBNz4BNTYmI6MEBQIBCAUNJRcCBwoIFCE0FQ0TBAMDIyQDBwMHCQcQEh4JCwsDAwQSDhU2HxMJCQgCGCQNBQgBAgUEBxcQDxYHAg0YDAwYFRUBDAsHFAQVVBQCDQsGFQQUQxkMDBk6DysZDAwZIhYBDAsHFAQWVBUCDQoHFAUWNRgMDBgsDh5TDlQOVAHREh0KCwsDAgUSDhU0IRMICAgCGSQMBQgCAQUFBhcQEBcGBQUBAggFDCYXAgcJCBMgNRUOEgUCAyQjAwcDCAkBCg0B7AgbEF8RFAULDwcMEAECCgkEEA8PCRgOCBwTbCEkBgIKCAMQAQELCAobEmwTHAgOFgsPDxICCQoCAQ4OBRELBRYPXxAbCA4WCAgWDgIUBwYWcwQHAgsOCxh2cwQHAgsOCxh2FQcFFlQVBwcUeQQHAgsOCxd/eQQIAQsPDBd+FQcHFFQDVFQaAQsIChsSbBMcCA4WCw4QEAQJCgIBDg4FEQsEExNfEBsIDhYICBYOCBkSXxMUAwsPBwwQAQIKCQISDw8JGA4IHBNsISQGAgELCAUNAAAAAQAN/8sD8wO3ABAAAAUhIiY1ETQ2MyEyFhURDgEjA8v8ahAYFxEDlhAYARcQNRcRA5wQGBYS/GISFAAAAQAAAAEAALaTjjtfDzz1AAsEAAAAAADcORRCAAAAANw5FEL//v+8BNMDwgAAAAgAAgAAAAAAAAABAAADwP/AAAAE3v/+//wE0wABAAAAAAAAAAAAAAAAAAAAgwQAAAAAAAAAAAAAAAIAAAAEAACpBAAALQQAAFMEAACQBAAACAQAABEEAAB/BAAAGAQAASEESQAPBEkArARJALkESQBSBAAAOwRJAQAEAAAUBEkAzwTeAKYESQAQBEkA9wTeAAcESQBMBEkAWgRJAAoEAACHBAAABQQAAAcESQCOBEkAMQRJADEEAAAOBN4BOwTeACYE3gBPBEkAYQRJAGEEAAAzBAAABAQAAJYEAAAAAlQAVARSAC8EAAAJBAAACwQAAAkEAAACBAD//gQAAAAEAAAPBAAACwQAAA0EAAALBAAACwQAABEEAAA3BAAADQQAAAoEAAAzBAAAMwTeAVIE3gFSBAAADQTeAB0E3gCIBN4AnwTeAQcE3gDaBN4AGATeAI0E3gBEBN4AfQRJAAoESQAOBAABEQQAAAAEAAAGBAAANwQAAAkEAAACBAAADQQAAPoEAADiBAAADwTeAQsE3gF+BN4A5wTeAMIEAAAZBAAAAQQAAIMEAAB4BAAARQQAAE0EAABLBAAAAQQAABEESQAuBEkABwQAAE4ESQC3BEkACwRJAAkESQANBAAARARJAKoESQACBEkAAARJAAUE3gAYBN4AFAQAAAAEUgAvBN0AnQQAAA0EAABGBEwAAgQAABUEAABGBAAAAAQAABkEAAAvBAAAiwQAAL0ESQAqBAAAgwRJAAQEAAANAAAAAAAKABQAHgC0AQYBTAGWAmACxgLsA5gDwASMBcgGKgboB1wHuAhaCJoI4gl8CigMCAz0DdAPWhAqEO4RPBF+EcoSKhLOE7AVBBZqFzYYAhhMGMQZXhtyG9ocDhxUHKwdAh1YHkwevh9+H9wgOCDUIPohRCF+IbQi9CNKI6QkBCRkJKglCiVoJhgm4Cc8J8YoeCjOKWAp2CrCKuIrBCyGLMgteC3OLewuCi4oLkQvGC+qMO4x0DMOM1wzvjRiNPI1cDWoOF440DmiOxA7kDxyPNo90j6MPwA/kEBOQIZBJkHGQoBDxkQORfhG9kdyR7ZINkiySlRK7EtqTJZNGk2STfRPTE9qAAEAAACDAi0AGAAAAAAAAgAAAAAAAAAAAAAAAAAAAAAAAAAOAK4AAQAAAAAAAQAMAAAAAQAAAAAAAgAHAI0AAQAAAAAAAwAMAEUAAQAAAAAABAAMAKIAAQAAAAAABQALACQAAQAAAAAABgAMAGkAAQAAAAAACgAaAMYAAwABBAkAAQAYAAwAAwABBAkAAgAOAJQAAwABBAkAAwAYAFEAAwABBAkABAAYAK4AAwABBAkABQAWAC8AAwABBAkABgAYAHUAAwABBAkACgA0AOBkZXNtb3MtaWNvbnMAZABlAHMAbQBvAHMALQBpAGMAbwBuAHNWZXJzaW9uIDEuMABWAGUAcgBzAGkAbwBuACAAMQAuADBkZXNtb3MtaWNvbnMAZABlAHMAbQBvAHMALQBpAGMAbwBuAHNkZXNtb3MtaWNvbnMAZABlAHMAbQBvAHMALQBpAGMAbwBuAHNSZWd1bGFyAFIAZQBnAHUAbABhAHJkZXNtb3MtaWNvbnMAZABlAHMAbQBvAHMALQBpAGMAbwBuAHNGb250IGdlbmVyYXRlZCBieSBJY29Nb29uLgBGAG8AbgB0ACAAZwBlAG4AZQByAGEAdABlAGQAIABiAHkAIABJAGMAbwBNAG8AbwBuAC4AAAADAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\") format('truetype');\r\n  font-weight: normal;\r\n  font-style: normal;\r\n  font-display: block;\r\n}\r\n\r\n.pillow-icon-clock, .pillow-icon-thumbs-up, .pillow-icon-eraser, .pillow-icon-ferris, .pillow-icon-points, .pillow-icon-sparkline, .pillow-icon-sparktext, .pillow-icon-bumper, .pillow-icon-zipper, .pillow-icon-roller, .pillow-icon-erlenmeyer, .pillow-icon-evaporating, .pillow-icon-tumbler, .pillow-icon-student-glass, .pillow-icon-cupboard, .pillow-icon-caret-up, .pillow-icon-caret-right, .pillow-icon-caret-left, .pillow-icon-caret-down, .pillow-icon-text, .pillow-icon-facebook, .pillow-icon-thumbs-down, .pillow-icon-people, .pillow-icon-guess, .pillow-icon-star, .pillow-icon-zoom, .pillow-icon-drag-corner, .pillow-icon-email, .pillow-icon-info, .pillow-icon-feedback, .pillow-icon-person, .pillow-icon-clipboard, .pillow-icon-target, .pillow-icon-back-arrow, .pillow-icon-check, .pillow-icon-error, .pillow-icon-chevron-left, .pillow-icon-chevron-right, .pillow-icon-show, .pillow-icon-hide, .pillow-icon-pause, .pillow-icon-play, .pillow-icon-plus, .pillow-icon-minus, .pillow-icon-remove, .pillow-icon-redo, .pillow-icon-undo, .pillow-icon-question-sign, .pillow-icon-twitter, .pillow-icon-settings, .pillow-icon-pencil, .pillow-icon-chevron-up, .pillow-icon-chevron-down, .pillow-icon-hamburger, .pillow-icon-line, .pillow-icon-paperclip, .pillow-icon-chef, .pillow-icon-nurse, .pillow-icon-runner, .pillow-icon-reset, .pillow-icon-star-outline, .pillow-icon-lock, .pillow-icon-duplicate, .pillow-icon-image, .pillow-icon-wifi, .pillow-icon-desmos-d, .pillow-icon-new-expression, .pillow-icon-overlay, .pillow-icon-copy-previous, .pillow-icon-anonymize, .pillow-icon-lightbulb, .pillow-icon-sketch, .pillow-icon-bookmark, .pillow-icon-marbleslides, .pillow-icon-labs, .pillow-icon-cardsort, .pillow-icon-share, .pillow-icon-teacher, .pillow-icon-add-media, .pillow-icon-multiple-choice, .pillow-icon-table, .pillow-icon-mobile, .pillow-icon-tablet, .pillow-icon-laptop, .pillow-icon-print, .pillow-icon-book, .pillow-icon-title, .pillow-icon-translation, .pillow-icon-rotation, .pillow-icon-reflection, .pillow-icon-transformation, .pillow-icon-dilation, .pillow-icon-link, .pillow-icon-dot-dot-dot, .pillow-icon-camera, .pillow-icon-open, .pillow-icon-fullscreen-open, .pillow-icon-fullscreen-close, .pillow-icon-geometry, .pillow-icon-paper, .pillow-icon-wrench, .pillow-icon-bw, .pillow-icon-rotate, .pillow-icon-reorder, .pillow-icon-scientific, .pillow-icon-sign-out, .pillow-icon-calculator, .pillow-icon-code, .pillow-icon-checkboxes, .pillow-icon-a-z, .pillow-icon-shuffle,  .pillow-icon-sort-time, .pillow-icon-feedback-bubble, .pillow-icon-sqrt, .pillow-icon-add-teacher, .pillow-icon-world, .pillow-icon-keyboard, .pillow-icon-sink, .pillow-icon-source, .pillow-icon-action-button, .pillow-icon-graph, .pillow-icon-app-graphing, .pillow-icon-audio, .pillow-icon-question, .pillow-icon-wave, .pillow-icon-check-again, .pillow-icon-bullets, .pillow-icon-interpolate, .pillow-icon-stop {\r\n  /* use !important to prevent issues with browser extensions that change fonts */\r\n  font-family: 'desmos-icons' !important;\r\n  speak: never;\r\n  font-style: normal;\r\n  font-weight: normal;\r\n  font-variant: normal;\r\n  text-transform: none;\r\n  line-height: 1;\r\n\r\n  /* Better Font Rendering =========== */\r\n  -webkit-font-smoothing: antialiased;\r\n  -moz-osx-font-smoothing: grayscale;\r\n}\r\n\r\n.pillow-icon-stop:before {\r\n  content: \"\\e97e\";\r\n}\r\n.pillow-icon-interpolate:before {\r\n  content: \"\\e97d\";\r\n}\r\n.pillow-icon-bullets:before {\r\n  content: \"\\e97b\";\r\n}\r\n.pillow-icon-check-again:before {\r\n  content: \"\\e979\";\r\n}\r\n.pillow-icon-wave:before {\r\n  content: \"\\e97c\";\r\n}\r\n.pillow-icon-question:before {\r\n  content: \"\\e97a\";\r\n}\r\n.pillow-icon-audio:before {\r\n  content: \"\\e978\";\r\n}\r\n.pillow-icon-app-graphing:before {\r\n  content: \"\\e976\";\r\n}\r\n.pillow-icon-graph:before {\r\n  content: \"\\e977\";\r\n}\r\n.pillow-icon-sink:before {\r\n  content: \"\\e972\";\r\n}\r\n.pillow-icon-source:before {\r\n  content: \"\\e975\";\r\n}\r\n.pillow-icon-keyboard:before {\r\n  content: \"\\e971\";\r\n}\r\n.pillow-icon-action-button:before {\r\n  content: \"\\e90d\";\r\n}\r\n.pillow-icon-cardsort:before {\r\n  content: \"\\e974\";\r\n}\r\n.pillow-icon-world:before {\r\n  content: \"\\e96e\";\r\n}\r\n.pillow-icon-add-teacher:before {\r\n  content: \"\\e96b\";\r\n}\r\n.pillow-icon-sqrt:before {\r\n  content: \"\\e96a\";\r\n}\r\n.pillow-icon-feedback-bubble:before {\r\n  content: \"\\e967\";\r\n}\r\n.pillow-icon-a-z:before {\r\n  content: \"\\e968\";\r\n}\r\n.pillow-icon-sort-time:before {\r\n  content: \"\\e969\";\r\n}\r\n.pillow-icon-shuffle:before {\r\n  content: \"\\e966\";\r\n}\r\n.pillow-icon-checkboxes:before {\r\n  content: \"\\e965\";\r\n}\r\n.pillow-icon-code:before {\r\n  content: \"\\e964\";\r\n}\r\n.pillow-icon-calculator:before {\r\n  content: \"\\e963\";\r\n}\r\n.pillow-icon-sign-out:before {\r\n  content: \"\\e962\";\r\n}\r\n.pillow-icon-scientific:before {\r\n  content: \"\\e961\";\r\n}\r\n.pillow-icon-reorder:before {\r\n  content: \"\\e960\";\r\n}\r\n.pillow-icon-rotate:before {\r\n  content: \"\\e90f\";\r\n}\r\n.pillow-icon-bw:before {\r\n  content: \"\\e924\";\r\n}\r\n.pillow-icon-paper:before {\r\n  content: \"\\e926\";\r\n}\r\n.pillow-icon-geometry:before {\r\n  content: \"\\e927\";\r\n}\r\n.pillow-icon-fullscreen-open:before {\r\n  content: \"\\e938\";\r\n}\r\n.pillow-icon-fullscreen-close:before {\r\n  content: \"\\e957\";\r\n}\r\n.pillow-icon-open:before {\r\n  content: \"\\e95b\";\r\n}\r\n.pillow-icon-camera:before {\r\n  content: \"\\e95c\";\r\n}\r\n.pillow-icon-dot-dot-dot:before {\r\n  content: \"\\e95d\";\r\n}\r\n.pillow-icon-desmos:before {\r\n  content: \"\\e95e\";\r\n}\r\n.pillow-icon-wrench:before {\r\n  content: \"\\e95f\";\r\n}\r\n.pillow-icon-link:before {\r\n  content: \"\\e95a\";\r\n}\r\n.pillow-icon-dilation:before {\r\n  content: \"\\e901\";\r\n}\r\n.pillow-icon-rotation:before {\r\n  content: \"\\e959\";\r\n}\r\n.pillow-icon-table:before {\r\n  content: \"\\e94c\";\r\n}\r\n.pillow-icon-transformation:before {\r\n  content: \"\\e958\";\r\n}\r\n.pillow-icon-reflection:before {\r\n  content: \"\\e900\";\r\n}\r\n.pillow-icon-translation:before {\r\n  content: \"\\e902\";\r\n}\r\n.pillow-icon-title:before {\r\n  content: \"\\e903\";\r\n}\r\n.pillow-icon-book:before {\r\n  content: \"\\e904\";\r\n}\r\n.pillow-icon-print:before {\r\n  content: \"\\e905\";\r\n}\r\n.pillow-icon-tablet:before {\r\n  content: \"\\e906\";\r\n}\r\n.pillow-icon-laptop:before {\r\n  content: \"\\e907\";\r\n}\r\n.pillow-icon-mobile:before {\r\n  content: \"\\e908\";\r\n}\r\n.pillow-icon-multiple-choice:before {\r\n  content: \"\\e909\";\r\n}\r\n.pillow-icon-add-media:before {\r\n  content: \"\\e90a\";\r\n}\r\n.pillow-icon-teacher:before {\r\n  content: \"\\e90b\";\r\n}\r\n.pillow-icon-marbleslides:before {\r\n  content: \"\\e90c\";\r\n}\r\n.pillow-icon-labs:before {\r\n  content: \"\\e90e\";\r\n}\r\n.pillow-icon-bookmark:before {\r\n  content: \"\\e910\";\r\n}\r\n.pillow-icon-email:before {\r\n  content: \"\\e911\";\r\n}\r\n.pillow-icon-sketch:before {\r\n  content: \"\\e912\";\r\n}\r\n.pillow-icon-lightbulb:before {\r\n  content: \"\\e913\";\r\n}\r\n.pillow-icon-cupboard:before {\r\n  content: \"\\e914\";\r\n}\r\n.pillow-icon-anonymize:before {\r\n  content: \"\\e915\";\r\n}\r\n.pillow-icon-copy-previous:before {\r\n  content: \"\\e916\";\r\n}\r\n.pillow-icon-overlay:before {\r\n  content: \"\\e917\";\r\n}\r\n.pillow-icon-desmos-d:before {\r\n  content: \"\\e918\";\r\n}\r\n.pillow-icon-wifi:before {\r\n  content: \"\\e919\";\r\n}\r\n.pillow-icon-duplicate:before {\r\n  content: \"\\e91a\";\r\n}\r\n.pillow-icon-lock:before {\r\n  content: \"\\e91b\";\r\n}\r\n.pillow-icon-star:before {\r\n  content: \"\\e91c\";\r\n}\r\n.pillow-icon-star-outline:before {\r\n  content: \"\\e91d\";\r\n}\r\n.pillow-icon-reset:before {\r\n  content: \"\\e91e\";\r\n}\r\n.pillow-icon-nurse:before {\r\n  content: \"\\e91f\";\r\n}\r\n.pillow-icon-chef:before {\r\n  content: \"\\e920\";\r\n}\r\n.pillow-icon-runner:before {\r\n  content: \"\\e921\";\r\n}\r\n.pillow-icon-thumbs-down:before {\r\n  content: \"\\e922\";\r\n}\r\n.pillow-icon-thumbs-up:before {\r\n  content: \"\\e923\";\r\n}\r\n.pillow-icon-clock:before {\r\n  content: \"\\e925\";\r\n}\r\n.pillow-icon-paperclip:before {\r\n  content: \"\\e928\";\r\n}\r\n.pillow-icon-line:before {\r\n  content: \"\\e929\";\r\n}\r\n.pillow-icon-hamburger:before {\r\n  content: \"\\e92a\";\r\n}\r\n.pillow-icon-chevron-down:before {\r\n  content: \"\\e92b\";\r\n}\r\n.pillow-icon-chevron-up:before {\r\n  content: \"\\e92c\";\r\n}\r\n.pillow-icon-pencil:before {\r\n  content: \"\\e92d\";\r\n}\r\n.pillow-icon-settings:before {\r\n  content: \"\\e92e\";\r\n}\r\n.pillow-icon-twitter:before {\r\n  content: \"\\e92f\";\r\n}\r\n.pillow-icon-question-sign:before {\r\n  content: \"\\e930\";\r\n}\r\n.pillow-icon-undo:before {\r\n  content: \"\\e931\";\r\n}\r\n.pillow-icon-redo:before {\r\n  content: \"\\e932\";\r\n}\r\n.pillow-icon-remove:before {\r\n  content: \"\\e933\";\r\n}\r\n.pillow-icon-minus:before {\r\n  content: \"\\e934\";\r\n}\r\n.pillow-icon-plus:before {\r\n  content: \"\\e935\";\r\n}\r\n.pillow-icon-play:before {\r\n  content: \"\\e936\";\r\n}\r\n.pillow-icon-pause:before {\r\n  content: \"\\e937\";\r\n}\r\n.pillow-icon-hide:before {\r\n  content: \"\\e939\";\r\n}\r\n.pillow-icon-show:before {\r\n  content: \"\\e93a\";\r\n}\r\n.pillow-icon-chevron-right:before {\r\n  content: \"\\e93b\";\r\n}\r\n.pillow-icon-chevron-left:before {\r\n  content: \"\\e93c\";\r\n}\r\n.pillow-icon-error:before {\r\n  content: \"\\e93d\";\r\n}\r\n.pillow-icon-check:before {\r\n  content: \"\\e93e\";\r\n}\r\n.pillow-icon-back-arrow:before {\r\n  content: \"\\e93f\";\r\n}\r\n.pillow-icon-target:before {\r\n  content: \"\\e940\";\r\n}\r\n.pillow-icon-clipboard:before {\r\n  content: \"\\e941\";\r\n}\r\n.pillow-icon-person:before {\r\n  content: \"\\e942\";\r\n}\r\n.pillow-icon-feedback:before {\r\n  content: \"\\e943\";\r\n}\r\n.pillow-icon-info:before {\r\n  content: \"\\e944\";\r\n}\r\n.pillow-icon-drag-corner:before {\r\n  content: \"\\e945\";\r\n}\r\n.pillow-icon-zoom:before {\r\n  content: \"\\e946\";\r\n}\r\n.pillow-icon-guess:before {\r\n  content: \"\\e947\";\r\n}\r\n.pillow-icon-people:before {\r\n  content: \"\\e948\";\r\n}\r\n.pillow-icon-facebook:before {\r\n  content: \"\\e949\";\r\n}\r\n.pillow-icon-image:before {\r\n  content: \"\\e94a\";\r\n}\r\n.pillow-icon-new-expression:before {\r\n  content: \"\\e94b\";\r\n}\r\n.pillow-icon-share:before {\r\n  content: \"\\e94d\";\r\n}\r\n.pillow-icon-text:before {\r\n  content: \"\\e94e\";\r\n}\r\n.pillow-icon-caret-down:before {\r\n  content: \"\\e94f\";\r\n}\r\n.pillow-icon-caret-left:before {\r\n  content: \"\\e950\";\r\n}\r\n.pillow-icon-caret-right:before {\r\n  content: \"\\e951\";\r\n}\r\n.pillow-icon-caret-up:before {\r\n  content: \"\\e952\";\r\n}\r\n.pillow-icon-student-glass:before {\r\n  content: \"\\e953\";\r\n}\r\n.pillow-icon-tumbler:before {\r\n  content: \"\\e954\";\r\n}\r\n.pillow-icon-evaporating:before {\r\n  content: \"\\e955\";\r\n}\r\n.pillow-icon-erlenmeyer:before {\r\n  content: \"\\e956\";\r\n}\r\n.pillow-icon-sparktext:before {\r\n  content: \"\\e96c\";\r\n}\r\n.pillow-icon-sparkline:before {\r\n  content: \"\\e96d\";\r\n}\r\n.pillow-icon-points:before {\r\n  content: \"\\e96f\";\r\n}\r\n.pillow-icon-ferris:before {\r\n  content: \"\\e970\";\r\n}\r\n.pillow-icon-eraser:before {\r\n  content: \"\\e973\";\r\n}\r\n")
},

// src/index.ts @1
1: function(__fusereq, exports, module){
exports.__esModule = true;
var basic_setup_1 = __fusereq(4);
var lint_1 = __fusereq(5);
var miniCL_1 = __fusereq(6);
var stream_parser_1 = __fusereq(7);
var parseResults_1 = __fusereq(8);
var devTools_1 = __fusereq(9);
__fusereq(10);
__fusereq(12);
let miniCLEditor = new basic_setup_1.EditorView({
  state: basic_setup_1.EditorState.create({
    extensions: [basic_setup_1.basicSetup, stream_parser_1.StreamLanguage.define(miniCL_1.miniCL), parseResults_1.parseResults, lint_1.linter(miniCL_1.miniCLLinter())]
  }),
  dispatch: updateOutput,
  parent: document.querySelector("#miniCL-editor")
});
function updateOutput(tr) {
  miniCLEditor.update([tr]);
  devTools_1.updateDevTools(tr);
}

}
})
//# sourceMappingURL=app.js.map