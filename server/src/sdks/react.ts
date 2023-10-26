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
} from "./common";
import { type SDK } from "./detection";

export const RELEVANT_FILETYPES = ["javascriptreact", "typescriptreact"];

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /isEnabled\(["`']$/,
  GET: /get\(["`']$/,
};

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /isEnabled\(\s*["']([^'\n]+?)\s*["']\s*\)/gs,
  GET: /get\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const ReactSDK: SDK = {
  name: "react",

  isApplicable: (document: TextDocument) => {
    return RELEVANT_FILETYPES.includes(document.languageId);
  },

  detectMethod: (
    document: TextDocument,
    position: Position
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
    position: Position
  ): CompletionTypeValue | null => {
    switch (ReactSDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },

  configGet: (key: string) => {
    return `get("${key}")`;
  },

  detectProvidable: () => undefined,
};

export default ReactSDK;
