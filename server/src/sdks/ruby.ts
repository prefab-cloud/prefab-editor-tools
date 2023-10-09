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

const ENABLED_REGEX = /prefab\.enabled\?\(?\s*["']([^'\n]+?)\s*["']\s*\)?/gs;
const GET_REGEX = /prefab\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs;

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: [ENABLED_REGEX, 17],
  GET: [GET_REGEX, 12],
};

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /prefab\.enabled\?\(?\s*["']$/,
  GET: /prefab\.get\(?\s*["']$/,
};

const RubySDK: SDK = {
  name: "ruby",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "ruby";
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
    switch (RubySDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },
};

export default RubySDK;
