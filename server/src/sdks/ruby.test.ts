import { expect, it, describe } from "bun:test";
import { Position } from "vscode-languageserver/node";
import { mkDocument, readFileSync } from "../testHelpers";
import { CompletionType, MethodType, MethodLocation } from "../types";
import RubySDK from "./ruby";
import * as fs from "fs";
import * as path from "path";

type ExampleStringAndPosition = [string, Position];

const FF_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.enabled?("")', { line: 0, character: 17 }],
  ['prefab.enabled?("', { line: 0, character: 17 }],
  ["prefab.enabled?('", { line: 0, character: 17 }],
  ["prefab.enabled?('')", { line: 0, character: 17 }],
  ['prefab.enabled? ""', { line: 0, character: 17 }],
  ['prefab.enabled? "', { line: 0, character: 17 }],
  ["prefab.enabled? '", { line: 0, character: 17 }],
  ["prefab.enabled? ''", { line: 0, character: 17 }],
];

const CONFIG_EXAMPLES: ExampleStringAndPosition[] = [
  ['prefab.get("', { line: 0, character: 12 }],
  ["prefab.get('", { line: 0, character: 12 }],
  ['prefab.get("")', { line: 0, character: 12 }],
  ["prefab.get('')", { line: 0, character: 12 }],
  ['prefab.get "', { line: 0, character: 12 }],
  ["prefab.get '", { line: 0, character: 12 }],
  ['prefab.get ""', { line: 0, character: 12 }],
  ["prefab.get ''", { line: 0, character: 12 }],
];

const missingFlagsAndConfigText = readFileSync("fixtures/ruby.rb.txt");

const writeStub = (data: object) => {
  const string = JSON.stringify(data, null, 2);

  const stubPath = path.join(__dirname, "../fixtures/ruby.rb.parsed.json");

  if (fs.readFileSync(stubPath, "utf-8") !== string) {
    fs.writeFileSync(stubPath, string);
  }
};

describe("RubySDK", () => {
  describe("isApplicable", () => {
    it("is applicable if the languageId is ruby", () => {
      const document = mkDocument({
        languageId: "ruby",
      });

      expect(RubySDK.isApplicable(document)).toBe(true);
    });

    it("is not applicable if the languageId is not ruby", () => {
      const document = mkDocument({
        languageId: "not-ruby",
      });

      expect(RubySDK.isApplicable(document)).toBe(false);
    });
  });

  describe("detectMethod", () => {
    it("can identify a FF call", () => {
      FF_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(RubySDK.detectMethod(document, position)).toEqual(
          MethodType.IS_ENABLED
        );
      });
    });

    it("can identify a Config call", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        expect(RubySDK.detectMethod(document, position)).toEqual(
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

        expect(RubySDK.detectMethod(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(RubySDK.detectMethod(document, newPosition)).toBeNull();
      });
    });
  });

  describe("completions", () => {
    FF_EXAMPLES.forEach(([text, position]) => {
      it(`returns flag names for \`${text}\``, () => {
        const document = mkDocument({ text });

        expect(RubySDK.completionType(document, position)).toEqual(
          CompletionType.BOOLEAN_FEATURE_FLAGS
        );
      });
    });

    CONFIG_EXAMPLES.forEach(([text, position]) => {
      it(`returns config and non-boolean flag names for \`${text}\``, () => {
        const document = mkDocument({ text });

        expect(RubySDK.completionType(document, position)).toEqual(
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

        expect(RubySDK.completionType(document, newPosition)).toBeNull();
      });

      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text });

        const newPosition = {
          line: position.line,
          character: position.character - 1,
        };

        expect(RubySDK.completionType(document, newPosition)).toBeNull();
      });
    });
  });

  describe("detectMethods", () => {
    it("returns all methods in a document", () => {
      const document = mkDocument({
        text: missingFlagsAndConfigText,
      });

      const methods = RubySDK.detectMethods(document);

      const expected: MethodLocation[] = [
        {
          type: MethodType.GET,
          range: {
            start: {
              line: 20,
              character: 4,
            },
            end: {
              line: 20,
              character: 42,
            },
          },
          key: "api-rate-limit-per-user",
          keyRange: {
            start: {
              line: 20,
              character: 16,
            },
            end: {
              line: 20,
              character: 39,
            },
          },
        },

        {
          type: MethodType.GET,
          range: {
            start: {
              line: 20,
              character: 63,
            },
            end: {
              line: 20,
              character: 98,
            },
          },
          key: "api-rate-limit-window",
          keyRange: {
            start: {
              line: 20,
              character: 75,
            },
            end: {
              line: 20,
              character: 96,
            },
          },
        },
        {
          type: "GET",
          range: {
            start: {
              line: 28,
              character: 8,
            },
            end: {
              line: 29,
              character: 4,
            },
          },
          key: "some.value",
          keyRange: {
            start: {
              line: 28,
              character: 20,
            },
            end: {
              line: 28,
              character: 30,
            },
          },
        },
        {
          type: MethodType.IS_ENABLED,
          range: {
            start: {
              line: 2,
              character: 7,
            },
            end: {
              line: 4,
              character: 5,
            },
          },
          key: "everyone.is.pro",
          keyRange: {
            start: {
              line: 3,
              character: 0,
            },
            end: {
              line: 3,
              character: 15,
            },
          },
        },

        {
          key: "api.enabled",
          keyRange: {
            end: {
              character: 32,
              line: 12,
            },
            start: {
              character: 21,
              line: 12,
            },
          },
          range: {
            end: {
              character: 2,
              line: 13,
            },
            start: {
              character: 4,
              line: 12,
            },
          },
          type: "IS_ENABLED",
        },

        {
          key: "hat.enabled",
          keyRange: {
            end: {
              character: 32,
              line: 16,
            },
            start: {
              character: 21,
              line: 16,
            },
          },
          range: {
            end: {
              character: 34,
              line: 16,
            },
            start: {
              character: 4,
              line: 16,
            },
          },
          type: "IS_ENABLED",
        },
      ];

      expect(methods.length).toEqual(expected.length);

      methods.forEach((method, index) => {
        expect(method).toStrictEqual(expected[index]);
      });

      writeStub(expected);
    });
  });
});
