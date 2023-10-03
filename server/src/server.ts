import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
  DocumentDiagnosticRequest,
  DocumentDiagnosticParams,
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

const log: Logger = (message) => {
  if (typeof message === "string") {
    connection.console.info(message);
  } else {
    connection.console.info(JSON.stringify(message));
  }
};

let refreshDiagnostics = async () => {};
let canRefreshCodeLens = false;

let refresh = async () => {
  await refreshDiagnostics();
};

const getSettings = async () => await rawGetSettings(connection, log, refresh);

connection.onInitialize((params) => {
  log({ onInitialize: params });

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

  canRefreshCodeLens =
    params.capabilities.workspace?.codeLens?.refreshSupport ?? false;

  log(`onInitialize returning ${JSON.stringify(result)}`);

  return result;
});

connection.onDidChangeConfiguration((change) => {
  updateSettings(connection, change.settings.prefab, log, refresh);
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
    refreshDiagnostics,
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

connection.onRequest(
  DocumentDiagnosticRequest.method,
  async (params: DocumentDiagnosticParams) => {
    log({ [DocumentDiagnosticRequest.method]: params });
    const documentWithSDK = await getDocumentAndSDK(params.textDocument.uri);

    const { diagnostics } = await runAllDiagnostics({
      log,
      ...documentWithSDK,
    });

    return { items: diagnostics };
  }
);

const diagnosticDebounces: Record<string, () => void> = {};

const DEBOUNCE_TIME = 1000;

const debouncedRefreshDiagnostics = async (uri: string) => {
  if (!diagnosticDebounces[uri]) {
    const documentWithSDK = await getDocumentAndSDK(uri);

    diagnosticDebounces[uri] = debounceHeadTail(async () => {
      const { diagnostics, changed } = await runAllDiagnostics({
        log,
        ...documentWithSDK,
      });

      connection.sendDiagnostics({
        uri,
        diagnostics,
      });

      if (changed && canRefreshCodeLens) {
        connection.sendRequest("workspace/codeLens/refresh");
      }
    }, DEBOUNCE_TIME);
  }

  diagnosticDebounces[uri]();
};

documents.onDidChangeContent(async (change) => {
  debouncedRefreshDiagnostics(change.document.uri);
});

refreshDiagnostics = async () => {
  log("Refreshing diagnostics");

  documents.all().forEach(async (doc) => {
    debouncedRefreshDiagnostics(doc.uri);
  });
};

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
