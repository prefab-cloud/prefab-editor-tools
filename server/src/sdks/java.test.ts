import { expect, it, describe } from "bun:test";
import { Position } from "vscode-languageserver/node";
import { mkDocument } from "../testHelpers";
import { CompletionType, MethodType } from "../prefabClient";
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
];

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

    it("can identify a Config call", () => {
      CONFIG_EXAMPLES.forEach(([text, position]) => {
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
});
