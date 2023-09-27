import { expect, it, describe } from "bun:test";
import { CompletionItemKind, HoverParams } from "vscode-languageserver/node";
import {
  CompletionType,
  type CompletionTypeValue,
  type Prefab,
} from "../prefabClient";
import onCompletion from "./onCompletion";
import { mkDocumentStore } from "../testHelpers";

const uri = "file:///some/path/test.txt";

const documentCopy = `
# some comment

if prefab.enabled?("
  # ...
end

foo = prefab.get("
`;

const getSettings = async () => {};

const prefab = {} as Prefab;

const keysForCompletionType = async (type: CompletionTypeValue | null) => {
  switch (type) {
    case CompletionType.BOOLEAN_FEATURE_FLAGS:
      return ["flag1", "flag2"];
    case CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS:
      return ["config1", "config2", "wordy-flag"];
    default:
      return [];
  }
};

const documents = mkDocumentStore([
  {
    uri,
    text: documentCopy,
    languageId: "ruby",
  },
]);

describe("onCompletion function", () => {
  it("can return flag keys", async () => {
    const func = onCompletion({
      documents,
      getSettings,
      keysForCompletionType,
      prefab,
    });

    const params = {
      textDocument: { uri },
      position: { line: 3, character: 20 },
    } as HoverParams;

    const results = await func(params);

    expect(results).toStrictEqual([
      {
        label: "flag1",
        kind: CompletionItemKind.Constant,
        data: "flag1",
      },
      {
        label: "flag2",
        kind: CompletionItemKind.Constant,
        data: "flag2",
      },
    ]);
  });

  it("can return config keys", async () => {
    const func = onCompletion({
      documents,
      getSettings,
      keysForCompletionType,
      prefab,
    });

    const params = {
      textDocument: { uri },
      position: { line: 7, character: 18 },
    } as HoverParams;

    const results = await func(params);

    expect(results).toStrictEqual([
      {
        label: "config1",
        kind: CompletionItemKind.Constant,
        data: "config1",
      },
      {
        label: "config2",
        kind: CompletionItemKind.Constant,
        data: "config2",
      },
      {
        label: "wordy-flag",
        kind: CompletionItemKind.Constant,
        data: "wordy-flag",
      },
    ]);
  });

  it("returns an empty array if there's no identifiable FF or Config method", async () => {
    const func = onCompletion({
      documents,
      getSettings,
      keysForCompletionType,
      prefab,
    });

    const params = {
      textDocument: { uri },
      position: { line: 1, character: 10 },
    } as HoverParams;

    const results = await func(params);

    expect(results).toStrictEqual([]);
  });
});
