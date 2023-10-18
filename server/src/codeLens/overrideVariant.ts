import { allKeys, overrides } from "../prefab";
import { CodeLensAnalyzer, CodeLensAnalyzerArgs, MethodType } from "../types";

const overrideVariant: CodeLensAnalyzer = async ({
  document,
  log,
}: CodeLensAnalyzerArgs) => {
  log("CodeLens", { overrideVariant: document.uri });

  const flagKeys = await allKeys();

  const methods = document.methodLocations.filter((method) => {
    return (
      method.type === MethodType.IS_ENABLED && flagKeys.includes(method.key)
    );
  });

  log("CodeLens", { overrideVariant: methods });

  return methods.map((method) => {
    const { range } = method;

    const override = overrides[method.key];

    return {
      range,
      command: {
        title: override
          ? `${method.key}: change/remove override`
          : `${method.key}: override variant`,
        command: "prefab.overrideVariant",
        arguments: [document.uri, method.key],
      },
    };
  });
};

export default overrideVariant;
