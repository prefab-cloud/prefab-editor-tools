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
  prefixAt,
} from "./common";
import type { SDK } from "./detection";

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /(?:prefab|client)\.enabled\(?\s*["']([^'\n]+?)\s*["']\s*\)?/gs,
  GET: /(?:prefab|client)\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /(?:prefab|client)\.enabled\(?\s*["']([^)"']*)$/,
  GET: /(?:prefab|client)\.get\(?\s*["']([^)"']*)$/,
};

const PythonSDK: SDK = {
  name: "python",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "python";
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
    const methodType = PythonSDK.detectMethod(document, position);
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
    return `prefab.get("${key}")`;
  },

  detectProvidable: () => undefined,
};

export default PythonSDK;
