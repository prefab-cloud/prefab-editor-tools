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

// TODO: The `.get` regex is going to be most likely to collide with something non-Prefab. We could improve this by looking backwards for something config-like.

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /\.featureIsOn\(\s*["']([^'\n]+?)["']\)?\s*/gs,
  GET: /\.(?:get|liveString|liveStringList|liveBoolean|liveLong|liveDouble)\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /\.featureIsOn\(["']$/,
  GET: /\.(?:get|liveString|liveStringList|liveBoolean|liveLong|liveDouble)\(["']$/,
};

const JavaSDK: SDK = {
  name: "java",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "java";
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
    switch (JavaSDK.detectMethod(document, position)) {
      case MethodType.IS_ENABLED:
        return CompletionType.BOOLEAN_FEATURE_FLAGS;
      case MethodType.GET:
        return CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS;
      default:
        return null;
    }
  },

  configGet: (key: string): string => {
    return `configClient.liveString("${key}").get()`;
  },

  detectProvidable: () => undefined,
};

export default JavaSDK;
