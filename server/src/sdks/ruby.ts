import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionType,
  CompletionTypeValue,
  MethodType,
  MethodTypeValue,
} from "../prefabClient";
import { type SDK } from "./detection";
import { currentLine } from "../documentHelpers";

const RubySDK: SDK = {
  name: "ruby",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "ruby";
  },

  detectMethod: (
    document: TextDocument,
    position: Position
  ): MethodTypeValue | null => {
    const line = currentLine(document, position);

    if (!line) {
      return null;
    }

    if (/prefab\.enabled\?\(["']$/.test(line)) {
      return MethodType.IS_ENABLED;
    }

    if (/prefab\.get\(["']$/.test(line)) {
      return MethodType.GET;
    }

    return null;
  },

  completionType: (
    document: TextDocument,
    position: Position
  ): CompletionTypeValue | null => {
    switch (RubySDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },
};

export default RubySDK;
