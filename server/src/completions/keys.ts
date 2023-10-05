import { CompletionItemKind } from "vscode-languageserver/node";

import type { CompletionAnalyzer, CompletionAnalyzerArgs } from "../types";

import { keysForCompletionType } from "../prefabClient";

type Dependencies = {
  providedKeysForCompletionType?: typeof keysForCompletionType;
};

const onCompletion = async ({
  document,
  log,
  position,
  providedKeysForCompletionType,
}: CompletionAnalyzerArgs & Dependencies) => {
  log("Completion", { name: "keys" });

  const completionType = document.completionType(position);

  log("Completion", { completionType });

  const configKeys = await (
    providedKeysForCompletionType ?? keysForCompletionType
  )(completionType);

  log("Completion", { configKeys });

  return configKeys.map((name) => {
    return {
      label: name,
      kind: CompletionItemKind.Constant,
      data: name,
    };
  });
};

export default onCompletion;
