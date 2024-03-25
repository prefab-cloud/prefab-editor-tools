import { CompletionItemKind } from "vscode-languageserver/node";

import { keysForCompletionType } from "../prefab";
import type { CompletionAnalyzerArgs } from "../types";

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

  const completionTypeWithPrefix = document.completionTypeWithPrefix(position);

  log("Completion", { completionTypeWithPrefix });

  if (!completionTypeWithPrefix) {
    return [];
  }

  const configKeys = (
    await (providedKeysForCompletionType ?? keysForCompletionType)(
      completionTypeWithPrefix.completionType,
    )
  ).filter((key) => key.startsWith(completionTypeWithPrefix.prefix));

  log("Completion", { configKeys });

  return configKeys.map((name) => {
    return {
      label: name,
      kind: CompletionItemKind.Constant,
      data: name,
      insertText: name.replace(completionTypeWithPrefix.prefix, ""),
    };
  });
};

export default onCompletion;
