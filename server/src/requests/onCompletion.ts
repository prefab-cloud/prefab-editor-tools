import { CompletionItemKind, HoverParams } from "vscode-languageserver/node";
import type { ConfigTypeValue } from "../prefabClient";
import type { Documents } from "../types";
import { getMethodFromContext } from "../prefabMethodDetector";

const onCompletion = ({
  documents,
  getSettings,
  prefabConfigNamesOfType,
}: {
  documents: Documents;
  getSettings: () => Promise<void>;
  prefabConfigNamesOfType: (type: ConfigTypeValue) => Promise<string[]>;
}) => {
  return async (params: HoverParams) => {
    await getSettings();

    const document = documents.get(params.textDocument.uri);

    if (!document) {
      return null;
    }

    const configTypeValue: ConfigTypeValue | null = getMethodFromContext(
      document,
      params.position
    );

    if (!configTypeValue) {
      return null;
    }

    const configKeys = await prefabConfigNamesOfType(configTypeValue);

    return configKeys.map((flagName) => {
      return {
        label: flagName,
        kind: CompletionItemKind.Constant,
        data: flagName,
      };
    });
  };
};

export default onCompletion;
