import { expect, it, describe } from "bun:test";
import { MethodLocation } from "../types";
import { DIAGNOSTIC_SOURCE } from "../constants";

import { log, mkAnnotatedDocument, readFileSync } from "../testHelpers";
import missingKeys from "./missingKeys";

const cannedResponse = readFileSync("fixtures/ruby.rb.parsed.json");

describe("missingKeys", () => {
  it("returns missing config/flag diagnostics for a document", async () => {
    // We'll consider everything missing except for the api.enabled flag
    const filterForMissingKeys = async (methods: MethodLocation[]) => {
      return methods.filter((method) => {
        return method.key !== "api.enabled";
      });
    };

    const document = mkAnnotatedDocument({
      methodLocations: JSON.parse(cannedResponse),
    });

    const results = await missingKeys({
      document,
      filterForMissingKeys,
      log,
    });

    const expected = [
      {
        source: DIAGNOSTIC_SOURCE,
        severity: 1,
        range: {
          start: {
            line: 20,
            character: 16,
          },
          end: {
            line: 20,
            character: 39,
          },
        },
        data: {
          kind: "missingKey",
          key: "api-rate-limit-per-user",
          type: "GET",
        },
        message: "`api-rate-limit-per-user` is not defined.",
      },
      {
        source: DIAGNOSTIC_SOURCE,
        severity: 1,
        range: {
          start: {
            line: 20,
            character: 75,
          },
          end: {
            line: 20,
            character: 96,
          },
        },
        data: {
          kind: "missingKey",
          key: "api-rate-limit-window",
          type: "GET",
        },
        message: "`api-rate-limit-window` is not defined.",
      },
      {
        source: DIAGNOSTIC_SOURCE,
        severity: 1,
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
        data: {
          kind: "missingKey",
          key: "some.value",
          type: "GET",
        },
        message: "`some.value` is not defined.",
      },
      {
        source: DIAGNOSTIC_SOURCE,
        severity: 2,
        range: {
          start: {
            line: 3,
            character: 7,
          },
          end: {
            line: 3,
            character: 22,
          },
        },
        data: {
          kind: "missingKey",
          key: "everyone.is.pro",
          type: "IS_ENABLED",
        },
        message:
          "`everyone.is.pro` is not defined. This will always return false.",
      },
      {
        source: DIAGNOSTIC_SOURCE,
        severity: 2,
        range: {
          start: {
            line: 16,
            character: 21,
          },
          end: {
            line: 16,
            character: 32,
          },
        },
        data: {
          kind: "missingKey",
          key: "hat.enabled",
          type: "IS_ENABLED",
        },
        message: "`hat.enabled` is not defined. This will always return false.",
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

    const document = mkAnnotatedDocument({ methodLocations: [] });

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

    const document = mkAnnotatedDocument({
      methodLocations: JSON.parse(cannedResponse),
    });

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
