import {StateField} from "@codemirror/state"
import {Transaction} from "@codemirror/state"
import * as AST from './ast';
import {parse} from './parser';
import {ParseError} from './position';

/**
 * A State field that holds the results of parsing
 */
export const parseResults: StateField<ParseResults> = StateField.define({
  create() { return emptyParseResults },
  update(value, tr) { return tr.docChanged ? parseProgram(tr) : value }
})

/**
 * Parse the program created from a transaction, returning a ParseResults object
 */
function parseProgram(tr: Transaction) : ParseResults {
  const contents = tr.state.doc.toString()

  let varMap: {[key: string]: string} = {}
  const ast = parse(contents, varMap)

  return {
    nodes: ast.nodes,
    parseErrors: ast.errors,
    varMap: varMap
  }
}

/**
 * Type that describes the results of parsing
 */
export type ParseResults = {
  nodes: AST.Node[];
  parseErrors: ParseError[];
  varMap: {[key: string]: string};
}

/**
 * Can be used as the initial results of parsing
 */
const emptyParseResults: ParseResults = {
  nodes: [],
  parseErrors: [],
  varMap: {}
}
