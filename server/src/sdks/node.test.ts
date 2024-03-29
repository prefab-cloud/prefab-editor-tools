import { describe, expect, it } from "bun:test";
import { Position } from "vscode-languageserver/node";

import { mkDocument, readFileSync } from "../testHelpers";
import { CompletionType, MethodLocation, MethodType } from "../types";
import NodeSDK, { doesNotLookLikeBrowserJS, RELEVANT_FILETYPES } from "./node";

type ExampleStringAndPosition = [string, Position];

const importPrefabPrelude = `
  import { Prefab } from "@prefab-cloud/prefab-cloud-node";

`;

const FF_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.isFeatureEnabled("")', { line: 3, character: 25 }],
  ['prefab.isFeatureEnabled("', { line: 3, character: 25 }],
  ["prefab.isFeatureEnabled('", { line: 3, character: 25 }],
  ["prefab.isFeatureEnabled('')", { line: 3, character: 25 }],
  ["prefab.isFeatureEnabled(`", { line: 3, character: 25 }],
  ["prefab.isFeatureEnabled(``)", { line: 3, character: 25 }],
];

const CONFIG_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.get("', { line: 3, character: 12 }],
  ['prefab.get("")', { line: 3, character: 12 }],
  ["prefab.get('", { line: 3, character: 12 }],
  ["prefab.get('')", { line: 3, character: 12 }],
  ["prefab.get(`", { line: 3, character: 12 }],
  ["prefab.get(``)", { line: 3, character: 12 }],
];

const missingFlagsAndConfigText = readFileSync("fixtures/node.js.txt");

describe("NodeSDK", () => {
  describe("isApplicable", () => {
    it("is applicable if the filetype is relevant and it the content doesn't look browser-y", () => {
      RELEVANT_FILETYPES.forEach((filetype) => {
        const document = mkDocument({
          languageId: filetype,
          text: "something goes here",
        });

        expect(NodeSDK.isApplicable(document)).toBe(true);
      });
    });

    it("is not applicable if the filetype is relevant but the content looks browser-y", () => {
      RELEVANT_FILETYPES.forEach((filetype) => {
        const document = mkDocument({
          languageId: filetype,
          text: "document.getElementById('foo')",
        });

        expect(NodeSDK.isApplicable(document)).toBe(false);
      });
    });

    it("is applicable if the filetype is relevant and the content looks browser-y but the import statement is found", () => {
      RELEVANT_FILETYPES.forEach((filetype) => {
        const document = mkDocument({
          languageId: filetype,
          text: `
          // this doesn't even have to be an import, it can be treated like an
          // annotation/hint for the language server
          // @prefab-cloud/prefab-cloud-node

          document.getElementById('foo')",
          `,
        });

        expect(NodeSDK.isApplicable(document)).toBe(true);
      });
    });

    it("is not applicable if the filetype isn't relevant", () => {
      const document = mkDocument({
        languageId: "not-js",
      });

      expect(NodeSDK.isApplicable(document)).toBe(false);
    });
  });

  describe("doesNotLookLikeBrowserJS", () => {
    it("returns false if the document contains document.getElementById", () => {
      const document = mkDocument({
        text: "document.getElementById('foo')",
      });

      expect(doesNotLookLikeBrowserJS(document)).toBe(false);
    });

    it("returns false if the document contains document.querySelector", () => {
      const document = mkDocument({
        text: "document.querySelector('.foo')",
      });

      expect(doesNotLookLikeBrowserJS(document)).toBe(false);
    });

    it("returns false if the document contains document.querySelectorAll", () => {
      const document = mkDocument({
        text: "document.querySelectorAll('.foo')",
      });

      expect(doesNotLookLikeBrowserJS(document)).toBe(false);
    });

    it("returns true if the document doesn't contain window or document methods", () => {
      const document = mkDocument({
        text: "something goes here",
      });

      expect(doesNotLookLikeBrowserJS(document)).toBe(true);
    });
  });

  describe("detectMethod", () => {
    it("can identify a FF call", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        expect(NodeSDK.detectMethod(document, position)).toEqual(
          MethodType.IS_ENABLED,
        );
      });
    });

    it("can identify a Config call", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        expect(NodeSDK.detectMethod(document, position)).toEqual(
          MethodType.GET,
        );
      });
    });

    it("returns null if no import of prefab is detected", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(NodeSDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(NodeSDK.detectMethod(document, newPosition)).toBeNull();
      });
    });

    it("returns null if no call is found at the cursor position", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(NodeSDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(NodeSDK.detectMethod(document, newPosition)).toBeNull();
      });
    });
  });

  describe("completions", () => {
    it("returns flag names for FF calls", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        expect(NodeSDK.completionType(document, position)).toEqual({
          completionType: CompletionType.BOOLEAN_FEATURE_FLAGS,
          prefix: "",
        });
      });
    });

    it("returns config and non-boolean flag names for Get calls", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        expect(NodeSDK.completionType(document, position)).toEqual({
          completionType: CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS,
          prefix: "",
        });
      });
    });

    it("can complete mid-word", () => {
      const examples: [string, Position, string][] = [
        [
          importPrefabPrelude + 'prefab.get("ap")',
          { line: 3, character: 14 },
          CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS,
        ],
        [
          importPrefabPrelude + 'prefab.isFeatureEnabled("ap")',
          { line: 3, character: 27 },
          CompletionType.BOOLEAN_FEATURE_FLAGS,
        ],
      ];

      examples.forEach(([text, position, expectedType]) => {
        const document = mkDocument({ text });
        expect(NodeSDK.completionType(document, position)).toEqual({
          completionType: expectedType,
          prefix: "ap",
        });
      });
    });

    it("won't complete from outside the key", () => {
      const examples: ExampleStringAndPosition[] = [
        [importPrefabPrelude + 'prefab.get("no")', { line: 3, character: 15 }],
        [
          importPrefabPrelude + 'prefab.isFeatureEnabled("no")',
          { line: 3, character: 28 },
        ],
      ];

      examples.forEach(([text, position]) => {
        const document = mkDocument({ text });
        expect(NodeSDK.completionType(document, position)).toBeNull();
      });
    });

    it("returns null if no import of prefab is detected", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(NodeSDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: 0, // no prelude
          character: position.character,
        };

        expect(NodeSDK.completionType(document, newPosition)).toBeNull();
      });
    });

    it("returns null if no call is found at the cursor position", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(NodeSDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(NodeSDK.completionType(document, newPosition)).toBeNull();
      });
    });
  });

  describe("detectMethods", () => {
    it("returns all methods in a document", () => {
      const document = mkDocument({
        text: missingFlagsAndConfigText,
      });

      const methods = NodeSDK.detectMethods(document);

      const expected: MethodLocation[] = [
        {
          type: "GET",
          range: {
            start: {
              line: 22,
              character: 0,
            },
            end: {
              line: 22,
              character: 18,
            },
          },
          key: "test",
          keyRange: {
            start: {
              line: 22,
              character: 12,
            },
            end: {
              line: 22,
              character: 16,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 22,
              character: 22,
            },
            end: {
              line: 23,
              character: 15,
            },
          },
          key: "test2",
          keyRange: {
            start: {
              line: 23,
              character: 9,
            },
            end: {
              line: 23,
              character: 14,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 27,
              character: 10,
            },
            end: {
              line: 27,
              character: 28,
            },
          },
          key: "test",
          keyRange: {
            start: {
              line: 27,
              character: 22,
            },
            end: {
              line: 27,
              character: 26,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 14,
              character: 11,
            },
            end: {
              line: 14,
              character: 49,
            },
          },
          key: "api.enabled",
          keyRange: {
            start: {
              line: 14,
              character: 36,
            },
            end: {
              line: 14,
              character: 47,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 18,
              character: 4,
            },
            end: {
              line: 18,
              character: 37,
            },
          },
          key: "turbo",
          keyRange: {
            start: {
              line: 18,
              character: 30,
            },
            end: {
              line: 18,
              character: 35,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 18,
              character: 41,
            },
            end: {
              line: 18,
              character: 84,
            },
          },
          key: "all.new.features",
          keyRange: {
            start: {
              line: 18,
              character: 66,
            },
            end: {
              line: 18,
              character: 82,
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
