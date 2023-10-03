import { CodeLensAnalyzer, CodeLensAnalyzerArgs, MethodType } from "../types";

import { allKeys, getOverride, prefabUserId } from "../prefabClient";

const overrideVariant: CodeLensAnalyzer = async ({
  document,
  log,
  sdk,
}: CodeLensAnalyzerArgs) => {
  log({ "codeLens overrideVariant": { document } });

  const flagKeys = await allKeys();

  const methods = sdk.detectMethods(document).filter((method) => {
    return (
      method.type === MethodType.IS_ENABLED && flagKeys.includes(method.key)
    );
  });

  const userId = await prefabUserId();

  return methods.map((method) => {
    const { range } = method;

    const override = getOverride(method.key, userId);

    return {
      range,
      command: {
        title: override ? "Change/remove override" : "Override variant",
        command: "prefab.overrideVariant",
        arguments: [document.uri, method.key],
      },
    };
  });
};

export default overrideVariant;
