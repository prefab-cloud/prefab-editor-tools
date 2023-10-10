import {
  CodeLens,
  CompletionItem,
  Connection,
  Diagnostic,
  ExecuteCommandParams,
  Hover,
  InlayHint,
  LSPAny,
  Range,
  TextDocuments,
} from "vscode-languageserver/node";

import { Position, TextDocument } from "vscode-languageserver-textdocument";

import { filterForMissingKeys as defaultFilterForMissingKeys } from "./prefabClient";

export type LogScope =
  | "ApiClient"
  | "CodeLens"
  | "Command"
  | "Completion"
  | "Diagnostic"
  | "Hover"
  | "InlayHint"
  | "Lifecycle"
  | "PrefabClient"
  | "Settings"
  | "Utility";

export type Logger = (scope: LogScope, message: unknown) => void;

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

export type MethodTypeKeys = keyof typeof MethodType;

export type MethodTypeValue = (typeof MethodType)[keyof typeof MethodType];

export interface Settings {
  apiKey?: string;
  apiUrl?: string;
}

export type ExecutableCommandExecuteArgs = {
  connection: Connection;
  document: AnnotatedDocument;
  params: ExecuteCommandParams;
  settings: Settings;
  log: Logger;
  refresh: () => Promise<void>;
};

export type ExecutableCommand = {
  command: string;

  execute: ({
    connection,
    document,
    params,
    settings,
    log,
    refresh,
  }: ExecutableCommandExecuteArgs) => Promise<LSPAny>;
};

// We always want to require source
export type DiagnosticWithSource = Diagnostic & {
  source: string;
};

export const DiagnosticDataKind = {
  missingKey: "missingKey",
};

export type DiagnosticAnalyzerArgs = {
  document: AnnotatedDocument;
  log: Logger;
  exclude?: string[];
  filterForMissingKeys?: typeof defaultFilterForMissingKeys;
};

export type DiagnosticAnalyzer = (
  args: DiagnosticAnalyzerArgs
) => Promise<DiagnosticWithSource[]>;

export type CodeLensAnalyzerArgs = {
  document: AnnotatedDocument;
  log: Logger;
  getActiveDiagnostics: (uri: string) => DiagnosticWithSource[];
};

export type CodeLensAnalyzer = (
  args: CodeLensAnalyzerArgs
) => Promise<CodeLens[]>;

export type InlayHintAnalyzerArgs = {
  document: AnnotatedDocument;
  log: Logger;
};

export type InlayHintAnalyzer = (
  args: InlayHintAnalyzerArgs
) => Promise<InlayHint[]>;

export type CompletionAnalyzerArgs = {
  document: AnnotatedDocument;
  position: Position;
  log: Logger;
};

export type CompletionAnalyzer = (
  args: CompletionAnalyzerArgs
) => Promise<CompletionItem[]>;

export type HoverAnalyzerArgs = {
  document: AnnotatedDocument;
  position: Position;
  log: Logger;
  settings: Settings;
};

export type HoverAnalyzer = (args: HoverAnalyzerArgs) => Promise<Hover | null>;

export type DocumentAnnotations = {
  methodLocations: MethodLocation[];
};

export type AnnotatedDocument = {
  uri: string;
  completionType: (position: Position) => CompletionTypeValue | null;
  methodLocations: MethodLocation[];
};
