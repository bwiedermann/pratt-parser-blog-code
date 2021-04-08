import {EditorState, EditorView, basicSetup} from "@codemirror/basic-setup"
import {Transaction} from "@codemirror/state"
import {linter} from "@codemirror/lint"
import {miniCL, miniCLLinter} from "./miniCL"
import {StreamLanguage} from "@codemirror/stream-parser"
import {parseResults} from "./parseResults"
import {updateDevTools} from "./devTools"
import "./styles.css"
import "./desmos_icons.css"

// Create the CodeMirror miniCL editor and add it to the document.
let miniCLEditor = new EditorView({
  state: EditorState.create({
    extensions: [
      basicSetup,                     // https://codemirror.net/6/docs/ref/#basic-setup
      StreamLanguage.define(miniCL),  // syntax coloring for miniCL
      parseResults,                   // field that holds the results of parsing
      linter(miniCLLinter())          // error-checking for miniCL
    ],
  }),
  dispatch: updateOutput,
  parent: document.querySelector("#miniCL-editor") as Element
})

// When the content changes, update the editor and the dev tools
function updateOutput(tr: Transaction) {
  miniCLEditor.update([tr]);
  updateDevTools(tr);
}
