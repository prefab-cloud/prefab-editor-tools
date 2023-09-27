import { MethodLocation, MethodType } from "../types";

import {
  Diagnostic,
  DiagnosticSeverity,
  DocumentDiagnosticReportKind,
  FullDocumentDiagnosticReport,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import { SDK } from "../sdks/detection";

const onDocumentDiagnostic = async ({
  document,
  filterForMissingKeys,
  sdk,
}: {
  document: TextDocument;
  filterForMissingKeys: (
    methods: MethodLocation[]
  ) => Promise<MethodLocation[]>;
  sdk: SDK;
}) => {
  const missingKeyMethods = await filterForMissingKeys(
    sdk.detectMethods(document)
  );

  const diagnostics: FullDocumentDiagnosticReport = {
    kind: DocumentDiagnosticReportKind.Full,
    items: missingKeyMethods.map((method) => {
      const diagnostic: Diagnostic = {
        severity:
          method.type === MethodType.GET
            ? DiagnosticSeverity.Error
            : DiagnosticSeverity.Warning,
        range: {
          start: method.keyRange.start,
          end: method.keyRange.end,
        },
        message:
          method.type === MethodType.GET
            ? `\`${method.key}\` is not defined.`
            : `\`${method.key}\` is not a defined feature flag. This will always return false.`,
      };

      return diagnostic;
    }),
  };

  return diagnostics;
};

export default onDocumentDiagnostic;
