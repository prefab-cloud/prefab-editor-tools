import { TextDocument } from "vscode-languageserver-textdocument";

import { Position } from "vscode-languageserver/node";

export const currentLine = (
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
