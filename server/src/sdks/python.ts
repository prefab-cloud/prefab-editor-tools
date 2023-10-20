import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionType,
  CompletionTypeValue,
  MethodType,
  MethodTypeValue,
  MethodLocation,
} from "../types";
import type { SDK } from "./detection";
import {
  detectMethod,
  detectMethods,
  type DetectMethodsRegex,
  type DetectMethodRegex,
} from "./common";

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /(?:prefab|client)\.enabled\(?\s*["']([^'\n]+?)\s*["']\s*\)?/gs,
  GET: /(?:prefab|client)\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /(?:prefab|client)\.enabled\(?\s*["']$/,
  GET: /(?:prefab|client)\.get\(?\s*["']$/,
};

const PythonSDK: SDK = {
  name: "python",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "python";
  },

  detectMethod: (
    document: TextDocument,
    position: Position
  ): MethodTypeValue | null => {
    return detectMethod(document, position, DETECT_METHOD_REGEXES);
  },

  detectMethods: (document): MethodLocation[] => {
    return detectMethods(document, METHOD_REGEXES);
  },

  completionType: (
    document: TextDocument,
    position: Position
  ): CompletionTypeValue | null => {
    switch (PythonSDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },

  configGet: (key: string): string => {
    return `prefab.get("${key}")`;
  },
};

export default PythonSDK;
