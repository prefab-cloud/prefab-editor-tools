import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  CompletionType,
  CompletionTypeValue,
  MethodType,
  MethodTypeValue,
  MethodLocation,
} from "../types";
import type { SDK } from "./detection";
import { currentLine } from "../documentHelpers";

const ENABLED_REGEX = /prefab\.enabled\?\(?\s*["'](.*?)\s*["']\s*\)?/gs;
const GET_REGEX = /prefab\.get\(?\s*["'](.*?)["']\)?\s*/gs;

const METHOD_REGEXES: Record<string, [RegExp, number]> = {
  [MethodType.IS_ENABLED]: [ENABLED_REGEX, 17],
  [MethodType.GET]: [GET_REGEX, 12],
};

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

    if (/prefab\.enabled\?\(?\s*["']$/.test(line)) {
      return MethodType.IS_ENABLED;
    }

    if (/prefab\.get\(?\s*["']$/.test(line)) {
      return MethodType.GET;
    }

    return null;
  },

  detectMethods: (document): MethodLocation[] => {
    const result: MethodLocation[] = [];

    const text = document.getText();

    const methodKeys = Object.keys(METHOD_REGEXES).sort();

    methodKeys.forEach((methodType) => {
      const [regex, offset] = METHOD_REGEXES[methodType];

      for (const match of text.matchAll(regex)) {
        if (!match.index) {
          continue;
        }

        const key = match[1];

        const keyRange = {
          start: document.positionAt(match.index + offset),
          end: document.positionAt(match.index + offset + key.length),
        };

        const range = {
          start: document.positionAt(match.index),
          end: document.positionAt(match.index + match[0].length),
        };

        result.push({
          type: methodType,
          range,
          key,
          keyRange,
        });
      }
    });

    return result;
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
