import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionType,
  CompletionTypeValue,
  MethodType,
  MethodTypeValue,
  MethodLocation,
} from "../types";
import { type SDK } from "./detection";
import { currentLine } from "../documentHelpers";

export const RELEVANT_FILETYPES = ["javascript", "typescript"];

const DOCUMENT_METHOD_REGEX =
  /document\.(getElementById|querySelector|querySelectorAll)/;

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
      doesNotLookLikeBrowserJS(document)
    );
  },

  detectMethod: (
    document: TextDocument,
    position: Position
  ): MethodTypeValue | null => {
    const line = currentLine(document, position);

    if (!line) {
      return null;
    }

    const text = document.getText();

    if (!text.includes("@prefab-cloud/prefab-cloud-node")) {
      return null;
    }

    if (/prefab\.isFeatureEnabled\(["`']$/.test(line)) {
      return MethodType.IS_ENABLED;
    }

    if (/prefab\.get\(["`']$/.test(line)) {
      return MethodType.GET;
    }

    return null;
  },

  detectMethods: (document): MethodLocation[] => {
    // TODO:
    return [];
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
};

export default JavascriptSDK;
