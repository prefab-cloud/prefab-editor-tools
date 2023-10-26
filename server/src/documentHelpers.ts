import { Position } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

export const lineFromStartToPosition = (
  document: TextDocument | undefined,
  position: Position
) => {
  if (!document) {
    return undefined;
  }

  return document.getText({
    start: { line: position.line, character: 0 },
    end: { line: position.line, character: position.character },
  });
};

export const fullLine = (document: TextDocument, position: Position) => {
  return document.getText({
    start: { line: position.line, character: 0 },
    end: {
      line: position.line,
      character: Infinity,
    },
  });
};

export const allMatches = (
  document: TextDocument,
  text: string,
  regex: RegExp
) => {
  const result = [];

  for (const match of text.matchAll(regex)) {
    if (!match.index) {
      continue;
    }

    const key = match[1];

    // NOTE: This has potential to be wrong if the key conflicts with the method
    const offset = match[0].indexOf(key);

    const keyRange = {
      start: document.positionAt(match.index + offset),
      end: document.positionAt(match.index + offset + key.length),
    };

    const range = {
      start: document.positionAt(match.index),
      end: document.positionAt(match.index + match[0].trim().length),
    };

    result.push({
      range,
      key,
      keyRange,
    });
  }

  return result;
};
