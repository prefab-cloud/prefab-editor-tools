import { Position, TextDocument } from "vscode-languageserver-textdocument";
import { CompletionTypeValue, MethodLocation, MethodTypeValue } from "../types";
import JavaSDK from "./java";
import JavascriptSDK from "./javascript";
import NodeSDK from "./node";
import ReactSDK from "./react";
import RubySDK from "./ruby";

type SDK_NAMES = "ruby" | "javascript" | "react" | "node" | "java";

const SDKs: SDK[] = [RubySDK, NodeSDK, JavascriptSDK, ReactSDK, JavaSDK];

export type SDK = {
  name: SDK_NAMES | "no-applicable-sdk";
  isApplicable: (document: TextDocument) => boolean;
  detectMethod: (
    document: TextDocument,
    position: Position
  ) => MethodTypeValue | null;
  detectMethods: (document: TextDocument) => MethodLocation[];
  completionType: (
    document: TextDocument,
    position: Position
  ) => CompletionTypeValue | null;
};

export const NullSDK: SDK = {
  name: "no-applicable-sdk",
  isApplicable: () => true,
  detectMethod: () => null,
  completionType: () => null,
  detectMethods: () => [],
};

export const detectSDK = (document: TextDocument): SDK => {
  return SDKs.find((sdk) => sdk.isApplicable(document)) || NullSDK;
};
