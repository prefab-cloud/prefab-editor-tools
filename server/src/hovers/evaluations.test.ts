import { beforeEach, describe, expect, it, Mock } from "bun:test";

import {
  cannedEvaluationResponse,
  clearLog,
  log,
  mockClient,
} from "../testHelpers";
import { MethodType } from "../types";
import evaluations from "./evaluations";

const range = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const keyRange = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const position = { line: 3, character: 20 };

describe("evaluations", () => {
  beforeEach(() => {
    clearLog();
  });

  it("fetches an evaluation from the server", async () => {
    const method = {
      key: "redis.connection-string",
      type: MethodType.GET,
      range,
      keyRange,
    };

    const providedClient = mockClient({ get: cannedEvaluationResponse });

    const result = await evaluations({
      log,
      method,
      providedClient,
    });

    expect(result).toStrictEqual({
      contents:
        "69,156 evaluations over the last 24 hours\n\nProduction: 34,662\n- 50% - redis://internal-redis.example.com:6379\n- 50% - redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111\n\nStaging: 34,494\n- 65% - redis://internal-redis.example.com:6379\n- 35% - redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111",
      range: {
        start: position,
        end: {
          line: position.line,
          character: position.character + 20,
        },
      },
    });

    expect(providedClient.get).toHaveBeenCalledTimes(1);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((providedClient.get as Mock<any>).mock.calls[0]).toStrictEqual([
      "/api/v1/evaluation-stats/redis.connection-string",
    ]);
  });

  it("works for int input", async () => {
    const method = {
      key: "james.test1",
      type: MethodType.GET,
      range,
      keyRange,
    };

    const providedClient = mockClient({
      get: {
        status: 200,
        json: {
          key: "james.test1",
          start: 1696887708021,
          end: 1696974108021,
          total: 3,
          environments: {
            "108": {
              name: "Production",
              total: 3,
              counts: [{ configValue: { int: 1 }, count: 3 }],
            },
          },
        },
      },
    });

    const result = await evaluations({
      log,
      method,
      providedClient,
    });

    expect(result).toStrictEqual({
      contents:
        "3 evaluations over the last 24 hours\n\nProduction: 3\n- 100% - 1",
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
