import { allKeys } from "../prefab";
import {
  CodeLensAnalyzer,
  CodeLensAnalyzerArgs,
  CustomHandler,
  MethodType,
} from "../types";
import { ensureSupportsCustomHandlers } from "../ui/ensureSupportsCustomHandlers";

const requiredCustomHandlers = [CustomHandler.pickOption];

const toggleFlag: CodeLensAnalyzer = async ({
  clientContext,
  document,
  log,
  settings,
}: CodeLensAnalyzerArgs) => {
  log("CodeLens", { toggleFlag: document.uri });

  if (!settings.alpha) {
    return [];
  }

  if (
    !ensureSupportsCustomHandlers(requiredCustomHandlers, clientContext, log)
  ) {
    return [];
  }

  const flagKeys = await allKeys();

  const methods = document.methodLocations.filter((method) => {
    return (
      method.type === MethodType.IS_ENABLED && flagKeys.includes(method.key)
    );
  });

  log("CodeLens", { toggleFlag: methods });

  return methods.map((method) => {
    const { range } = method;

    return {
      range,
      command: {
        title: `${method.key}: toggle`,
        command: "prefab.toggleFlag",
        arguments: [document.uri, method.key],
      },
    };
  });
};

export default toggleFlag;
