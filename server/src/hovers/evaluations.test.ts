import { beforeEach, expect, it, describe } from "bun:test";
import {
  clearLog,
  log,
  getLoggedItems,
  lastItem,
  mkAnnotatedDocument,
  mockedGet,
} from "../testHelpers";
import { MethodLocation, MethodType } from "../types";

import evaluations from "./evaluations";

const mockResponse = {
  json: {
    key: "redis.connection-string",
    start: 1696354310632,
    end: 1696440710632,
    total: 69156,
    environments: {
      "136": {
        name: "Staging",
        total: 34494,
        counts: [
          {
            configValue: {
              string: "redis://internal-redis.example.com:6379",
            },
            count: 22429,
          },
          {
            configValue: {
              string:
                "redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111",
            },
            count: 12065,
          },
        ],
      },
      "137": {
        name: "Production",
        total: 34662,
        counts: [
          {
            configValue: {
              string: "redis://internal-redis.example.com:6379",
            },
            count: 17434,
          },
          {
            configValue: {
              string:
                "redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111",
            },
            count: 17228,
          },
        ],
      },
    },
  },
};

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
          range: {
            start: { line: 3, character: 20 },
            end: { line: 3, character: 40 },
          },
          keyRange: {
            start: { line: 3, character: 20 },
            end: { line: 3, character: 40 },
          },
        },
      ],
    });

    const position = { line: 3, character: 20 };

    const result = await evaluations({
      settings: {},
      document,
      position,
      log,
      filterForMissingKeys,
      providedGet: mockedGet(mockResponse),
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
          range: {
            start: { line: 3, character: 20 },
            end: { line: 3, character: 40 },
          },
          keyRange: {
            start: { line: 3, character: 20 },
            end: { line: 3, character: 40 },
          },
        },
      ],
    });

    const position = { line: 3, character: 20 };

    const result = await evaluations({
      settings: {},
      document,
      position,
      log,
      filterForMissingKeys,
      providedGet: mockedGet(mockResponse),
    });

    expect(result).toBeNull();
    expect(lastItem(getLoggedItems())).toStrictEqual({
      message: "Key does not exist",
      scope: "Hover",
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
          range: {
            start: { line: 3, character: 20 },
            end: { line: 3, character: 40 },
          },
          keyRange: {
            start: { line: 3, character: 20 },
            end: { line: 3, character: 40 },
          },
        },
      ],
    });

    const position = { line: 3, character: 20 };

    const result = await evaluations({
      settings: {},
      document,
      position,
      log,
      filterForMissingKeys,
      providedGet: mockedGet({
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
