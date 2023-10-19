import { expect, it, describe } from "bun:test";

import {
  log,
  mkAnnotatedDocument,
  mockRequest,
  cannedEvaluationResponse,
} from "../testHelpers";
import { MethodType } from "../types";

import { runAllHovers } from "./index";

const range = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const keyRange = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const position = { line: 3, character: 20 };

const url =
  "https://app.prefab.cloud/account/projects/3/configs/redis.connection-string";

describe("runAllHovers", () => {
  it("assembles the title and evaluations", async () => {
    const filterForMissingKeys = async () => [];

    const document = mkAnnotatedDocument({
      completionType: () => null,
      methodLocations: [
        {
          key: "redis.connection-string",
          type: MethodType.GET,
          range,
          keyRange,
        },
      ],
    });

    const result = await runAllHovers({
      settings: { apiKey: "123-P3-E5-SDK-..." },
      document,
      position,
      log,
      filterForMissingKeys,
      providedUrlFor: () => url,
      providedGet: mockRequest(cannedEvaluationResponse),
    });

    expect(result).toStrictEqual({
      contents:
        "[redis.connection-string](https://app.prefab.cloud/account/projects/3/configs/redis.connection-string)\n\n69,156 evaluations over the last 24 hours\n\nProduction: 34,662\n- 50% - redis://internal-redis.example.com:6379\n- 50% - redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111\n\nStaging: 34,494\n- 65% - redis://internal-redis.example.com:6379\n- 35% - redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111",
      range: {
        start: position,
        end: {
          line: position.line,
          character: position.character + 20,
        },
      },
    });
  });
});
