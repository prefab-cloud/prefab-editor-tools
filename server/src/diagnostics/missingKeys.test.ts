import { expect, it, describe } from "bun:test";
import { AnnotatedDocument, MethodLocation } from "../types";

import { log, mkDocument } from "../testHelpers";
import missingKeys from "./missingKeys";

import * as fs from "fs";
import * as path from "path";

const missingFlagsAndConfigText = fs.readFileSync(
  path.join(__dirname, "../fixtures/user.rb.txt"),
  "utf-8"
);

const cannedResponse = fs.readFileSync(
  path.join(__dirname, "../fixtures/user.rb.parsed.json"),
  "utf-8"
);

const uri = "file:///Users/you/project/app/models/user.rb";

describe("missingKeys", () => {
  it("returns missing config/flag diagnostics for a document", async () => {
    // We'll consider everything missing except for the api.enabled flag
    const filterForMissingKeys = async (methods: MethodLocation[]) => {
      return methods.filter((method) => {
        return method.key !== "api.enabled";
      });
    };

    const document: AnnotatedDocument = {
      uri,
      completionType: () => null,
      methodLocations: JSON.parse(cannedResponse),
    };

    const results = await missingKeys({
      document,
      filterForMissingKeys,
      log,
    });

    const expected = [
      {
        message: "`api-rate-limit-per-user` is not defined.",
        data: {
          key: "api-rate-limit-per-user",
          kind: "missingKey",
          type: "GET",
        },
        range: {
          end: {
            character: 39,
            line: 20,
          },
          start: {
            character: 16,
            line: 20,
          },
        },
        severity: 1,
      },
      {
        message: "`api-rate-limit-window` is not defined.",
        data: {
          key: "api-rate-limit-window",
          kind: "missingKey",
          type: "GET",
        },
        range: {
          end: {
            character: 96,
            line: 20,
          },
          start: {
            character: 75,
            line: 20,
          },
        },
        severity: 1,
      },
      {
        message: "`some.value` is not defined.",
        severity: 1,
        data: {
          key: "some.value",
          kind: "missingKey",
          type: "GET",
        },
        range: {
          start: {
            line: 28,
            character: 20,
          },
          end: {
            line: 28,
            character: 30,
          },
        },
      },
      {
        message:
          "`everyone.is.pro` is not defined. This will always return false.",
        data: {
          key: "everyone.is.pro",
          kind: "missingKey",
          type: "IS_ENABLED",
        },
        range: {
          end: {
            character: 15,
            line: 3,
          },
          start: {
            character: 0,
            line: 3,
          },
        },
        severity: 2,
      },
      {
        message: "`hat.enabled` is not defined. This will always return false.",
        data: {
          key: "hat.enabled",
          kind: "missingKey",
          type: "IS_ENABLED",
        },
        range: {
          end: {
            character: 32,
            line: 16,
          },
          start: {
            character: 21,
            line: 16,
          },
        },
        severity: 2,
      },
    ];

    expect(results.length).toEqual(expected.length);

    results.forEach((result, index) => {
      expect(result).toStrictEqual(expected[index]);
    });
  });

  it("returns nothing if the content has no missing config/flags", async () => {
    // We'll consider everything missing except for the api.enabled flag
    const filterForMissingKeys = async (methods: MethodLocation[]) => {
      return methods.filter((method) => {
        return method.key !== "api.enabled";
      });
    };

    const document: AnnotatedDocument = {
      uri,
      completionType: () => null,
      methodLocations: [],
    };

    const results = await missingKeys({
      document,
      filterForMissingKeys,
      log,
    });

    expect(results).toStrictEqual([]);
  });

  it("can exclude keys", async () => {
    // We'll consider everything missing except for the api.enabled flag
    const filterForMissingKeys = async (methods: MethodLocation[]) => {
      return methods.filter((method) => {
        return method.key !== "api.enabled";
      });
    };

    const document: AnnotatedDocument = {
      uri,
      completionType: () => null,
      methodLocations: JSON.parse(cannedResponse),
    };

    const results = await missingKeys({
      document,
      filterForMissingKeys,
      log,
    });

    expect(results.map((r) => r.message)).toStrictEqual([
      "`api-rate-limit-per-user` is not defined.",
      "`api-rate-limit-window` is not defined.",
      "`some.value` is not defined.",
      "`everyone.is.pro` is not defined. This will always return false.",
      "`hat.enabled` is not defined. This will always return false.",
    ]);

    const resultsWithExclusion = await missingKeys({
      document,
      filterForMissingKeys,
      log,
      exclude: ["everyone.is.pro"],
    });

    expect(resultsWithExclusion.map((r) => r.message)).toStrictEqual([
      "`api-rate-limit-per-user` is not defined.",
      "`api-rate-limit-window` is not defined.",
      "`some.value` is not defined.",
      "`hat.enabled` is not defined. This will always return false.",
    ]);
  });
});
