import {
  DiagnosticDataKind,
  DiagnosticAnalyzer,
  DiagnosticAnalyzerArgs,
  MethodType,
} from "../types";
import { filterForMissingKeys as defaultFilterForMissingKeys } from "../prefabClient";

import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node";

const missingKeys: DiagnosticAnalyzer = async ({
  document,
  filterForMissingKeys,
  log,
  exclude,
}: DiagnosticAnalyzerArgs) => {
  const missingKeyMethods = await (
    filterForMissingKeys ?? defaultFilterForMissingKeys
  )(document.methodLocations);

  const filteredMissingKeyMethods = missingKeyMethods.filter((method) => {
    if (exclude?.includes(method.key)) {
      return false;
    }

    return true;
  });

  log("Diagnostic", { filteredMissingKeyMethods });

  const diagnostics: Diagnostic[] = filteredMissingKeyMethods.map((method) => {
    const diagnostic: Diagnostic = {
      severity:
        method.type === MethodType.GET
          ? DiagnosticSeverity.Error
          : DiagnosticSeverity.Warning,
      range: {
        start: method.keyRange.start,
        end: method.keyRange.end,
      },
      data: {
        kind: DiagnosticDataKind.missingKey,
        key: method.key,
        type: method.type,
      },
      message:
        method.type === MethodType.GET
          ? `\`${method.key}\` is not defined.`
          : `\`${method.key}\` is not defined. This will always return false.`,
    };

    return diagnostic;
  });

  return diagnostics;
};

export default missingKeys;
