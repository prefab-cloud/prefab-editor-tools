import { expect, it, describe } from "bun:test";

import linkTitle from "./linkTitle";

import { MethodType, type MethodLocation } from "../types";

import { log, mkAnnotatedDocument } from "../testHelpers";

const keyRange = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const range = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const position = { line: 3, character: 20 };

describe("link", () => {
  it("can link to a config", async () => {
    const document = mkAnnotatedDocument({
      methodLocations: [
        {
          key: "redis.connection-string",
          type: MethodType.GET,
          range,
          keyRange,
        },
      ],
    });

    const result = await linkTitle({
      document,
      position,
      log,
      settings: { apiKey: "123-P3-E5-SDK-..." },
    });

    expect(result).toStrictEqual({
      contents:
        "[redis.connection-string](https://app.prefab.cloud/account/projects/3/configs/redis.connection-string)",
      range: keyRange,
    });
  });

  it("can link to a flag", async () => {
    const document = mkAnnotatedDocument({
      methodLocations: [
        {
          key: "api.enabled",
          type: MethodType.IS_ENABLED,
          range,
          keyRange,
        },
      ],
    });

    const result = await linkTitle({
      document,
      position,
      log,
      settings: { apiKey: "123-P3-E5-SDK-..." },
    });

    expect(result).toStrictEqual({
      contents:
        "[api.enabled](https://app.prefab.cloud/account/projects/3/flags/api.enabled)",
      range: keyRange,
    });
  });

  it("returns null if neither flag nor link are under the cursor", async () => {
    const document = mkAnnotatedDocument({
      methodLocations: [],
    });

    const result = await linkTitle({
      document,
      position,
      log,
      settings: { apiKey: "123-P3-E5-SDK-..." },
    });

    expect(result).toBeNull();
  });

  it("returns null if the config/flag under the cursor does not exist", async () => {
    const filterForMissingKeys = async (locations: MethodLocation[]) =>
      locations;

    const document = mkAnnotatedDocument({
      methodLocations: [
        {
          key: "api.enabled",
          type: MethodType.IS_ENABLED,
          range,
          keyRange,
        },
      ],
    });

    const result = await linkTitle({
      document,
      position,
      log,
      filterForMissingKeys,
      settings: { apiKey: "123-P3-E5-SDK-..." },
    });

    expect(result).toBeNull();
  });
});
