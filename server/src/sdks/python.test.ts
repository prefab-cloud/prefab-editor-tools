import { describe, expect, it } from "bun:test";
import { Position } from "vscode-languageserver/node";

import { mkDocument, readFileSync } from "../testHelpers";
import { CompletionType, MethodLocation, MethodType } from "../types";
import PythonSDK from "./python";

type ExampleStringAndPosition = [string, Position];

const FF_EXAMPLES: ExampleStringAndPosition[] = [
  ['client.enabled("")', { line: 0, character: 16 }],
  ['client.enabled("', { line: 0, character: 16 }],
  ["client.enabled('", { line: 0, character: 16 }],
  ["client.enabled('')", { line: 0, character: 16 }],
  ['prefab.enabled(""', { line: 0, character: 16 }],
  ['prefab.enabled("', { line: 0, character: 16 }],
  ["prefab.enabled('", { line: 0, character: 16 }],
  ["prefab.enabled(''", { line: 0, character: 16 }],
];

const CONFIG_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.get("', { line: 0, character: 12 }],
  ["prefab.get('", { line: 0, character: 12 }],
  ['prefab.get("")', { line: 0, character: 12 }],
  ["prefab.get('')", { line: 0, character: 12 }],
  ['client.get("', { line: 0, character: 12 }],
  ["client.get('", { line: 0, character: 12 }],
  ['client.get(""', { line: 0, character: 12 }],
  ["client.get(''", { line: 0, character: 12 }],
];

const missingFlagsAndConfigText = readFileSync("fixtures/python.py.txt");

describe("PythonSDK", () => {
  describe("isApplicable", () => {
    it("is applicable if the languageId is python", () => {
      const document = mkDocument({
        languageId: "python",
      });

      expect(PythonSDK.isApplicable(document)).toBe(true);
    });

    it("is not applicable if the languageId is not python or epython or erb", () => {
      const document = mkDocument({
        languageId: "not-python",
      });

      expect(PythonSDK.isApplicable(document)).toBe(false);
    });
  });

  describe("detectMethod", () => {
    FF_EXAMPLES.forEach(([text, position]) => {
      it(`can identify a FF call: \`${text}\``, () => {
        const document = mkDocument({ text });

        expect(PythonSDK.detectMethod(document, position)).toEqual(
          MethodType.IS_ENABLED
        );
      });
    });

    CONFIG_EXAMPLES.forEach(([text, position]) => {
      it(`can identify a Config call: ${text}`, () => {
        const document = mkDocument({ text });

        expect(PythonSDK.detectMethod(document, position)).toEqual(
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

        expect(PythonSDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(PythonSDK.detectMethod(document, newPosition)).toBeNull();
      });
    });
  });

  describe("completions", () => {
    FF_EXAMPLES.forEach(([text, position]) => {
      it(`returns flag names for \`${text}\``, () => {
        const document = mkDocument({ text });

        expect(PythonSDK.completionType(document, position)).toEqual(
          CompletionType.BOOLEAN_FEATURE_FLAGS
        );
      });
    });

    CONFIG_EXAMPLES.forEach(([text, position]) => {
      it(`returns config and non-boolean flag names for \`${text}\``, () => {
        const document = mkDocument({ text });

        expect(PythonSDK.completionType(document, position)).toEqual(
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

        expect(PythonSDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(PythonSDK.completionType(document, newPosition)).toBeNull();
      });
    });
  });

  describe("detectMethods", () => {
    it("returns all methods in a document", () => {
      const document = mkDocument({
        text: missingFlagsAndConfigText,
      });

      const methods = PythonSDK.detectMethods(document);

      const expected: MethodLocation[] = [
        {
          type: "GET",
          range: {
            start: {
              line: 15,
              character: 11,
            },
            end: {
              line: 15,
              character: 48,
            },
          },
          key: "api-rate-limit-per-user",
          keyRange: {
            start: {
              line: 15,
              character: 23,
            },
            end: {
              line: 15,
              character: 46,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 15,
              character: 75,
            },
            end: {
              line: 15,
              character: 110,
            },
          },
          key: "api-rate-limit-window",
          keyRange: {
            start: {
              line: 15,
              character: 87,
            },
            end: {
              line: 15,
              character: 108,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 21,
              character: 8,
            },
            end: {
              line: 21,
              character: 32,
            },
          },
          key: "some.value",
          keyRange: {
            start: {
              line: 21,
              character: 20,
            },
            end: {
              line: 21,
              character: 30,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 3,
              character: 7,
            },
            end: {
              line: 3,
              character: 40,
            },
          },
          key: "everyone.is.pro",
          keyRange: {
            start: {
              line: 3,
              character: 23,
            },
            end: {
              line: 3,
              character: 38,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 9,
              character: 11,
            },
            end: {
              line: 9,
              character: 40,
            },
          },
          key: "api.enabled",
          keyRange: {
            start: {
              line: 9,
              character: 27,
            },
            end: {
              line: 9,
              character: 38,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 12,
              character: 11,
            },
            end: {
              line: 12,
              character: 40,
            },
          },
          key: "hat.enabled",
          keyRange: {
            start: {
              line: 12,
              character: 27,
            },
            end: {
              line: 12,
              character: 38,
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
