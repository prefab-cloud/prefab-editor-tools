import { Range, TextDocuments } from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";

export type Documents = TextDocuments<TextDocument>;

export type MethodLocation = {
  type: MethodTypeValue;
  range: Range;
  key: string;
  keyRange: Range;
};

export const CompletionType = {
  CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS: 1,
  BOOLEAN_FEATURE_FLAGS: 2,
  NON_BOOLEAN_FEATURE_FLAGS: 3,
};

export type CompletionTypeValue =
  (typeof CompletionType)[keyof typeof CompletionType];

export const ConfigType = {
  CONFIG: 1,
  FEATURE_FLAG: 2,
};

export type ConfigTypeValue = (typeof ConfigType)[keyof typeof ConfigType];

export const MethodType = {
  GET: 1,
  IS_ENABLED: 2,
};

export type MethodTypeValue = (typeof MethodType)[keyof typeof MethodType];
