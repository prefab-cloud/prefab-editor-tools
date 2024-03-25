import { describe, expect, it } from "bun:test";
import { CompletionItemKind } from "vscode-languageserver/node";

import { log, mkAnnotatedDocument } from "../testHelpers";
import {
  CompletionType,
  type CompletionTypeValue,
  CompletionTypeWithPrefix,
} from "../types";
import keys from "./keys";

const providedKeysForCompletionType = async (
  type: CompletionTypeValue | null,
) => {
  switch (type) {
    case CompletionType.BOOLEAN_FEATURE_FLAGS:
      return ["flag1", "flag2", "another-flag"];
    case CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS:
      return ["config1", "config2", "wordy-flag"];
    default:
      return [];
  }
};

describe("keys", () => {
  it("can return flag keys", async () => {
    const completionTypeWithPrefix = (): CompletionTypeWithPrefix | null => {
      return {
        completionType: CompletionType.BOOLEAN_FEATURE_FLAGS,
        prefix: "",
      };
    };

    const position = { line: 3, character: 20 };

    const document = mkAnnotatedDocument({
      completionTypeWithPrefix: completionTypeWithPrefix,
    });

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
        insertText: "flag1",
      },
      {
        label: "flag2",
        kind: CompletionItemKind.Constant,
        data: "flag2",
        insertText: "flag2",
      },
      {
        label: "another-flag",
        kind: CompletionItemKind.Constant,
        data: "another-flag",
        insertText: "another-flag",
      },
    ]);
  });

  it("can return config keys", async () => {
    const completionTypeWithPrefix = (): CompletionTypeWithPrefix | null => {
      return {
        completionType: CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS,
        prefix: "",
      };
    };

    const position = { line: 7, character: 18 };

    const document = mkAnnotatedDocument({
      completionTypeWithPrefix: completionTypeWithPrefix,
    });

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
        insertText: "config1",
      },
      {
        label: "config2",
        kind: CompletionItemKind.Constant,
        data: "config2",
        insertText: "config2",
      },
      {
        label: "wordy-flag",
        kind: CompletionItemKind.Constant,
        data: "wordy-flag",
        insertText: "wordy-flag",
      },
    ]);
  });

  it("can return flag keys filtered by the already-typed prefix", async () => {
    const completionTypeWithPrefix = (): CompletionTypeWithPrefix | null => {
      return {
        completionType: CompletionType.BOOLEAN_FEATURE_FLAGS,
        prefix: "f",
      };
    };

    const position = { line: 3, character: 20 };

    const document = mkAnnotatedDocument({
      completionTypeWithPrefix: completionTypeWithPrefix,
    });

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
        insertText: "lag1",
      },
      {
        label: "flag2",
        kind: CompletionItemKind.Constant,
        data: "flag2",
        insertText: "lag2",
      },
    ]);
  });

  it("can return config keys filtered by the already-typed prefix", async () => {
    const completionTypeWithPrefix = (): CompletionTypeWithPrefix | null => {
      return {
        completionType: CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS,
        prefix: "c",
      };
    };

    const position = { line: 7, character: 18 };

    const document = mkAnnotatedDocument({
      completionTypeWithPrefix: completionTypeWithPrefix,
    });

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
        insertText: "onfig1",
      },
      {
        label: "config2",
        kind: CompletionItemKind.Constant,
        data: "config2",
        insertText: "onfig2",
      },
    ]);
  });

  it("returns an empty array if there's no identifiable FF or Config method", async () => {
    const position = { line: 1, character: 10 };

    const document = mkAnnotatedDocument({
      completionTypeWithPrefix: () => null,
    });

    const results = await keys({
      position,
      document,
      providedKeysForCompletionType,
      log,
    });

    expect(results).toStrictEqual([]);
  });
});
