import { describe, expect, it } from "bun:test";

import { updateApiClient } from "../apiClient";
import {
  cannedEvaluationResponse,
  log,
  mkAnnotatedDocument,
  mockClient,
} from "../testHelpers";
import { type ClientContext, MethodType } from "../types";
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
      completionTypeWithPrefix: () => null,
      methodLocations: [
        {
          key: "redis.connection-string",
          type: MethodType.GET,
          range,
          keyRange,
        },
      ],
    });

    const settings = { apiKey: "123-P3-E5-SDK-..." };

    updateApiClient({
      settings,
      log,
      clientContext: {} as ClientContext,
    });

    const result = await runAllHovers({
      settings,
      document,
      position,
      log,
      filterForMissingKeys,
      providedUrlFor: () => url,
      providedClient: mockClient({ get: cannedEvaluationResponse }),
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
