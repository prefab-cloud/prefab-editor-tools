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
import { type SDK } from "./detection";

export const RELEVANT_FILETYPES = ["javascript", "typescript"];

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /prefab\.isEnabled\(["`']([^)"']*)$/,
  GET: /prefab\.get\(["`']([^)"']*)$/,
};

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /prefab\.isEnabled\(\s*["']([^'\n]+?)\s*["']\s*\)/gs,
  GET: /prefab\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const JavascriptSDK: SDK = {
  name: "javascript",

  // NOTE: this looks naive but we're assuming the node SDK detection happens first and this is a fall-through
  isApplicable: (document: TextDocument) => {
    return RELEVANT_FILETYPES.includes(document.languageId);
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
    const methodType = JavascriptSDK.detectMethod(document, position);
    if (methodType === null) {
      return null;
    }

    return {
      completionType:
        methodType === MethodType.IS_ENABLED
          ? CompletionType.BOOLEAN_FEATURE_FLAGS
          : CompletionType.NON_BOOLEAN_FEATURE_FLAGS,
      prefix: prefixAt(document, position, DETECT_METHOD_REGEXES[methodType]),
    };
  },

  configGet: (key: string) => {
    return `prefab.get("${key}")`;
  },

  detectProvidable: () => undefined,
};

export default JavascriptSDK;
