import { expect, it, describe } from "bun:test";
import { Position } from "vscode-languageserver/node";
import { mkDocument } from "../testHelpers";
import { CompletionType, MethodType } from "../types";

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
});
