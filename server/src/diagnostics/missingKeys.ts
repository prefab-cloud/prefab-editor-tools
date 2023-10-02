import {
  DiagnosticDataKind,
  DiagnosticAnalyzer,
  Logger,
  MethodType,
} from "../types";
import { filterForMissingKeys as defaultFilterForMissingKeys } from "../prefabClient";

import { Diagnostic, DiagnosticSeverity } from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import { SDK } from "../sdks/detection";

const missingKeys: DiagnosticAnalyzer = async ({
  document,
  filterForMissingKeys,
  sdk,
  log,
  exclude,
}: {
  document: TextDocument;
  filterForMissingKeys?: typeof defaultFilterForMissingKeys;
  sdk: SDK;
  log: Logger;
  exclude?: string[];
}) => {
  const missingKeyMethods = await (
    filterForMissingKeys ?? defaultFilterForMissingKeys
  )(sdk.detectMethods(document), log);

  const filteredMissingKeyMethods = missingKeyMethods.filter((method) => {
    if (exclude?.includes(method.key)) {
      return false;
    }

    return true;
  });

  log({ filteredMissingKeyMethods });

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
