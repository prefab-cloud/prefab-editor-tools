import { Position, TextDocument } from "vscode-languageserver-textdocument";

import { allMatches, lineFromStartToPosition } from "../documentHelpers";
import {
  KeyLocation,
  MethodLocation,
  MethodType,
  MethodTypeKeys,
  MethodTypeValue,
} from "../types";
import { contains } from "../utils/positions";

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
  const line = lineFromStartToPosition(document, position);

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

export const detectProvidable = (
  document: TextDocument,
  position: Position,
  regex: RegExp
): KeyLocation | undefined => {
  const text = document.getText();

  const matches = allMatches(document, text, regex);

  return matches.filter((match) => {
    return contains({ container: match.range, comparable: position });
  })[0];
};

export const detectMethods = (
  document: TextDocument,
  regexes: DetectMethodsRegex
): MethodLocation[] => {
  const result: MethodLocation[] = [];

  const text = document.getText();

  METHOD_KEYS.forEach((methodType) => {
    const regex = regexes[methodType];

    const matches = allMatches(document, text, regex);

    matches.forEach((match) => {
      result.push({ ...match, type: methodType });
    });
  });

  return result;
};
