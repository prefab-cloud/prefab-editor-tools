import { Range, Position } from "vscode-languageserver/node";

export const contains = ({
  container,
  comparable: toCheck,
}: {
  container: Range;
  comparable: Position | Range;
}): boolean => {
  if ("line" in toCheck) {
    return (
      container.start.line <= toCheck.line &&
      container.end.line >= toCheck.line &&
      container.start.character <= toCheck.character &&
      container.end.character >= toCheck.character
    );
  }

  return (
    contains({ container, comparable: toCheck.start }) &&
    contains({ container, comparable: toCheck.end })
  );
};
