import { Position, Range } from "vscode-languageserver/node";

export const stringAtPosition = (
  input: string,
  position: Position
): { value: string; range: Range } | null => {
  const wrappers = ['"', "'", "`"];
  let insideString = false;
  let currentWrapper: string | null = null;
  let startPosition: Position | null = null;

  const lines = input.split("\n");
  let currentLine = 0;
  let currentChar = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    // Update line and character position
    if (char === "\n") {
      currentLine++;
      currentChar = 0;
      continue;
    }

    // Handle string wrappers
    if (wrappers.includes(char)) {
      if (!insideString) {
        insideString = true;
        currentWrapper = char;
        startPosition = { line: currentLine, character: currentChar };
      } else if (char === currentWrapper && startPosition) {
        insideString = false;
        if (
          startPosition.line <= position.line &&
          startPosition.character <= position.character &&
          currentLine >= position.line &&
          currentChar >=
            (position.line === currentLine ? position.character - 1 : 0)
        ) {
          const startIdx =
            lines
              .slice(0, startPosition.line)
              .reduce((acc, l) => acc + l.length + 1, 0) +
            startPosition.character;
          const endIdx =
            lines
              .slice(0, currentLine)
              .reduce((acc, l) => acc + l.length + 1, 0) + currentChar;

          return {
            value: input.substring(startIdx, endIdx + 1),
            range: {
              start: startPosition,
              end: { line: currentLine, character: currentChar + 1 },
            },
          };
        }
      }
    }

    currentChar++;
  }

  return null;
};
