import { expect, it, describe } from "bun:test";
import { Position } from "vscode-languageserver/node";
import { mkDocument } from "../testHelpers";
import { CompletionType, MethodType } from "../types";

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
          MethodType.IS_ENABLED
        );
      });
    });

    it("can identify a Config call", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        expect(NodeSDK.detectMethod(document, position)).toEqual(
          MethodType.GET
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

        expect(NodeSDK.completionType(document, position)).toEqual(
          CompletionType.BOOLEAN_FEATURE_FLAGS
        );
      });
    });

    it("returns config and non-boolean flag names for Get calls", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
        const document = mkDocument({ text: importPrefabPrelude + text });

        expect(NodeSDK.completionType(document, position)).toEqual(
          CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS
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
});
