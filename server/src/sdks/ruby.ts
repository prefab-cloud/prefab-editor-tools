import { Position, TextDocument } from "vscode-languageserver-textdocument";

import {
  CompletionType,
  CompletionTypeValue,
  MethodLocation,
  MethodType,
  MethodTypeValue,
} from "../types";
import {
  detectMethod,
  type DetectMethodRegex,
  detectMethods,
  type DetectMethodsRegex,
  detectProvidable,
} from "./common";
import type { SDK } from "./detection";

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /prefab\.enabled\?\(?\s*["']([^'\n]+?)\s*["']\s*\)?/gs,
  GET: /prefab\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /prefab\.enabled\?\(?\s*["']$/,
  GET: /prefab\.get\(?\s*["']$/,
};

const DETECT_PROVIDABLE_REGEX = /ENV\[(["'].+["'])\]/g;

const RubySDK: SDK = {
  name: "ruby",

  isApplicable: (document: TextDocument): boolean => {
    return (
      document.languageId === "ruby" ||
      document.languageId === "eruby" ||
      document.languageId === "erb" ||
      document.uri.endsWith(".erb")
    );
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

  configGet: (key: string): string => {
    return `$prefab.get("${key}")`;
  },

  detectProvidable: (document: TextDocument, position: Position) => {
    return detectProvidable(document, position, DETECT_PROVIDABLE_REGEX);
  },
};

export default RubySDK;
