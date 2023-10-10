import { expect, it, describe } from "bun:test";
import { Position } from "vscode-languageserver/node";
import { mkDocument, readFileSync } from "../testHelpers";
import { CompletionType, MethodLocation, MethodType } from "../types";
import JavaSDK from "./java";

type ExampleStringAndPosition = [string, Position];

const FF_EXAMPLES: ExampleStringAndPosition[] = [
  ['.featureIsOn("")', { line: 0, character: 14 }],
  ['.featureIsOn("', { line: 0, character: 14 }],
  [".featureIsOn('", { line: 0, character: 14 }],
  [".featureIsOn('')", { line: 0, character: 14 }],
];

const CONFIG_EXAMPLES: ExampleStringAndPosition[] = [
  ['.get("', { line: 0, character: 6 }],
  [".get('", { line: 0, character: 6 }],
  ['.get("")', { line: 0, character: 6 }],
  [".get('')", { line: 0, character: 6 }],
  [".liveString('", { line: 0, character: 13 }],
  [".liveString('')", { line: 0, character: 13 }],
  [".liveStringList('", { line: 0, character: 17 }],
  [".liveStringList('')", { line: 0, character: 17 }],
  [".liveBoolean('", { line: 0, character: 14 }],
  [".liveBoolean('')", { line: 0, character: 14 }],
  [".liveLong('", { line: 0, character: 11 }],
  [".liveLong('')", { line: 0, character: 11 }],
  [".liveDouble('", { line: 0, character: 13 }],
  [".liveDouble('')", { line: 0, character: 13 }],
];

const missingFlagsAndConfigText = readFileSync("fixtures/java.txt");

describe("JavaSDK", () => {
  describe("isApplicable", () => {
    it("is applicable if the languageId is java", () => {
      const document = mkDocument({
        languageId: "java",
      });

      expect(JavaSDK.isApplicable(document)).toBe(true);
    });

    it("is not applicable if the languageId is not java", () => {
      const document = mkDocument({
        languageId: "not-java",
      });

      expect(JavaSDK.isApplicable(document)).toBe(false);
    });
  });

  describe("detectMethod", () => {
    it("can identify a FF call", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(JavaSDK.detectMethod(document, position)).toEqual(
          MethodType.IS_ENABLED
        );
      });
    });

    CONFIG_EXAMPLES.forEach(([text, position]) => {
      it(`can identify a Config call for ${text}`, () => {
        const document = mkDocument({ text });

        expect(JavaSDK.detectMethod(document, position)).toEqual(
          MethodType.GET
        );
      });
    });

    it("returns null if no call is found at the cursor position", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(JavaSDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(JavaSDK.detectMethod(document, newPosition)).toBeNull();
      });
    });
  });

  describe("completions", () => {
    it("returns flag names for FF calls", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(JavaSDK.completionType(document, position)).toEqual(
          CompletionType.BOOLEAN_FEATURE_FLAGS
        );
      });
    });

    it("returns config and non-boolean flag names for Config calls", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(JavaSDK.completionType(document, position)).toEqual(
          CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS
        );
      });
    });

    it("returns null if no call is found at the cursor position", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(JavaSDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(JavaSDK.completionType(document, newPosition)).toBeNull();
      });
    });
  });

  describe("detectMethods", () => {
    it("returns all methods in a document", () => {
      const document = mkDocument({
        text: missingFlagsAndConfigText,
      });

      const methods = JavaSDK.detectMethods(document);

      const expected: MethodLocation[] = [
        {
          type: "GET",
          range: {
            start: {
              line: 62,
              character: 28,
            },
            end: {
              line: 62,
              character: 55,
            },
          },
          key: "the.feature",
          keyRange: {
            start: {
              line: 62,
              character: 42,
            },
            end: {
              line: 62,
              character: 53,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 66,
              character: 28,
            },
            end: {
              line: 67,
              character: 19,
            },
          },
          key: "the.feature",
          keyRange: {
            start: {
              line: 67,
              character: 7,
            },
            end: {
              line: 67,
              character: 18,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 20,
              character: 34,
            },
            end: {
              line: 20,
              character: 60,
            },
          },
          key: "some.config",
          keyRange: {
            start: {
              line: 20,
              character: 47,
            },
            end: {
              line: 20,
              character: 58,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 49,
              character: 23,
            },
            end: {
              line: 49,
              character: 48,
            },
          },
          key: "some.other.config",
          keyRange: {
            start: {
              line: 49,
              character: 29,
            },
            end: {
              line: 49,
              character: 46,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 53,
              character: 23,
            },
            end: {
              line: 54,
              character: 25,
            },
          },
          key: "some.other.config",
          keyRange: {
            start: {
              line: 54,
              character: 7,
            },
            end: {
              line: 54,
              character: 24,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 73,
              character: 28,
            },
            end: {
              line: 73,
              character: 47,
            },
          },
          key: "the.feature",
          keyRange: {
            start: {
              line: 73,
              character: 34,
            },
            end: {
              line: 73,
              character: 45,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 77,
              character: 28,
            },
            end: {
              line: 78,
              character: 19,
            },
          },
          key: "the.feature",
          keyRange: {
            start: {
              line: 78,
              character: 7,
            },
            end: {
              line: 78,
              character: 18,
            },
          },
        },
      ];

      expect(methods.length).toEqual(expected.length);

      methods.forEach((method, index) => {
        expect(method).toStrictEqual(expected[index]);
      });
    });
  });
});
