import { CodeActionKind } from "vscode-languageserver/node";

import {
  type CodeActionAnalyzer,
  type CodeActionAnalyzerArgs,
  CustomHandler,
} from "../types";

const requiredCustomHandlers = [
  CustomHandler.getInput,
  CustomHandler.pickOption,
];
import { ensureSupportsCustomHandlers } from "../ui/ensureSupportsCustomHandlers";

const extractProvided: CodeActionAnalyzer = async (
  args: CodeActionAnalyzerArgs
) => {
  const { clientContext, document, params, log, settings } = args;

  log("CodeActions", { extractProvided: document.uri });

  if (!settings.alpha) {
    return [];
  }

  if (!clientContext.capabilities.workspace?.applyEdit) {
    log("CodeActions", "Client does not support workspace/applyEdit");
    return [];
  }

  if (
    !ensureSupportsCustomHandlers(requiredCustomHandlers, clientContext, log)
  ) {
    return [];
  }

  const providableAtCursor = document.sdk.detectProvidable(
    document.textDocument,
    params.range.start
  );

  if (!providableAtCursor) {
    return [];
  }

  const copy = document.textDocument.getText(providableAtCursor.range);

  return [
    {
      title: `Wrap with Prefab provided: ${copy}`,
      kind: CodeActionKind.RefactorExtract,
      command: {
        title: `Extract to Prefab provided: ${copy}`,
        command: "prefab.extractProvided",
        arguments: [document.uri, providableAtCursor, { confidential: false }],
      },
    },
    {
      title: `Wrap with confidential Prefab provided: ${copy}`,
      kind: CodeActionKind.RefactorExtract,
      command: {
        title: `Extract to Prefab provided: ${copy}`,
        command: "prefab.extractProvided",
        arguments: [document.uri, providableAtCursor, { confidential: true }],
      },
    },
  ];
};

export default extractProvided;
