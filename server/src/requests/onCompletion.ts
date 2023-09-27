import { log, logj } from "../log";

import {
  CompletionItemKind,
  CompletionParams,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import type { CompletionTypeValue } from "../types";
import { SDK } from "../sdks/detection";

const onCompletion = async ({
  document,
  params,
  keysForCompletionType,
  sdk,
}: {
  document: TextDocument;
  keysForCompletionType: (
    type: CompletionTypeValue | null
  ) => Promise<string[]>;
  sdk: SDK;
  params: CompletionParams;
}) => {
  logj({ params });
  logj({ sdk });
  const completionType = sdk.completionType(document, params.position);
  logj({ completionType });

  const configKeys = await keysForCompletionType(completionType);

  return configKeys.map((name) => {
    return {
      label: name,
      kind: CompletionItemKind.Constant,
      data: name,
    };
  });
};

export default onCompletion;
