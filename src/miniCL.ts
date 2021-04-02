import {StreamParser, StringStream} from "@codemirror/stream-parser"
import {Diagnostic} from "@codemirror/lint"
import {EditorView} from "@codemirror/view"
import {State, getDefaultToken} from './lexer'
import {ParseError} from './position'
import {typecheck} from './typechecker';
import {mudCheck} from './mudChecker';
import {parseResults} from './parseResults';

/**
 * The extension for our language
 */
export const miniCL: StreamParser<State> = {
  startState: function (): State {
    return {line: 1, stack: ['default']};
  },
  token: function (stream: StringStream, state: State): string | undefined {
    if (stream.eatSpace()) return null;
    return token2tag(getDefaultToken(stream, state));
  }
};

/**
 * The linter for our language
 */
 export const miniCLLinter = () => (view: EditorView): Diagnostic[] => {

  // Get the result types
  const results = view.state.field(parseResults);

  let dependsMap: {[key: string]: string[]} = {};
  // Error checking
  const mudErrors = mudCheck(results.nodes, results.registeredNodes, dependsMap);
  const typeErrors = typecheck(results.nodes, results.registeredNodes);

  // Create a diagnostic for each kind of error
  const parseDiagnostics = results.parseErrors.map(makeDiagnostic(view));
  const typeDiagnostics = typeErrors.map(makeDiagnostic(view));
  const mudDiagnostics = mudErrors.map(makeDiagnostic(view, 'warning'));

  return parseDiagnostics.concat(typeDiagnostics).concat(mudDiagnostics);
}

/**
 * Create a diagnostic from an error
 */
const makeDiagnostic = (view: EditorView, severity: 'error' | 'info' | 'warning' = 'error') => 
  (error): Diagnostic => {
    return {
      from: firstLine(view, error) + error.position.first_column,
      to: lastLine(view, error) + error.position.last_column,
      message: error.message,
      severity: severity
    }
}

/**
 * @returns the line number for the start of the error
 */
function firstLine(view: EditorView, error: ParseError) {
  return view.state.doc.line(error.position.first_line).from;
}

/**
 * @returns the line number for the end of the error
 */
function lastLine (view: EditorView, error: ParseError) {
  return view.state.doc.line(error.position.last_line).from;    
}

/**
 * Convert our bespoke parser Token type to a token type that is recognized by CodeMirror
 */
function token2tag(token: string): string | undefined {
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
