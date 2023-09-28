import {
  createConnection,
  DiagnosticOptions,
  DocumentDiagnosticParams,
  DocumentDiagnosticRequest,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import onCompletion from "./requests/onCompletion";
import onDocumentDiagnostic from "./requests/documentDiagnostic";
import { detectSDK, SDK } from "./sdks/detection";

import { getSettings as rawGetSettings, updateSettings } from "./settings";

import {
  prefabPromise,
  filterForMissingKeys,
  keysForCompletionType,
} from "./prefabClient";

import { type Logger } from "./types";

// Create a connection for the server, using Node's IPC as a
// transport (overridden with `--stdio` flag).
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const log: Logger = (message: string | object) => {
  if (typeof message === "string") {
    connection.console.info(message);
  } else {
    connection.console.info(JSON.stringify(message));
  }
};

const getSettings = async () => await rawGetSettings(connection, log);

connection.onInitialize(() => {
  const diagnosticProvider: DiagnosticOptions = {
    identifier: "Prefab",
    interFileDependencies: false,
    workspaceDiagnostics: false,
  };

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: ["'", '"'],
      },
      diagnosticProvider,
    },
  };

  log(`onInitialize returning ${JSON.stringify(result)}`);

  return result;
});

connection.onDidChangeConfiguration((change) => {
  updateSettings(connection, change.settings.prefab, log);
});

const ready = async () => {
  await getSettings();

  if (!prefabPromise) {
    return false;
  }

  await prefabPromise;
  return true;
};

type DocumentWithSDK = {
  document: TextDocument;
  sdk: SDK;
};

const getDocumentAndSDK = async (params: {
  textDocument: { uri: string };
}): Promise<DocumentWithSDK | null> => {
  const isReady = await ready();

  const document = documents.get(params.textDocument.uri);

  if (document && isReady) {
    return { document, sdk: detectSDK(document) };
  } else {
    return null;
  }
};

connection.onCompletion(async (params) => {
  const documentWithSDK = await getDocumentAndSDK(params);

  if (!documentWithSDK) {
    return null;
  }

  return onCompletion({
    ...documentWithSDK,
    params,
    keysForCompletionType,
    log,
  });
});

connection.onRequest(
  DocumentDiagnosticRequest.method,
  async (params: DocumentDiagnosticParams) => {
    const documentWithSDK = await getDocumentAndSDK(params);

    if (!documentWithSDK) {
      return null;
    }

    return onDocumentDiagnostic({
      ...documentWithSDK,
      filterForMissingKeys,
      log,
    });
  }
);

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
