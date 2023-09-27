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

export const RELEVANT_FILETYPES = ["javascriptreact", "typescriptreact"];

const ReactSDK: SDK = {
  name: "react",

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

    const text = document.getText();

    if (!text.includes("usePrefab(")) {
      return null;
    }

    if (/isEnabled\(["`']$/.test(line)) {
      return MethodType.IS_ENABLED;
    }

    if (/get\(["`']$/.test(line)) {
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
    switch (ReactSDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },
};

export default ReactSDK;
