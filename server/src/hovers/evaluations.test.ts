import { expect, it, describe } from "bun:test";
import { log, mkAnnotatedDocument, mockedGet } from "../testHelpers";
import { MethodType } from "../types";

import evaluations from "./evaluations";

describe("evaluations", () => {
  it("fetches an evaluation from the server", async () => {
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
      providedGet: mockedGet({
        json: {
          key: "redis.connection-string",
          start: 1696354310632,
          end: 1696440710632,
          total: 69156,
          environments: {
            "136": {
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
      }),
    });

    expect(result).toStrictEqual({
      contents:
        "69,156 evaluations over the last 24 hours\n\nEnvironment 136: 34,494\n- 65% - redis://internal-redis.example.com:6379\n- 35% - redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111\n\nEnvironment 137: 34,662\n- 50% - redis://internal-redis.example.com:6379\n- 50% - redis://redis-11111.c1.us-central1-2.gce.cloud.redislabs.com:11111",
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
