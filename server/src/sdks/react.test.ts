import { describe, expect, it } from "bun:test";
import { Position } from "vscode-languageserver/node";

import { mkDocument, readFileSync } from "../testHelpers";
import { CompletionType, MethodLocation, MethodType } from "../types";
import ReactSDK, { RELEVANT_FILETYPES } from "./react";

type ExampleStringAndPosition = [string, Position];

const usePrefabPrelude = `
  const { isEnabled, get } = usePrefab();

`;

const FF_EXAMPLES: ExampleStringAndPosition[] = [
  ['isEnabled("")', { line: 3, character: 11 }],
  ['isEnabled("', { line: 3, character: 11 }],
  ["isEnabled('", { line: 3, character: 11 }],
  ["isEnabled('')", { line: 3, character: 11 }],
  ["isEnabled(`", { line: 3, character: 11 }],
  ["isEnabled(``)", { line: 3, character: 11 }],
];

const CONFIG_EXAMPLES: ExampleStringAndPosition[] = [
  ['get("', { line: 3, character: 5 }],
  ['get("")', { line: 3, character: 5 }],
  ["get('", { line: 3, character: 5 }],
  ["get('')", { line: 3, character: 5 }],
  ["get(`", { line: 3, character: 5 }],
  ["get(``)", { line: 3, character: 5 }],
];

const missingFlagsAndConfigText = readFileSync("fixtures/react.js.txt");

describe("ReactSDK", () => {
  describe("isApplicable", () => {
    it("is applicable if the filetype is relevant", () => {
      RELEVANT_FILETYPES.forEach((filetype) => {
        const document = mkDocument({
          languageId: filetype,
        });

        expect(ReactSDK.isApplicable(document)).toBe(true);
      });
    });

    it("is not applicable if the filetype isn't relevant", () => {
      const document = mkDocument({
        languageId: "not-js",
      });

      expect(ReactSDK.isApplicable(document)).toBe(false);
    });
  });

  describe("detectMethod", () => {
    it("can identify a FF call", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        expect(ReactSDK.detectMethod(document, position)).toEqual(
          MethodType.IS_ENABLED,
        );
      });
    });

    it("can identify a Config call", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        expect(ReactSDK.detectMethod(document, position)).toEqual(
          MethodType.GET,
        );
      });
    });

    it("returns null if no usePrefab is detected", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(ReactSDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(ReactSDK.detectMethod(document, newPosition)).toBeNull();
      });
    });

    it("returns null if no call is found at the cursor position", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(ReactSDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(ReactSDK.detectMethod(document, newPosition)).toBeNull();
      });
    });
  });

  describe("completions", () => {
    it("returns flag names for FF calls", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        expect(ReactSDK.completionType(document, position)).toEqual({
          completionType: CompletionType.BOOLEAN_FEATURE_FLAGS,
          prefix: "",
        });
      });
    });

    it("returns non-boolean flag names for Get calls", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        expect(ReactSDK.completionType(document, position)).toEqual({
          completionType: CompletionType.NON_BOOLEAN_FEATURE_FLAGS,
          prefix: "",
        });
      });
    });

    it("can complete mid-word", () => {
      const examples: [string, Position, string][] = [
        [
          usePrefabPrelude + 'get("ap")',
          { line: 3, character: 7 },
          CompletionType.NON_BOOLEAN_FEATURE_FLAGS,
        ],
        [
          usePrefabPrelude + 'isEnabled("ap")',
          { line: 3, character: 13 },
          CompletionType.BOOLEAN_FEATURE_FLAGS,
        ],
      ];

      examples.forEach(([text, position, expectedType]) => {
        const document = mkDocument({ text });
        expect(ReactSDK.completionType(document, position)).toEqual({
          completionType: expectedType,
          prefix: "ap",
        });
      });
    });

    it("won't complete from outside the key", () => {
      const examples: ExampleStringAndPosition[] = [
        [usePrefabPrelude + 'get("ap")', { line: 3, character: 8 }],
        [usePrefabPrelude + 'isEnabled("ap")', { line: 3, character: 14 }],
      ];

      examples.forEach(([text, position]) => {
        const document = mkDocument({ text });
        expect(ReactSDK.completionType(document, position)).toBeNull();
      });
    });

    it("returns null if no usePrefab is detected", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(ReactSDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(ReactSDK.completionType(document, newPosition)).toBeNull();
      });
    });

    it("returns null if no call is found at the cursor position", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(ReactSDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(ReactSDK.completionType(document, newPosition)).toBeNull();
      });
    });
  });

  describe("detectMethods", () => {
    it("returns all methods in a document", () => {
      const document = mkDocument({
        text: missingFlagsAndConfigText,
      });

      const methods = ReactSDK.detectMethods(document);

      const expected: MethodLocation[] = [
        {
          type: "GET",
          range: {
            start: {
              line: 16,
              character: 14,
            },
            end: {
              line: 16,
              character: 31,
            },
          },
          key: "some-value",
          keyRange: {
            start: {
              line: 16,
              character: 19,
            },
            end: {
              line: 16,
              character: 29,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 20,
              character: 2,
            },
            end: {
              line: 20,
              character: 20,
            },
          },
          key: "api.enabled",
          keyRange: {
            start: {
              line: 20,
              character: 7,
            },
            end: {
              line: 20,
              character: 18,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 21,
              character: 17,
            },
            end: {
              line: 21,
              character: 35,
            },
          },
          key: "another.one",
          keyRange: {
            start: {
              line: 21,
              character: 22,
            },
            end: {
              line: 21,
              character: 33,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 3,
              character: 6,
            },
            end: {
              line: 3,
              character: 27,
            },
          },
          key: "new-logo",
          keyRange: {
            start: {
              line: 3,
              character: 17,
            },
            end: {
              line: 3,
              character: 25,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 18,
              character: 13,
            },
            end: {
              line: 18,
              character: 34,
            },
          },
          key: "abc-logo",
          keyRange: {
            start: {
              line: 18,
              character: 24,
            },
            end: {
              line: 18,
              character: 32,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 18,
              character: 38,
            },
            end: {
              line: 18,
              character: 60,
            },
          },
          key: "abc-logo2",
          keyRange: {
            start: {
              line: 18,
              character: 49,
            },
            end: {
              line: 18,
              character: 58,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 18,
              character: 64,
            },
            end: {
              line: 18,
              character: 86,
            },
          },
          key: "abc-logo3",
          keyRange: {
            start: {
              line: 18,
              character: 75,
            },
            end: {
              line: 18,
              character: 84,
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
