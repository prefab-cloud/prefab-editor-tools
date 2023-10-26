import { allKeys, prefab } from "../prefab";
import {
  CodeLensAnalyzer,
  CodeLensAnalyzerArgs,
  ConfigType,
  CustomHandler,
  MethodType,
} from "../types";
import { ensureSupportsCustomHandlers } from "../ui/ensureSupportsCustomHandlers";

const requiredCustomHandlers = [
  CustomHandler.getInput,
  CustomHandler.pickOption,
];

const editConfig: CodeLensAnalyzer = async ({
  clientContext,
  document,
  log,
}: CodeLensAnalyzerArgs) => {
  log("CodeLens", { editConfig: document.uri });

  if (
    !ensureSupportsCustomHandlers(requiredCustomHandlers, clientContext, log)
  ) {
    return [];
  }

  const configKeys = await allKeys();

  const methods = document.methodLocations.filter((method) => {
    return (
      method.type === MethodType.GET &&
      configKeys.includes(method.key) &&
      prefab.raw(method.key)?.configType === ConfigType.CONFIG
    );
  });

  log("CodeLens", { editConfig: methods });

  return methods.map((method) => {
    const { range } = method;

    return {
      range,
      command: {
        title: `${method.key}: edit`,
        command: "prefab.editConfig",
        arguments: [document.uri, method.key],
      },
    };
  });
};

export default editConfig;
