import {
  CodeLensAnalyzer,
  CodeLensAnalyzerArgs,
  DiagnosticDataKind,
  MethodType,
} from "../types";

const createFlag: CodeLensAnalyzer = async ({
  document,
  getActiveDiagnostics,
  log,
}: CodeLensAnalyzerArgs) => {
  log("CodeLens", { createFlag: document.uri });

  const relevantDiagnostics = getActiveDiagnostics(document.uri).filter(
    ({ data }) => {
      return (
        data.kind === DiagnosticDataKind.missingKey &&
        data.type === MethodType.IS_ENABLED
      );
    }
  );

  log("CodeLens", { relevantDiagnostics });

  return relevantDiagnostics.map((diagnostic) => {
    const { range } = diagnostic;

    return {
      range,
      command: {
        title: `Create ${diagnostic.data.key} flag`,
        command: "prefab.createFlag",
        arguments: [document.uri, diagnostic.data.key],
      },
    };
  });
};

export default createFlag;
