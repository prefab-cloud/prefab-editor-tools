import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import onCompletion from "./requests/onCompletion";

import { getSettings as rawGetSettings, updateSettings } from "./settings";
import { prefabConfigNamesOfType } from "./prefabClient";

// Create a connection for the server, using Node's IPC as a
// transport (overridden with `--stdio` flag).
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const getSettings = async () => await rawGetSettings(connection);

connection.onInitialize(() => {
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ["'", '"'],
      },
    },
  };

  return result;
});

connection.onDidChangeConfiguration((change) => {
  updateSettings(change.settings.prefab);
});

connection.onCompletion(
  onCompletion({ documents, getSettings, prefabConfigNamesOfType })
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
