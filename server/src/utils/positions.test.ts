import { expect, it, describe } from "bun:test";
import { Range, Position } from "vscode-languageserver/node";

import { contains } from "./positions";

describe("contains function", () => {
  it("should return true if Position is within Range", () => {
    const container: Range = {
      start: { line: 1, character: 1 },
      end: { line: 3, character: 5 },
    };
    const position: Position = { line: 2, character: 3 };
    expect(contains({ container, comparable: position })).toBe(true);
  });

  it("should return false if Position is outside Range", () => {
    const container: Range = {
      start: { line: 1, character: 1 },
      end: { line: 3, character: 5 },
    };
    const position: Position = { line: 4, character: 1 };
    expect(contains({ container, comparable: position })).toBe(false);
  });

  it("should return true if Range is fully contained within Range", () => {
    const container: Range = {
      start: { line: 1, character: 1 },
      end: { line: 5, character: 5 },
    };
    const range: Range = {
      start: { line: 2, character: 2 },
      end: { line: 4, character: 4 },
    };
    expect(contains({ container, comparable: range })).toBe(true);
  });

  it("should return false if Range is partially outside Range", () => {
    const container: Range = {
      start: { line: 1, character: 1 },
      end: { line: 3, character: 3 },
    };
    const range: Range = {
      start: { line: 2, character: 2 },
      end: { line: 4, character: 4 },
    };
    expect(contains({ container, comparable: range })).toBe(false);
  });

  it("should return false if Range is completely outside Range", () => {
    const container: Range = {
      start: { line: 1, character: 1 },
      end: { line: 2, character: 2 },
    };
    const range: Range = {
      start: { line: 3, character: 3 },
      end: { line: 4, character: 4 },
    };
    expect(contains({ container, comparable: range })).toBe(false);
  });
});
