import {
  CodeLensAnalyzer,
  CodeLensAnalyzerArgs,
  CustomHandler,
  DiagnosticDataKind,
  MethodType,
} from "../types";
import { ensureSupportsCustomHandlers } from "../ui/ensureSupportsCustomHandlers";

const requiredCustomHandlers = [
  CustomHandler.getInput,
  CustomHandler.pickOption,
];

const createConfig: CodeLensAnalyzer = async ({
  clientContext,
  document,
  getActiveDiagnostics,
  log,
}: CodeLensAnalyzerArgs) => {
  log("CodeLens", { createConfig: document.uri });

  if (
    !ensureSupportsCustomHandlers(requiredCustomHandlers, clientContext, log)
  ) {
    return [];
  }

  const relevantDiagnostics = getActiveDiagnostics(document.uri).filter(
    ({ data }) => {
      return (
        data.kind === DiagnosticDataKind.missingKey &&
        data.type === MethodType.GET
      );
    },
  );

  log("CodeLens", { relevantDiagnostics });

  return relevantDiagnostics.map((diagnostic) => {
    const { range } = diagnostic;

    return {
      range,
      command: {
        title: `Create config ${diagnostic.data.key}`,
        command: "prefab.createConfig",
        arguments: [document.uri, diagnostic.data.key],
      },
    };
  });
};

export default createConfig;
