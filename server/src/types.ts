import {
  ClientCapabilities,
  CodeAction,
  CodeActionParams,
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

import { filterForMissingKeys as defaultFilterForMissingKeys } from "./prefab";
import { SDK } from "./sdks/detection";

export const CustomHandler = {
  getInput: "$/prefab.getInput",
  pickOption: "$/prefab.pickOption",
};

export type CustomHandlerValue =
  (typeof CustomHandler)[keyof typeof CustomHandler];

export type GetInputResponse = {
  input: string;
  params: ExecuteCommandParams;
};

export type LogScope =
  | "ApiClient"
  | "CodeLens"
  | "CodeActions"
  | "Command"
  | "Completion"
  | "Diagnostic"
  | "Hover"
  | "InlayHint"
  | "Lifecycle"
  | "Notification"
  | "PrefabClient"
  | "Settings"
  | "Utility"
  | "UI";

export interface Logger {
  (
    scope: LogScope,
    message: unknown,
    severity?: "info" | "error" | "warn"
  ): void;
  error: (scope: LogScope, message: unknown) => void;
  warn: (scope: LogScope, message: unknown) => void;
}

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
  alpha?: boolean;
}

export type ExecutableCommandExecuteArgs = {
  clientContext: ClientContext;
  connection: Connection;
  document: AnnotatedDocument;
  log: Logger;
  params: ExecuteCommandParams;
  refresh: () => Promise<void>;
  settings: Settings;
};

export type ExecutableCommand<T extends ExecutableCommandExecuteArgs> = {
  command: string;

  execute: ({
    connection,
    document,
    params,
    settings,
    log,
    refresh,
  }: T) => Promise<LSPAny>;
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
  clientContext: ClientContext;
  document: AnnotatedDocument;
  log: Logger;
  settings: Settings;
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
  filterForMissingKeys?: typeof defaultFilterForMissingKeys;
  clientContext: ClientContext;
};

export type HoverAnalyzer = (args: HoverAnalyzerArgs) => Promise<Hover | null>;

export type DocumentAnnotations = {
  methodLocations: MethodLocation[];
};

export type AnnotatedDocument = {
  uri: string;
  textDocument: TextDocument;
  completionType: (position: Position) => CompletionTypeValue | null;
  methodLocations: MethodLocation[];
  sdk: SDK;
};

export type CodeActionAnalyzer = (
  args: CodeActionAnalyzerArgs
) => Promise<CodeAction[]>;

export type CodeActionAnalyzerArgs = {
  clientContext: ClientContext;
  document: AnnotatedDocument;
  params: CodeActionParams;
  log: Logger;
};

export type ClientContext = {
  capabilities: ClientCapabilities;
  customHandlers: CustomHandlerValue[];
  editorIdentifier: "vscode" | string;
};

export type UnRetryableError = {
  retryable: false;
  message: string;
};

export type RetryableError = {
  retryable: true;
  message: string;
};

export type RetryError = UnRetryableError | RetryableError;

const createError = <T extends RetryError>(
  retryableValue: T["retryable"],
  message: string
): T => {
  return {
    retryable: retryableValue,
    message,
  } as T;
};

export const unretryableError = (message: string): UnRetryableError =>
  createError(false, message);
export const retryableError = (message: string): RetryableError =>
  createError(true, message);

const isErrorOfType = (
  error: unknown,
  retryable: boolean
): error is RetryError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "retryable" in error &&
    error.retryable === retryable
  );
};

export const isUnretryableError = (error: unknown): error is UnRetryableError =>
  isErrorOfType(error, false);

export const isRetryableError = (error: unknown): error is RetryableError =>
  isErrorOfType(error, true);
