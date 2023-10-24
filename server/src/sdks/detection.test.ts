import { describe, expect, it } from "bun:test";

import { mkDocument } from "../testHelpers";
import { detectSDK,NullSDK } from "./detection";
import JavaSDK from "./java";
import JavascriptSDK from "./javascript";
import NodeSDK from "./node";
import ReactSDK from "./react";
import RubySDK from "./ruby";

describe("detectSDK", () => {
  it("returns the NullSDK if there is no matching SDK", () => {
    const document = mkDocument({
      languageId: "no-matching-sdk",
    });
    expect(detectSDK(document)).toEqual(NullSDK);
  });

  it("returns the correct SDK for a Ruby file", () => {
    const document = mkDocument({
      languageId: "ruby",
    });

    expect(detectSDK(document)).toEqual(RubySDK);
  });

  it("returns the correct SDK for a Node file", () => {
    ["javascript", "typescript"].forEach((languageId) => {
      const document = mkDocument({
        languageId,
      });

      expect(detectSDK(document)).toEqual(NodeSDK);
    });
  });

  it("returns the correct SDK for a JavaScript file", () => {
    ["javascript", "typescript"].forEach((languageId) => {
      const document = mkDocument({
        languageId,
        text: "document.getElementById",
      });

      expect(detectSDK(document)).toEqual(JavascriptSDK);
    });
  });

  it("returns the correct SDK for a React file", () => {
    ["javascriptreact", "typescriptreact"].forEach((languageId) => {
      const document = mkDocument({
        languageId,
      });

      expect(detectSDK(document)).toEqual(ReactSDK);
    });
  });

  it("returns the correct SDK for a Java file", () => {
    const document = mkDocument({
      languageId: "java",
    });

    expect(detectSDK(document)).toEqual(JavaSDK);
  });
});
