import {Transaction} from "@codemirror/state"
import {json, jsonParseLinter} from "@codemirror/lang-json"
import {foldAll} from "@codemirror/fold"
import { visualize } from "./visualization"
import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {linter} from "@codemirror/lint"
import { parseResults } from "./parseResults"

/**
 * Given a transaction, update the developer tools
 */
 export function updateDevTools(tr: Transaction) {
  const results = tr.state.field(parseResults)

  // Display JSON for AST
  const astJSON = JSON.stringify(results.nodes, null, 2)
  replaceContents(astViewer, astJSON);

  // Draw the AST
  visualize(results.nodes);
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
