import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  TextDocumentSyncKind,
  InitializeResult,
  InlayHintRequest,
  DocumentDiagnosticRequest,
  DocumentDiagnosticParams,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import { getActiveDiagnostics, runAllDiagnostics } from "./diagnostics";

import { commands, commandLookup } from "./commands";
import { runAllCodeLens } from "./codeLens";
import { runAllHovers } from "./hovers";
import { runAllInlayHints } from "./inlayHints";
import { runAllCompletions } from "./completions";

import { getSettings, settings, updateSettings } from "./settings";

import { prefabPromise } from "./prefabClient";

import type { Logger } from "./types";

import {
  annotateDocument as annotateDoc,
  getAnnotatedDocument as getAnnotatedDoc,
} from "./documentAnnotations";

// Create a connection for the server, using Node's IPC as a
// transport (overridden with `--stdio` flag).
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

const log: Logger = (scope, message) => {
  let stringMessage: string;

  if (typeof message === "string") {
    stringMessage = message;
  } else {
    if (message instanceof Map) {
      stringMessage = JSON.stringify(Object.fromEntries(message));
    } else {
      stringMessage = JSON.stringify(message);
    }
  }

  connection.console.info(`[${scope}]: ${stringMessage}`);
};

let canRefreshCodeLens = false;
let canRefreshInlayHints = false;

connection.onInitialize((params) => {
  log("Lifecycle", { onInitialize: params });

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
      hoverProvider: true,
    },
  };

  if (params.capabilities.textDocument?.inlayHint) {
    result.capabilities.inlayHintProvider = true;

    if (params.capabilities.workspace?.inlayHint?.refreshSupport) {
      canRefreshInlayHints = true;
    }
  }

  canRefreshCodeLens =
    params.capabilities.workspace?.codeLens?.refreshSupport ?? false;

  log("Lifecycle", `onInitialize returning ${JSON.stringify(result)}`);

  return result;
});

connection.onDidChangeConfiguration((change) => {
  updateSettings(connection, change.settings.prefab, log, refresh);
});

const ready = async () => {
  await getSettings(connection, log, refresh);

  await prefabPromise;
};

const getDocument = (
  uriOrDocument: string | TextDocument
): TextDocument | undefined => {
  return typeof uriOrDocument === "string"
    ? documents.get(uriOrDocument)
    : uriOrDocument;
};

const getAnnotatedDocument = (uriOrDocument: string | TextDocument) => {
  const document = getDocument(uriOrDocument);

  if (!document) {
    return undefined;
  }

  return getAnnotatedDoc(document);
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

  const document = getAnnotatedDocument(params.arguments[0]);

  if (!document) {
    log(
      "Lifecycle",
      `executeCommand: document not found ${params.arguments[0]}`
    );
    return null;
  }

  commandLookup[params.command].execute({
    document,
    params,
    connection,
    settings,
    log,
    refresh,
  });

  return null;
});

connection.onCompletion(async (params) => {
  const document = getAnnotatedDocument(params.textDocument.uri);

  if (!document) {
    log(
      "Lifecycle",
      `onCompletion: document not found ${params.textDocument.uri}`
    );
    return null;
  }

  return runAllCompletions({
    document,
    position: params.position,
    log,
  });
});

connection.onCodeLens(async (params) => {
  const document = getAnnotatedDocument(params.textDocument.uri);

  if (!document) {
    log(
      "Lifecycle",
      `onCodeLens: document not found ${params.textDocument.uri}`
    );
    return null;
  }

  return runAllCodeLens({
    log,
    getActiveDiagnostics,
    document,
  });
});

connection.onRequest(
  DocumentDiagnosticRequest.method,
  async (params: DocumentDiagnosticParams) => {
    const document = getAnnotatedDocument(params.textDocument.uri);

    if (!document) {
      log(
        "Lifecycle",
        `DocumentDiagnosticRequest: document not found ${params.textDocument.uri}`
      );
      return null;
    }

    const { diagnostics } = await runAllDiagnostics({ log, document });

    return { items: diagnostics };
  }
);

connection.onHover(async (params) => {
  await ready();

  const document = getAnnotatedDocument(params.textDocument.uri);

  if (!document) {
    log("Lifecycle", `onHover: document not found ${params.textDocument.uri}`);

    return null;
  }

  const hover = await runAllHovers({
    settings,
    document,
    position: params.position,
    log,
  });

  return hover;
});

connection.onRequest(InlayHintRequest.method, async (params) => {
  const document = getAnnotatedDocument(params.textDocument.uri);

  if (!document) {
    log(
      "Lifecycle",
      `InlayHintRequest: document not found ${params.textdocument.uri}`
    );
    return null;
  }

  const inlayHints = await runAllInlayHints({ log, document });

  return inlayHints;
});

const update = async (uri: string) => {
  const document = getAnnotatedDocument(uri);

  if (!document) {
    log("Lifecycle", `debouncedUpdate: document not found ${uri}`);
    return null;
  }

  const { diagnostics, changed } = await runAllDiagnostics({
    log,
    document,
  });

  connection.sendDiagnostics({
    uri,
    diagnostics,
  });

  if (changed && canRefreshCodeLens) {
    connection.sendRequest("workspace/codeLens/refresh");
  }

  // This isn't happening at the right time
  if (canRefreshInlayHints) {
    connection.sendRequest("workspace/inlayHint/refresh");
  }
};

const annotateDocument = (document: TextDocument | undefined) => {
  if (!document) {
    return;
  }

  annotateDoc(document);
};

documents.onDidOpen(async (change) => {
  await ready();

  annotateDocument(getDocument(change.document));

  update(change.document.uri);
});

documents.onDidChangeContent(async (change) => {
  await ready();

  annotateDocument(getDocument(change.document));

  update(change.document.uri);
});

const refresh = async () => {
  log("Lifecycle", "Refreshing");

  documents.all().forEach(async (doc) => {
    annotateDocument(getDocument(doc));
    update(doc.uri);
  });
};

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
