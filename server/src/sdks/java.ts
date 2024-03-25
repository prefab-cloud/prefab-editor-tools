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

// TODO: The `.get` regex is going to be most likely to collide with something non-Prefab. We could improve this by looking backwards for something config-like.

const METHOD_REGEXES: DetectMethodsRegex = {
  IS_ENABLED: /\.featureIsOn\(\s*["']([^'\n]+?)["']\)?\s*/gs,
  GET: /\.(?:get|liveString|liveStringList|liveBoolean|liveLong|liveDouble)\(?\s*["']([^'\n]+?)["']\)?\s*/gs,
};

const DETECT_METHOD_REGEXES: DetectMethodRegex = {
  IS_ENABLED: /\.featureIsOn\(["']([^)"']*)$/,
  GET: /\.(?:get|liveString|liveStringList|liveBoolean|liveLong|liveDouble)\(["']([^)"']*)$/,
};

const JavaSDK: SDK = {
  name: "java",

  isApplicable: (document: TextDocument): boolean => {
    return document.languageId === "java";
  },

  detectMethod: (
    document: TextDocument,
    position: Position,
  ): MethodTypeValue | null => {
    return detectMethod(document, position, DETECT_METHOD_REGEXES);
  },

  detectMethods: (document): MethodLocation[] => {
    return detectMethods(document, METHOD_REGEXES);
  },

  completionType: (
    document: TextDocument,
    position: Position,
  ): CompletionTypeWithPrefix | null => {
    const methodType = JavaSDK.detectMethod(document, position);
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

  configGet: (key: string): string => {
    return `configClient.liveString("${key}").get()`;
  },

  detectProvidable: () => undefined,
};

export default JavaSDK;
