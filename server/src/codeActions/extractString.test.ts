import { expect, it, describe } from "bun:test";

import {
  ClientCapabilities,
  CodeAction,
  CodeActionParams,
  CodeActionKind
} from "vscode-languageserver/node";
import { log, mkAnnotatedDocument, mkDocument } from "../testHelpers";
import extractString from "./extractString";
import { CustomHandler, type PrefabInitializeParams } from "../types";
import RubySDK from "../sdks/ruby";

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

const initializeParams = {
  capabilities: {
    workspace: {
      applyEdit: true,
    },
  } as unknown as ClientCapabilities,
  customHandlers,
} as unknown as PrefabInitializeParams;

const matchingDocument = mkAnnotatedDocument({
  sdk: RubySDK,
  textDocument: mkDocument({
    text: 'some text\n\nSome content\nputs "Hello there" # comment',
  }),
});

describe("extractString", () => {
  it("returns [] when there's no string under the cursor", async () => {
    const document = mkAnnotatedDocument({
      sdk: RubySDK,
      textDocument: mkDocument({
        text: "some text\n\nSome content\nYou are nice",
      }),
    });

    const result = await extractString({
      initializeParams,
      document,
      params,
      log,
    });

    expect(result).toStrictEqual([]);
  });

  it("returns [] if the SDK doesn't support configGet", async () => {
    const result = await extractString({
      initializeParams,
      document: {
        ...matchingDocument,
        sdk: { ...RubySDK, configGet: undefined },
      },
      params,
      log,
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
      title: `Extract to config: "Hello there"`,
        kind: CodeActionKind.RefactorExtract,
      command: {
        title: `Extract to config: "Hello there"`,
        command: "prefab.extractConfig",
        arguments: [
          matchingDocument.uri,
          `"Hello there"`,
          rangeOfStringToExtract,
        ],
      },
    };

    const result = await extractString({
      initializeParams,
      document: matchingDocument,
      params,
      log,
    });

    expect(result).toStrictEqual([expected]);
  });

  it("returns [] when workspace/applyEdit isn't supported", async () => {
    const result = await extractString({
      initializeParams: {
        capabilities: {
          workspace: {
            applyEdit: false,
          },
        },
        customHandlers,
      } as unknown as PrefabInitializeParams,
      document: matchingDocument,
      params,
      log,
    });

    expect(result).toStrictEqual([]);
  });

  it("returns [] when the custom handlers aren't all supported", async () => {
    const result = await extractString({
      initializeParams: {
        capabilities: {
          workspace: {
            applyEdit: true,
          },
        },
        customHandlers: [],
      } as unknown as PrefabInitializeParams,
      document: matchingDocument,
      params,
      log,
    });

    expect(result).toStrictEqual([]);
  });
});
