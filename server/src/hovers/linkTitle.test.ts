import { describe, expect, it } from "bun:test";

import { log, mkAnnotatedDocument } from "../testHelpers";
import { type ClientContext, type MethodLocation, MethodType } from "../types";
import linkTitle from "./linkTitle";

const keyRange = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const range = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const position = { line: 3, character: 20 };

const url =
  "https://app.prefab.cloud/account/projects/3/configs/redis.connection-string";

describe("link", () => {
  it("can link to a config or flag", async () => {
    const filterForMissingKeys = async () => [];

    const providedUrlFor = () => url;

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
      clientContext: {} as ClientContext,
      position,
      providedUrlFor,
      log,
      settings: { apiKey: "123-P3-E5-SDK-..." },
      filterForMissingKeys,
    });

    expect(result).toStrictEqual({
      contents: `[redis.connection-string](${url})`,
      range: keyRange,
    });
  });

  it("returns null if neither flag nor link are under the cursor", async () => {
    const document = mkAnnotatedDocument({
      methodLocations: [],
    });

    const result = await linkTitle({
      document,
      clientContext: {} as ClientContext,
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
      clientContext: {} as ClientContext,
      position,
      log,
      filterForMissingKeys,
      settings: { apiKey: "123-P3-E5-SDK-..." },
    });

    expect(result).toBeNull();
  });
});
