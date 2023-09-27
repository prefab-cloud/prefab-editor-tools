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

const JavaSDK: SDK = {
  name: "java",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "java";
  },

  detectMethod: (
    document: TextDocument,
    position: Position
  ): MethodTypeValue | null => {
    const line = currentLine(document, position);

    if (!line) {
      return null;
    }

    if (/\.featureIsOn\(["']$/.test(line)) {
      return MethodType.IS_ENABLED;
    }

    if (/\.get\(["']$/.test(line)) {
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
    switch (JavaSDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },
};

export default JavaSDK;
