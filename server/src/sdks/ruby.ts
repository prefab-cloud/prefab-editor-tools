import { Position, TextDocument } from "vscode-languageserver-textdocument";

import {
  CompletionType,
  CompletionTypeWithPrefix,
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
  prefixAt,
} from "./common";
import type { SDK } from "./detection";

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /[pP]refab\.enabled\?\(?\s*["']([^'\n]+?)\s*["']\s*\)?/gs,
  GET: /[pP]refab\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /[pP]refab\.enabled\?\(?\s*["']([^)"']*)$/,
  GET: /[pP]refab\.get\(?\s*["']([^)"']*)$/,
};

const DETECT_PROVIDABLE_REGEX = /ENV\[(["'].+["'])\]/g;

const RubySDK: SDK = {
  name: "ruby",

  isApplicable: (document: TextDocument): boolean => {
    return (
      document.languageId === "ruby" ||
      document.languageId === "eruby" ||
      document.languageId === "erb" ||
      document.languageId === "yaml" ||
      document.uri.endsWith(".erb")
    );
  },

  detectMethod: (
    document: TextDocument,
    position: Position,
  ): MethodTypeValue | null => {
    return detectMethod(document, position, DETECT_METHOD_REGEXES);
  },

  detectMethods: (document): MethodLocation[] => {
    return detectMethods(document, METHOD_REGEXES);
  },

  completionType: (
    document: TextDocument,
    position: Position,
  ): CompletionTypeWithPrefix | null => {
    const methodType = RubySDK.detectMethod(document, position);

    if (methodType === null) {
      return null;
    }

    return {
      completionType:
        methodType === MethodType.IS_ENABLED
          ? CompletionType.BOOLEAN_FEATURE_FLAGS
          : CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS,
      prefix: prefixAt(document, position, DETECT_METHOD_REGEXES[methodType]),
    };
  },

  configGet: (key: string): string => {
    return `$prefab.get("${key}")`;
  },

  detectProvidable: (document: TextDocument, position: Position) => {
    return detectProvidable(document, position, DETECT_PROVIDABLE_REGEX);
  },
};

export default RubySDK;
