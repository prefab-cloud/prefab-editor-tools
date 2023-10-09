import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionType,
  CompletionTypeValue,
  MethodType,
  MethodTypeValue,
  MethodLocation,
} from "../types";
import { type SDK } from "./detection";
import {
  detectMethod,
  detectMethods,
  type DetectMethodsRegex,
  type DetectMethodRegex,
} from "./common";

export const RELEVANT_FILETYPES = ["javascript", "typescript"];

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /prefab\.isEnabled\(["`']$/,
  GET: /prefab\.get\(["`']$/,
};

const ENABLED_REGEX = /prefab\.isEnabled\(\s*["']([^'\n]+?)\s*["']\s*\)/gs;
const GET_REGEX = /prefab\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs;

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: [ENABLED_REGEX, 17],
  GET: [GET_REGEX, 12],
};

const JavascriptSDK: SDK = {
  name: "javascript",

  // NOTE: this looks naive but we're assuming the node SDK detection happens first and this is a fall-through
  isApplicable: (document: TextDocument) => {
    return RELEVANT_FILETYPES.includes(document.languageId);
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
    switch (JavascriptSDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },
};

export default JavascriptSDK;
