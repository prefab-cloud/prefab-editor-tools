import { expect, it, describe } from "bun:test";
import { CompletionItemKind, HoverParams } from "vscode-languageserver/node";
import { CompletionType, type CompletionTypeValue } from "../types";
import keys from "./keys";
import { log } from "../testHelpers";

const uri = "file:///some/path/test.txt";

const providedKeysForCompletionType = async (
  type: CompletionTypeValue | null
) => {
  switch (type) {
    case CompletionType.BOOLEAN_FEATURE_FLAGS:
      return ["flag1", "flag2"];
    case CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS:
      return ["config1", "config2", "wordy-flag"];
    default:
      return [];
  }
};

describe("keys", () => {
  it("can return flag keys", async () => {
    const completionType = (): CompletionTypeValue | null =>
      CompletionType.BOOLEAN_FEATURE_FLAGS;

    const position = { line: 3, character: 20 };

    const document = {
      uri: "file:///some/path/test.txt",
      completionType,
      methodLocations: [],
    };

    const results = await keys({
      position,
      document,
      providedKeysForCompletionType,
      log,
    });

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
    const completionType = (): CompletionTypeValue | null =>
      CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS;

    const position = { line: 7, character: 18 };

    const document = {
      uri: "file:///some/path/test.txt",
      completionType,
      methodLocations: [],
    };

    const results = await keys({
      position,
      document,
      providedKeysForCompletionType,
      log,
    });

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
    const completionType = () => null;

    const position = { line: 1, character: 10 };

    const document = {
      uri: "file:///some/path/test.txt",
      completionType,
      methodLocations: [],
    };

    const results = await keys({
      position,
      document,
      providedKeysForCompletionType,
      log,
    });

    expect(results).toStrictEqual([]);
  });
});
