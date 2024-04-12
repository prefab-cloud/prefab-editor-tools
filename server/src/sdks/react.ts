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

export const RELEVANT_FILETYPES = ["javascriptreact", "typescriptreact"];

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /isEnabled\(["`']([^)"']*)$/,
  GET: /get\(["`']([^)"']*)$/,
};

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /isEnabled\(\s*["']([^'\n]+?)\s*["']\s*\)/gs,
  GET: /(?<!\.)\bget\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const ReactSDK: SDK = {
  name: "react",

  isApplicable: (document: TextDocument) => {
    return RELEVANT_FILETYPES.includes(document.languageId);
  },

  detectMethod: (
    document: TextDocument,
    position: Position,
  ): MethodTypeValue | null => {
    const text = document.getText();

    if (!text.includes("usePrefab(")) {
      return null;
    }

    return detectMethod(document, position, DETECT_METHOD_REGEXES);
  },

  detectMethods: (document): MethodLocation[] => {
    const text = document.getText();

    if (!text.includes("usePrefab(")) {
      return [];
    }

    return detectMethods(document, METHOD_REGEXES);
  },

  completionType: (
    document: TextDocument,
    position: Position,
  ): CompletionTypeWithPrefix | null => {
    const methodType = ReactSDK.detectMethod(document, position);
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
    return `get("${key}")`;
  },

  detectProvidable: () => undefined,
};

export default ReactSDK;
