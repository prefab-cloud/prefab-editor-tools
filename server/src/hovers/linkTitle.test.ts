import { describe, expect, it } from "bun:test";

import { MethodType } from "../types";
import linkTitle from "./linkTitle";

const keyRange = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const range = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const url =
  "https://app.prefab.cloud/account/projects/3/configs/redis.connection-string";

describe("link", () => {
  it("can link to a config or flag", async () => {
    const providedUrlFor = () => url;

    const method = {
      key: "redis.connection-string",
      type: MethodType.GET,
      range,
      keyRange,
    };

    const result = await linkTitle({
      providedUrlFor,
      settings: { apiKey: "123-P3-E5-SDK-..." },
      method,
    });

    expect(result).toStrictEqual({
      contents: `[redis.connection-string](${url})`,
      range: keyRange,
    });
  });
});
