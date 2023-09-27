import { CompletionItemKind, HoverParams } from "vscode-languageserver/node";
import type { CompletionTypeValue } from "../prefabClient";
import type { Documents } from "../types";
import { detectSDK } from "../sdks/detection";
import { Prefab } from "../prefabClient";

const onCompletion = ({
  documents,
  getSettings,
  keysForCompletionType,
  prefab,
}: {
  documents: Documents;
  getSettings: () => Promise<void>;
  keysForCompletionType: (
    type: CompletionTypeValue | null
  ) => Promise<string[]>;
  prefab: Prefab;
}) => {
  return async (params: HoverParams) => {
    await getSettings();

    if (!prefab) {
      return null;
    }

    const document = documents.get(params.textDocument.uri);

    if (!document) {
      return null;
    }

    const sdk = detectSDK(document);

    const configKeys = await keysForCompletionType(
      sdk.completionType(document, params.position)
    );

    return configKeys.map((name) => {
      return {
        label: name,
        kind: CompletionItemKind.Constant,
        data: name,
      };
    });
  };
};

export default onCompletion;
