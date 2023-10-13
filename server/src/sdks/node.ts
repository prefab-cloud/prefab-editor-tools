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

const IMPORT_STATEMENT = "@prefab-cloud/prefab-cloud-node";

export const RELEVANT_FILETYPES = ["javascript", "typescript"];

const DOCUMENT_METHOD_REGEX =
  /document\.(getElementById|querySelector|querySelectorAll)/;

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /prefab\.isFeatureEnabled\(["`']$/,
  GET: /prefab\.get\(["`']$/,
};

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /prefab\.isFeatureEnabled\(\s*["']([^'\n]+?)\s*["']\s*\)/gs,
  GET: /prefab\.get\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

// Note: this is naive
export const doesNotLookLikeBrowserJS = (document: TextDocument): boolean => {
  const text = document.getText();

  if (DOCUMENT_METHOD_REGEX.test(text)) {
    return false;
  }

  return true;
};

const JavascriptSDK: SDK = {
  name: "node",

  isApplicable: (document: TextDocument) => {
    return (
      RELEVANT_FILETYPES.includes(document.languageId) &&
      (document.getText().includes(IMPORT_STATEMENT) ||
        doesNotLookLikeBrowserJS(document))
    );
  },

  detectMethod: (
    document: TextDocument,
    position: Position
  ): MethodTypeValue | null => {
    const text = document.getText();

    if (!text.includes(IMPORT_STATEMENT)) {
      return null;
    }

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
        return CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },

  configGet: (key: string) => {
    return `prefab.get("${key}")`;
  },
};

export default JavascriptSDK;
