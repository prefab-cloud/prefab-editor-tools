import { describe, expect, it } from "bun:test";
import * as fs from "fs";
import * as path from "path";
import { Position } from "vscode-languageserver/node";

import { mkDocument, readFileSync } from "../testHelpers";
import { CompletionType, MethodLocation, MethodType } from "../types";
import RubySDK from "./ruby";

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

    it("is applicable if the languageId is eruby", () => {
      const document = mkDocument({
        languageId: "eruby",
      });

      expect(RubySDK.isApplicable(document)).toBe(true);
    });

    it("is applicable if the languageId is erb", () => {
      const document = mkDocument({
        languageId: "erb",
      });

      expect(RubySDK.isApplicable(document)).toBe(true);
    });

    it("is applicable if file uri ends in .erb", () => {
      const document = mkDocument({
        uri: "file:///path/to/file.erb",
        languageId: "not-obviously-relevant",
      });

      expect(RubySDK.isApplicable(document)).toBe(true);
    });

    it("is not applicable if the languageId is not ruby or eruby or erb", () => {
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
          type: "GET",
          range: {
            start: {
              line: 20,
              character: 4,
            },
            end: {
              line: 20,
              character: 41,
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
          type: "GET",
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
              line: 28,
              character: 31,
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
          type: "IS_ENABLED",
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
              character: 7,
            },
            end: {
              line: 3,
              character: 22,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 12,
              character: 4,
            },
            end: {
              line: 12,
              character: 33,
            },
          },
          key: "api.enabled",
          keyRange: {
            start: {
              line: 12,
              character: 21,
            },
            end: {
              line: 12,
              character: 32,
            },
          },
        },
        {
          type: "IS_ENABLED",
          range: {
            start: {
              line: 16,
              character: 4,
            },
            end: {
              line: 16,
              character: 34,
            },
          },
          key: "hat.enabled",
          keyRange: {
            start: {
              line: 16,
              character: 21,
            },
            end: {
              line: 16,
              character: 32,
            },
          },
        },
      ];

      expect(methods.length).toEqual(expected.length);

      methods.forEach((method, index) => {
        expect(method).toStrictEqual(expected[index]);
      });

      writeStub(expected);
    });
  });

  describe("detectProvidable", () => {
    it("finds ENV vars", () => {
      const document = mkDocument({
        text: "a = ENV['FOO']\nb = ENV[\"BAZ\"]\nc = ENV['BAR']",
      });

      const position: Position = {
        line: 0,
        character: 12,
      };

      if (!RubySDK.detectProvidable) {
        throw new Error("detectProvidable is not defined");
      }

      const actual = RubySDK.detectProvidable(document, position);

      expect(actual).toStrictEqual({
        range: {
          start: {
            line: 0,
            character: 4,
          },
          end: {
            line: 0,
            character: 14,
          },
        },
        key: "'FOO'",
        keyRange: {
          start: {
            line: 0,
            character: 8,
          },
          end: {
            line: 0,
            character: 13,
          },
        },
      });

      const anotherPosition: Position = {
        line: 1,
        character: 12,
      };

      const another = RubySDK.detectProvidable(document, anotherPosition);

      expect(another).toStrictEqual({
        range: {
          start: {
            line: 1,
            character: 4,
          },
          end: {
            line: 1,
            character: 14,
          },
        },
        key: '"BAZ"',
        keyRange: {
          start: {
            line: 1,
            character: 8,
          },
          end: {
            line: 1,
            character: 13,
          },
        },
      });

      const lastOnePosition: Position = {
        line: 2,
        character: 5,
      };

      const lastOne = RubySDK.detectProvidable(document, lastOnePosition);

      expect(lastOne).toStrictEqual({
        range: {
          start: {
            line: 2,
            character: 4,
          },
          end: {
            line: 2,
            character: 14,
          },
        },
        key: "'BAR'",
        keyRange: {
          start: {
            line: 2,
            character: 8,
          },
          end: {
            line: 2,
            character: 13,
          },
        },
      });
    });
  });
});
