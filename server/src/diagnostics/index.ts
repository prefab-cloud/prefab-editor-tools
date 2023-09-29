import { Diagnostic } from "vscode-languageserver/node";
import { DiagnosticAnalyzerArgs } from "../types";

import missingKeys from "./missingKeys";

let activeDiagnostics: Record<string, Diagnostic[]> = {};

export const diagnostics = [missingKeys];

type Result = {
  diagnostics: Diagnostic[];
  changed: boolean;
};

export const runAllDiagnostics = async (
  args: DiagnosticAnalyzerArgs
): Promise<Result> => {
  const allDiagnostics = await Promise.all(
    diagnostics.map((diagnostic) => diagnostic(args))
  );

  const flatDiagnostics = allDiagnostics.flat();

  const diagnosticsWas = activeDiagnostics[args.document.uri] || [];

  activeDiagnostics[args.document.uri] = flatDiagnostics;

  return {
    diagnostics: flatDiagnostics,
    changed: JSON.stringify(diagnosticsWas) !== JSON.stringify(flatDiagnostics),
  };
};

export const getActiveDiagnostics = (uri: string): Diagnostic[] => {
  return activeDiagnostics[uri] || [];
};
