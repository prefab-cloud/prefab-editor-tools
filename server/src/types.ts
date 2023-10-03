import {
  CodeLens,
  Connection,
  Diagnostic,
  ExecuteCommandParams,
  Range,
  TextDocuments,
  LSPAny,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

import { filterForMissingKeys as defaultFilterForMissingKeys } from "./prefabClient";

import { SDK } from "./sdks/detection";

export type Logger = (message: string | object | undefined | null) => void;

export type Documents = TextDocuments<TextDocument>;

export type MethodLocation = {
  type: MethodTypeValue;
  range: Range;
  key: string;
  keyRange: Range;
};

export const CompletionType = {
  CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS:
    "CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS",
  BOOLEAN_FEATURE_FLAGS: "BOOLEAN_FEATURE_FLAGS",
  NON_BOOLEAN_FEATURE_FLAGS: "NON_BOOLEAN_FEATURE_FLAGS",
};

export type CompletionTypeValue =
  (typeof CompletionType)[keyof typeof CompletionType];

export const ConfigType = {
  CONFIG: 1,
  FEATURE_FLAG: 2,
};

export type ConfigTypeValue = (typeof ConfigType)[keyof typeof ConfigType];

export const MethodType = {
  GET: "GET",
  IS_ENABLED: "IS_ENABLED",
};

export type MethodTypeValue = (typeof MethodType)[keyof typeof MethodType];

export interface Settings {
  apiKey?: string;
  apiUrl?: string;
}

export type ExecutableCommandExecuteArgs = {
  connection: Connection;
  document: TextDocument;
  sdk: SDK;
  params: ExecuteCommandParams;
  settings: Settings;
  log: Logger;
  refreshDiagnostics: () => Promise<void>;
};

export type ExecutableCommand = {
  command: string;

  execute: ({
    connection,
    document,
    sdk,
    params,
    settings,
    log,
    refreshDiagnostics,
  }: ExecutableCommandExecuteArgs) => Promise<LSPAny>;
};

export const DiagnosticDataKind = {
  missingKey: "missingKey",
};

export type DiagnosticAnalyzerArgs = {
  document: TextDocument;
  sdk: SDK;
  log: Logger;
  exclude?: string[];
  filterForMissingKeys?: typeof defaultFilterForMissingKeys;
};

export type DiagnosticAnalyzer = (
  args: DiagnosticAnalyzerArgs
) => Promise<Diagnostic[]>;

export type CodeLensAnalyzerArgs = {
  document: TextDocument;
  sdk: SDK;
  log: Logger;
  getActiveDiagnostics: (uri: string) => Diagnostic[];
};

export type CodeLensAnalyzer = (
  args: CodeLensAnalyzerArgs
) => Promise<CodeLens[]>;
