import { Position, TextDocument } from "vscode-languageserver-textdocument";

import {
  CompletionTypeValue,
  KeyLocation,
  MethodLocation,
  MethodTypeValue,
} from "../types";
import JavaSDK from "./java";
import JavascriptSDK from "./javascript";
import NodeSDK from "./node";
import ReactSDK from "./react";
import RubySDK from "./ruby";
import YamlSDK from "./yaml";

type SDK_NAMES =
  | "ruby"
  | "javascript"
  | "react"
  | "node"
  | "java"
  | "python"
  | "yaml";

const SDKs: SDK[] = [
  RubySDK,
  NodeSDK,
  JavascriptSDK,
  ReactSDK,
  JavaSDK,
  YamlSDK,
];

export type SDK = {
  name: SDK_NAMES | "no-applicable-sdk";
  isApplicable: (document: TextDocument) => boolean;
  detectMethod: (
    document: TextDocument,
    position: Position
  ) => MethodTypeValue | null;
  detectMethods: (document: TextDocument) => MethodLocation[];
  detectProvidable: (
    document: TextDocument,
    position: Position
  ) => undefined | KeyLocation;
  completionType: (
    document: TextDocument,
    position: Position
  ) => CompletionTypeValue | null;
  configGet: (key: string) => string;
};

export const NullSDK: SDK = {
  name: "no-applicable-sdk",
  isApplicable: () => true,
  detectMethod: () => null,
  completionType: () => null,
  detectMethods: () => [],
  detectProvidable: () => undefined,
  configGet: () => "",
};

export const detectSDK = (document: TextDocument): SDK => {
  return SDKs.find((sdk) => sdk.isApplicable(document)) || NullSDK;
};
