import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import onCompletion from "./requests/onCompletion";
import { detectSDK, SDK } from "./sdks/detection";
import { getActiveDiagnostics, runAllDiagnostics } from "./diagnostics";

import { commands, commandLookup } from "./commands";
import { runAllCodeLens } from "./codeLens";

import { debounceHeadTail } from "./utils/debounce";

import {
  settings,
  getSettings as rawGetSettings,
  updateSettings,
} from "./settings";

import { prefabPromise, keysForCompletionType } from "./prefabClient";

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
  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      codeLensProvider: {
        resolveProvider: false,
      },
      completionProvider: {
        triggerCharacters: ["'", '"'],
      },
      executeCommandProvider: { commands },
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

const getDocumentAndSDK = async (
  uriOrDocument: string | TextDocument
): Promise<DocumentWithSDK> => {
  const isReady = await ready();

  const document =
    typeof uriOrDocument === "string"
      ? documents.get(uriOrDocument)
      : uriOrDocument;

  if (document && isReady) {
    return { document, sdk: detectSDK(document) };
  } else {
    throw new Error(
      `Could not find the document for ${JSON.stringify(
        uriOrDocument
      )} provided.`
    );
  }
};

connection.onExecuteCommand(async (params) => {
  if (!params.arguments || params.arguments.length < 1) {
    throw new Error("Prefab: executeCommand does not support arguments");
  }

  if (!params.arguments[0].startsWith("file://")) {
    throw new Error(
      "Prefab: executeCommand expects the first argument to be a document uri."
    );
  }

  const documentWithSDK = await getDocumentAndSDK(params.arguments[0]);

  commandLookup[params.command].execute({
    ...(documentWithSDK ?? {}),
    params,
    connection,
    settings,
    log,
  });

  return null;
});

connection.onCompletion(async (params) => {
  const documentWithSDK = await getDocumentAndSDK(params.textDocument.uri);

  return onCompletion({
    ...documentWithSDK,
    params,
    keysForCompletionType,
    log,
  });
});

connection.onCodeLens(async (params) => {
  const documentWithSDK = await getDocumentAndSDK(params.textDocument.uri);

  return runAllCodeLens({
    log,
    getActiveDiagnostics,
    ...documentWithSDK,
  });
});

const diagnosticDebounces: Record<string, () => void> = {};

const DEBOUNCE_TIME = 1000;

documents.onDidChangeContent(async (change) => {
  if (!diagnosticDebounces[change.document.uri]) {
    const documentWithSDK = await getDocumentAndSDK(change.document);

    diagnosticDebounces[change.document.uri] = debounceHeadTail(async () => {
      const { diagnostics, changed } = await runAllDiagnostics({
        log,
        ...documentWithSDK,
      });

      connection.sendDiagnostics({
        uri: change.document.uri,
        diagnostics,
      });

      if (changed) {
        connection.sendRequest("workspace/codeLens/refresh");
      }
    }, DEBOUNCE_TIME);
  }

  diagnosticDebounces[change.document.uri]();
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
