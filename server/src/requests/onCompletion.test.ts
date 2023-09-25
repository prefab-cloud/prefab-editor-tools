import { expect, it, describe } from "bun:test";
import { CompletionItemKind, HoverParams } from "vscode-languageserver/node";
import { ConfigType, type ConfigTypeValue } from "../prefabClient";
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

const prefabConfigNamesOfType = async (type: ConfigTypeValue) => {
  if (type === ConfigType.FEATURE_FLAG) {
    return ["flag1", "flag2"];
  }

  return ["config1", "config2"];
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
      prefabConfigNamesOfType,
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
      prefabConfigNamesOfType,
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
    ]);
  });

  it("returns an empty array if there's no identifiable FF or Config method", async () => {
    const func = onCompletion({
      documents,
      getSettings,
      prefabConfigNamesOfType,
    });

    const params = {
      textDocument: { uri },
      position: { line: 1, character: 10 },
    } as HoverParams;

    const results = await func(params);

    expect(results).toBeNull();
  });
});
