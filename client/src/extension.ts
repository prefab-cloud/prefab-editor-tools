import * as path from "path";
import { ExtensionContext, window, workspace } from "vscode";
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join("server", "out", "server.js")
  );

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for all documents by default
    documentSelector: [{ scheme: "file", language: "*" }],
    middleware: {},
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher("**/.clientrc"),
    },
    initializationOptions: {
      customHandlers: ["$/prefab.getInput", "$/prefab.pickOption"],
    },
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    "prefab-language-server",
    "Prefab",
    serverOptions,
    clientOptions
  );

  client.onRequest(
    "$/prefab.pickOption",
    async ({ title, options }: { title: string; options: string[] }) => {
      const option = await window.showQuickPick(options, {
        title,
        canPickMany: false,
      });

      return option;
    }
  );

  client.onRequest(
    "$/prefab.getInput",
    async ({
      title,
      defaultValue,
    }: {
      title: string;
      defaultValue: string | undefined;
    }) => {
      const input = await window.showInputBox({
        prompt: title,
        value: defaultValue ?? "",
      });

      return {
        input,
      };
    }
  );

  // Start the client. This will also launch the server
  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
