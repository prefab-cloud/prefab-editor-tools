import { expect, it, describe } from "bun:test";
import { Position } from "vscode-languageserver/node";
import { mkDocument } from "../testHelpers";
import { CompletionType, MethodLocation, MethodType } from "../types";
import * as fs from "fs";
import * as path from "path";

import JavascriptSDK, { RELEVANT_FILETYPES } from "./javascript";

type ExampleStringAndPosition = [string, Position];

const FF_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.isEnabled("")', { line: 0, character: 18 }],
  ['prefab.isEnabled("', { line: 0, character: 18 }],
  ["prefab.isEnabled('", { line: 0, character: 18 }],
  ["prefab.isEnabled('')", { line: 0, character: 18 }],
  ["prefab.isEnabled(`", { line: 0, character: 18 }],
  ["prefab.isEnabled(``)", { line: 0, character: 18 }],
];

const CONFIG_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.get("', { line: 0, character: 12 }],
  ['prefab.get("")', { line: 0, character: 12 }],
  ["prefab.get('", { line: 0, character: 12 }],
  ["prefab.get('')", { line: 0, character: 12 }],
  ["prefab.get(`", { line: 0, character: 12 }],
  ["prefab.get(``)", { line: 0, character: 12 }],
];

const missingFlagsAndConfigText = fs.readFileSync(
  path.join(__dirname, "../fixtures/javascript.js.txt"),
  "utf-8"
);

describe("JavascriptSDK", () => {
  describe("isApplicable", () => {
    // NOTE: this looks naive but we're assuming the node SDK detection happens first and this is a fall-through
    it("is applicable if the filetype is relevant", () => {
      RELEVANT_FILETYPES.forEach((filetype) => {
        const document = mkDocument({
          languageId: filetype,
        });

        expect(JavascriptSDK.isApplicable(document)).toBe(true);
      });
    });

    it("is not applicable if the filetype isn't relevant", () => {
      const document = mkDocument({
        languageId: "not-js",
      });

      expect(JavascriptSDK.isApplicable(document)).toBe(false);
    });
  });

  describe("detectMethod", () => {
    it("can identify a FF call", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(JavascriptSDK.detectMethod(document, position)).toEqual(
          MethodType.IS_ENABLED
        );
      });
    });

    it("can identify a Config call", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(JavascriptSDK.detectMethod(document, position)).toEqual(
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

        expect(JavascriptSDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(JavascriptSDK.detectMethod(document, newPosition)).toBeNull();
      });
    });
  });

  describe("completions", () => {
    it("returns boolean flag names for FF calls", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(JavascriptSDK.completionType(document, position)).toEqual(
          CompletionType.BOOLEAN_FEATURE_FLAGS
        );
      });
    });

    it("returns non-boolean flag names for Get calls", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(JavascriptSDK.completionType(document, position)).toEqual(
          CompletionType.NON_BOOLEAN_FEATURE_FLAGS
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

        expect(JavascriptSDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(JavascriptSDK.completionType(document, newPosition)).toBeNull();
      });
    });
  });

  describe("detectMethods", () => {
    it("returns all methods in a document", () => {
      const document = mkDocument({
        text: missingFlagsAndConfigText,
      });

      const methods = JavascriptSDK.detectMethods(document);

      const expected: MethodLocation[] = [
        {
          type: "GET",
          range: {
            start: {
              line: 8,
              character: 0,
            },
            end: {
              line: 8,
              character: 19,
            },
          },
          key: "test",
          keyRange: {
            start: {
              line: 8,
              character: 12,
            },
            end: {
              line: 8,
              character: 16,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 8,
              character: 22,
            },
            end: {
              line: 11,
              character: 8,
            },
          },
          key: "test2",
          keyRange: {
            start: {
              line: 9,
              character: 0,
            },
            end: {
              line: 9,
              character: 5,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 13,
              character: 10,
            },
            end: {
              line: 13,
              character: 28,
            },
          },
          key: "test",
          keyRange: {
            start: {
              line: 13,
              character: 22,
            },
            end: {
              line: 13,
              character: 26,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 0,
              character: 11,
            },
            end: {
              line: 0,
              character: 42,
            },
          },
          key: "api.enabled",
          keyRange: {
            start: {
              line: 0,
              character: 28,
            },
            end: {
              line: 0,
              character: 39,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 4,
              character: 4,
            },
            end: {
              line: 4,
              character: 30,
            },
          },
          key: "turbo",
          keyRange: {
            start: {
              line: 4,
              character: 21,
            },
            end: {
              line: 4,
              character: 26,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 4,
              character: 34,
            },
            end: {
              line: 4,
              character: 70,
            },
          },
          key: "all.new.features",
          keyRange: {
            start: {
              line: 4,
              character: 51,
            },
            end: {
              line: 4,
              character: 67,
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
