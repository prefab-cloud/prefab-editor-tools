import {
  CompletionItemKind,
  CompletionParams,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { CompletionTypeValue } from "../types";
import { SDK } from "../sdks/detection";

const onCompletion = async ({
  document,
  log,
  params,
  keysForCompletionType,
  sdk,
}: {
  document: TextDocument;
  log: (message: string | object) => void;
  keysForCompletionType: (
    type: CompletionTypeValue | null
  ) => Promise<string[]>;
  sdk: SDK;
  params: CompletionParams;
}) => {
  log({ onCompletion: params });

  const completionType = sdk.completionType(document, params.position);

  log({ completionType });

  const configKeys = await keysForCompletionType(completionType);

  log({ configKeys });

  return configKeys.map((name) => {
    return {
      label: name,
      kind: CompletionItemKind.Constant,
      data: name,
    };
  });
};

export default onCompletion;
