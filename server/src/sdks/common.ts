import { Position, TextDocument } from "vscode-languageserver-textdocument";
import {
  MethodLocation,
  MethodType,
  MethodTypeKeys,
  MethodTypeValue,
} from "../types";
import { currentLine } from "../documentHelpers";

export type DetectMethodRegex = {
  [key in keyof typeof MethodType]: RegExp;
};

export type DetectMethodsRegex = {
  [key in keyof typeof MethodType]: RegExp;
};

const METHOD_KEYS: MethodTypeKeys[] = [
  MethodType.IS_ENABLED,
  MethodType.GET,
].sort() as MethodTypeKeys[];

export const detectMethod = (
  document: TextDocument,
  position: Position,
  regexes: DetectMethodRegex
): MethodTypeValue | null => {
  const line = currentLine(document, position);

  if (!line) {
    return null;
  }

  if (regexes.IS_ENABLED.test(line)) {
    return MethodType.IS_ENABLED;
  }

  if (regexes.GET.test(line)) {
    return MethodType.GET;
  }

  return null;
};

export const detectMethods = (
  document: TextDocument,
  regexes: DetectMethodsRegex
): MethodLocation[] => {
  const result: MethodLocation[] = [];

  const text = document.getText();

  METHOD_KEYS.forEach((methodType) => {
    const regex = regexes[methodType];

    for (const match of text.matchAll(regex)) {
      if (!match.index) {
        continue;
      }

      const key = match[1];

      // NOTE: This has potential to be wrong if the key conflicts with the
      // method, but that feels acceptable since it would only affect the
      // positioning of the diagnostic
      const offset = match[0].indexOf(key);

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
};
