import { describe, expect, it } from "bun:test";

import { stringAtPosition } from "./stringAtPosition";

const basicExample = `puts "Hello there" # comment`;

describe("stringAtPosition", () => {
  it("returns null for an empty document", () => {
    const result = stringAtPosition("", { line: 0, character: 0 });

    expect(result).toBeNull();
  });

  it("returns null if the position is outside a string", () => {
    const result = stringAtPosition(basicExample, {
      line: 0,
      character: 4,
    });

    expect(result).toBeNull();

    const anotherResult = stringAtPosition(basicExample, {
      line: 0,
      character: 19,
    });

    expect(anotherResult).toBeNull();
  });

  it("returns a string and position when on the starting delimiter of a string", () => {
    const result = stringAtPosition(basicExample, {
      line: 0,
      character: 5,
    });

    expect(result).toStrictEqual({
      value: `"Hello there"`,
      range: {
        start: { line: 0, character: 5 },
        end: { line: 0, character: 18 },
      },
    });
  });

  it("returns a string and position when on the ending delimiter of a string", () => {
    const result = stringAtPosition(basicExample, {
      line: 0,
      character: 18,
    });

    expect(result).toStrictEqual({
      value: `"Hello there"`,
      range: {
        start: { line: 0, character: 5 },
        end: { line: 0, character: 18 },
      },
    });
  });

  it("returns a string and position when within a string", () => {
    const result = stringAtPosition(basicExample, {
      line: 0,
      character: 6,
    });

    expect(result).toStrictEqual({
      value: `"Hello there"`,
      range: {
        start: { line: 0, character: 5 },
        end: { line: 0, character: 18 },
      },
    });
  });

  it("returns a string and position across multiple lines", () => {
    const result = stringAtPosition(
      `puts \`  Hello 



                                                                     there\``,
      {
        line: 0,
        character: 5,
      }
    );

    expect(result).toStrictEqual({
      value:
        "`  Hello \n\n\n\n                                                                     there`",
      range: {
        start: { line: 0, character: 5 },
        end: { line: 4, character: 75 },
      },
    });
  });

  it("can identify a string in a document that is further in a doc than unbalanced quotes", () => {
    const str = `# 'hello'

      puts "Hello there" # you're a nice boy "\`

      foo = "''\`bar\`'"`;

    const result = stringAtPosition(str, {
      line: 4,
      character: 13,
    });

    expect(result).toStrictEqual({
      value: `"''\`bar\`'"`,
      range: {
        start: { line: 4, character: 12 },
        end: { line: 4, character: 22 },
      },
    });

    const result2 = stringAtPosition(str, {
      line: 4,
      character: 15,
    });

    expect(result2).toStrictEqual({
      value: `"''\`bar\`'"`,
      range: {
        start: { line: 4, character: 12 },
        end: { line: 4, character: 22 },
      },
    });
  });
});
