import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionType,
  CompletionTypeValue,
  MethodType,
  MethodTypeValue,
} from "../prefabClient";
import { type SDK } from "./detection";
import { currentLine } from "../documentHelpers";

export const RELEVANT_FILETYPES = ["javascript", "typescript"];

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
    const line = currentLine(document, position);

    if (!line) {
      return null;
    }

    if (/prefab\.isEnabled\(["`']$/.test(line)) {
      return MethodType.IS_ENABLED;
    }

    if (/prefab\.get\(["`']$/.test(line)) {
      return MethodType.GET;
    }

    return null;
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
