import { beforeEach, expect, it, describe } from "bun:test";
import {
  clearLog,
  log,
  getLoggedItems,
  lastItem,
  mkAnnotatedDocument,
  mockRequest,
  cannedEvaluationResponse,
} from "../testHelpers";
import { MethodLocation, MethodType } from "../types";

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

    const providedGet = mockRequest(cannedEvaluationResponse);

    const settings = {};

    const result = await evaluations({
      settings,
      document,
      position,
      log,
      filterForMissingKeys,
      providedGet,
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

    expect(providedGet).toHaveBeenCalledTimes(1);
    expect(providedGet.mock.calls[0]).toStrictEqual([
      {
        log,
        requestPath: "/api/v1/evaluation-stats/redis.connection-string",
        settings,
      },
    ]);
  });

  it("won't show hover if the key does not exist", async () => {
    const filterForMissingKeys = async (locations: MethodLocation[]) =>
      locations;

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

    const result = await evaluations({
      settings: {},
      document,
      position,
      log,
      filterForMissingKeys,
      providedGet: mockRequest(cannedEvaluationResponse),
    });

    expect(result).toBeNull();
    expect(lastItem(getLoggedItems())).toStrictEqual({
      message: "Key does not exist",
      scope: "Hover",
      severity: "info",
    });
  });

  it("works for int input", async () => {
    const filterForMissingKeys = async () => [];

    const document = mkAnnotatedDocument({
      completionType: () => null,
      methodLocations: [
        {
          key: "james.test1",
          type: MethodType.GET,
          range,
          keyRange,
        },
      ],
    });

    const result = await evaluations({
      settings: {},
      document,
      position,
      log,
      filterForMissingKeys,
      providedGet: mockRequest({
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
              counts: [
                {
                  configValue: {
                    int: 1,
                  },
                  count: 3,
                },
              ],
            },
          },
        },
      }),
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
