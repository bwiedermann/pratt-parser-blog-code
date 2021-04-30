import {Transaction} from "@codemirror/state"
import {json, jsonParseLinter} from "@codemirror/lang-json"
import {foldAll} from "@codemirror/fold"
import { visualize } from "./visualization"
import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {linter} from "@codemirror/lint"
import { parseResults } from "./parseResults"
import {typecheck} from './typechecker';
import {mudCheck} from './mudChecker';
import * as AnalyzedTree from './analyzedTree';

/**
 * Given a transaction, update the developer tools
 */
 export function updateDevTools(tr: Transaction) {
  const results = tr.state.field(parseResults)

  // Maybe this should be factored out, this is repeating computation
  let dependsMap: {[key: string]: string[]} = {};
  let registeredNodes: {[key: string]: AnalyzedTree.AnalyzedNode} = {}
  // Error checking
  const {errors: typeErrors, aTree: analyzedNodes} = typecheck(results.nodes, registeredNodes);
  
  const mudErrors = mudCheck(analyzedNodes, registeredNodes, dependsMap);

  // Display JSON for AST
  const astJSON = JSON.stringify(results.nodes, null, 2)
  replaceContents(astViewer, astJSON);

  // Display JSON for aTree
  const aTreeJSON = JSON.stringify(analyzedNodes, null, 2)
  replaceContents(aTreeViewer, aTreeJSON);

  // Draw the AST
  visualize(analyzedNodes);
}

// Configuration for a read-only JSON viewer with folding, line numbers, etc.
function newJSONViewerState(): EditorState {
  return EditorState.create({
    extensions: [
      basicSetup,
      json(),
      linter(jsonParseLinter()),
      EditorView.editable.of(false),
    ],
  })
}

// JSON viewer for AST
let astViewer = new EditorView({
  state: newJSONViewerState(),
  parent: document.querySelector("#ast-json"),
});

// JSON viewer for aTree
let aTreeViewer = new EditorView({
  state: newJSONViewerState(),
  parent: document.querySelector("#aTree-json"),
});


/**
 * Replace the entire contents of an editor
 */
function replaceContents(editor: EditorView, contents: string) {
  const update = editor.state.update({
    changes: {
      from: 0,
      to: editor.state.doc.length,
      insert: contents
    }
  });
  editor.update([update]);
  foldAll(editor);  // By default, fold all levels
}
