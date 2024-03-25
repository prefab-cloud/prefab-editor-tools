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

const IMPORT_STATEMENT = "@prefab-cloud/prefab-cloud-node";

export const RELEVANT_FILETYPES = ["javascript", "typescript"];

const DOCUMENT_METHOD_REGEX =
  /document\.(getElementById|querySelector|querySelectorAll)/;

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /prefab\.isFeatureEnabled\(["`']([^)"`']*)$/,
  GET: /prefab\.get\(["`']([^)"`']*)$/,
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

const NodeSDK: SDK = {
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
    position: Position,
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
    position: Position,
  ): CompletionTypeWithPrefix | null => {
    const methodType = NodeSDK.detectMethod(document, position);

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

  configGet: (key: string) => {
    return `prefab.get("${key}")`;
  },

  detectProvidable: () => undefined,
};

export default NodeSDK;
