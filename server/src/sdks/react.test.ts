import { expect, it, describe } from "bun:test";
import { Position } from "vscode-languageserver/node";
import { mkDocument } from "../testHelpers";
import { CompletionType, MethodLocation, MethodType } from "../types";
import * as fs from "fs";
import * as path from "path";

import ReactSDK, { RELEVANT_FILETYPES } from "./react";

type ExampleStringAndPosition = [string, Position];

const usePrefabPrelude = `
  const { isEnabled, get } = usePrefab();

`;

const FF_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.isEnabled("")', { line: 3, character: 18 }],
  ['prefab.isEnabled("', { line: 3, character: 18 }],
  ["prefab.isEnabled('", { line: 3, character: 18 }],
  ["prefab.isEnabled('')", { line: 3, character: 18 }],
  ["prefab.isEnabled(`", { line: 3, character: 18 }],
  ["prefab.isEnabled(``)", { line: 3, character: 18 }],
];

const CONFIG_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.get("', { line: 3, character: 12 }],
  ['prefab.get("")', { line: 3, character: 12 }],
  ["prefab.get('", { line: 3, character: 12 }],
  ["prefab.get('')", { line: 3, character: 12 }],
  ["prefab.get(`", { line: 3, character: 12 }],
  ["prefab.get(``)", { line: 3, character: 12 }],
];

const missingFlagsAndConfigText = fs.readFileSync(
  path.join(__dirname, "../fixtures/react.js.txt"),
  "utf-8"
);

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
          MethodType.IS_ENABLED
        );
      });
    });

    it("can identify a Config call", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        expect(ReactSDK.detectMethod(document, position)).toEqual(
          MethodType.GET
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

        expect(ReactSDK.completionType(document, position)).toEqual(
          CompletionType.BOOLEAN_FEATURE_FLAGS
        );
      });
    });

    it("returns non-boolean flag names for Get calls", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: usePrefabPrelude + text });

        expect(ReactSDK.completionType(document, position)).toEqual(
          CompletionType.NON_BOOLEAN_FEATURE_FLAGS
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
              line: 13,
              character: 14,
            },
            end: {
              line: 13,
              character: 29,
            },
          },
          key: "new-logo",
          keyRange: {
            start: {
              line: 13,
              character: 26,
            },
            end: {
              line: 15,
              character: 0,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 17,
              character: 2,
            },
            end: {
              line: 17,
              character: 20,
            },
          },
          key: "api.enabled",
          keyRange: {
            start: {
              line: 17,
              character: 14,
            },
            end: {
              line: 19,
              character: 0,
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
              character: 23,
            },
            end: {
              line: 4,
              character: 0,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 15,
              character: 13,
            },
            end: {
              line: 15,
              character: 34,
            },
          },
          key: "new-logo",
          keyRange: {
            start: {
              line: 15,
              character: 30,
            },
            end: {
              line: 15,
              character: 38,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 15,
              character: 38,
            },
            end: {
              line: 15,
              character: 60,
            },
          },
          key: "new-logo2",
          keyRange: {
            start: {
              line: 15,
              character: 55,
            },
            end: {
              line: 15,
              character: 64,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 15,
              character: 64,
            },
            end: {
              line: 15,
              character: 86,
            },
          },
          key: "new-logo3",
          keyRange: {
            start: {
              line: 15,
              character: 81,
            },
            end: {
              line: 17,
              character: 1,
            },
          },
        },
      ];

      console.log(JSON.stringify(methods, null, 2));

      expect(methods.length).toEqual(expected.length);

      methods.forEach((method, index) => {
        expect(method).toStrictEqual(expected[index]);
      });
    });
  });
});
