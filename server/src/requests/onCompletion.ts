import {
  CompletionItemKind,
  CompletionParams,
} from "vscode-languageserver/node";
import type { AnnotatedDocument, CompletionTypeValue, Logger } from "../types";

const onCompletion = async ({
  document,
  log,
  params,
  keysForCompletionType,
}: {
  document: AnnotatedDocument;
  log: Logger;
  keysForCompletionType: (
    type: CompletionTypeValue | null
  ) => Promise<string[]>;
  params: CompletionParams;
}) => {
  log("Completion", { onCompletion: params });

  const completionType = document.completionType(params.position);

  log("Completion", { completionType });

  const configKeys = await keysForCompletionType(completionType);

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
