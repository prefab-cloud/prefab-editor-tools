import { describe, expect, it } from "bun:test";
import {
  ClientCapabilities,
  CodeAction,
  CodeActionKind,
  CodeActionParams,
} from "vscode-languageserver/node";

import { annotateDocument, getAnnotatedDocument } from "../documentAnnotations";
import RubySDK from "../sdks/ruby";
import { log, mkAnnotatedDocument, mkDocument } from "../testHelpers";
import { type ClientContext, CustomHandler } from "../types";
import extractString from "./extractString";

const range = {
  end: { line: 3, character: 8 },
  start: { line: 3, character: 8 },
};

const params: CodeActionParams = {
  context: { triggerKind: 1, diagnostics: [] },
  range,
  textDocument: { uri: "file:///Users/ship/src/example.rb" },
};

const customHandlers = [CustomHandler.getInput];

const clientContext = {
  capabilities: {
    workspace: {
      applyEdit: true,
    },
  } as unknown as ClientCapabilities,
  customHandlers,
} as unknown as ClientContext;

const matchingDocument = mkAnnotatedDocument({
  sdk: RubySDK,
  textDocument: mkDocument({
    text: 'some text\n\nSome content\nputs "Hello there" # comment',
  }),
});

const settings = {
  optIn: {
    extractString: true,
  },
};

describe("extractString", () => {
  it("returns [] when there's no string under the cursor", async () => {
    const document = mkAnnotatedDocument({
      sdk: RubySDK,
      textDocument: mkDocument({
        text: "some text\n\nSome content\nYou are nice",
      }),
    });

    const result = await extractString({
      clientContext,
      document,
      params,
      log,
      settings,
    });

    expect(result).toStrictEqual([]);
  });

  it("returns a CodeAction with a command to replace a string", async () => {
    const rangeOfStringToExtract = {
      start: {
        line: 3,
        character: 5,
      },
      end: {
        line: 3,
        character: 18,
      },
    };

    const expected: CodeAction = {
      title: `Extract to Prefab config: "Hello there"`,
      kind: CodeActionKind.RefactorExtract,
      command: {
        title: `Extract to Prefab config: "Hello there"`,
        command: "prefab.extractConfig",
        arguments: [
          matchingDocument.uri,
          `"Hello there"`,
          rangeOfStringToExtract,
        ],
      },
    };

    const result = await extractString({
      clientContext,
      document: matchingDocument,
      params,
      log,
      settings,
    });

    expect(result).toStrictEqual([expected]);
  });

  it("does not include the string if it is part of a prefab method", async () => {
    const rawDocument = mkDocument({
      text: 'some text\n\nSome content\nprefab.get("Hello there") # comment',
      languageId: "ruby",
    });

    annotateDocument(rawDocument);

    const document = getAnnotatedDocument(rawDocument);

    const range = {
      end: { line: 3, character: 13 },
      start: { line: 3, character: 13 },
    };

    const params: CodeActionParams = {
      context: { triggerKind: 1, diagnostics: [] },
      range,
      textDocument: { uri: "file:///Users/ship/src/example.rb" },
    };

    const result = await extractString({
      clientContext,
      document,
      params,
      log,
      settings,
    });

    expect(result).toStrictEqual([]);
  });

  it("returns [] when workspace/applyEdit isn't supported", async () => {
    const result = await extractString({
      clientContext: {
        capabilities: {
          workspace: {
            applyEdit: false,
          },
        },
        customHandlers,
      } as unknown as ClientContext,
      document: matchingDocument,
      params,
      log,
      settings,
    });

    expect(result).toStrictEqual([]);
  });

  it("returns [] when the custom handlers aren't all supported", async () => {
    const result = await extractString({
      clientContext: {
        capabilities: {
          workspace: {
            applyEdit: true,
          },
        },
        customHandlers: [],
      } as unknown as ClientContext,
      document: matchingDocument,
      params,
      log,
      settings,
    });

    expect(result).toStrictEqual([]);
  });

  it("returns [] when the user hasn't opt-ed in", async () => {
    const result = await extractString({
      clientContext,
      document: matchingDocument,
      params,
      log,
      settings: {
        optIn: { extractString: false },
      },
    });

    expect(result).toStrictEqual([]);
  });
});
