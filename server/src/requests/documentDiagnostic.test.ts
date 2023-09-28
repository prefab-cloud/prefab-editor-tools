import { expect, it, describe } from "bun:test";
import { MethodLocation } from "../types";
import { SDK } from "../sdks/detection";

import { log, mkDocument } from "../testHelpers";
import onDocumentDiagnostic from "./documentDiagnostic";

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

describe("onDocumentDiagnostic function", () => {
  it("returns missing config/flag diagnostics for a document", async () => {
    // We'll consider everything missing except for the api.enabled flag
    const filterForMissingKeys = async (methods: MethodLocation[]) => {
      return methods.filter((method) => {
        return method.key !== "api.enabled";
      });
    };

    const document = mkDocument({
      uri,
      text: missingFlagsAndConfigText,
      languageId: "ruby",
    });

    const sdk = {
      detectMethods: () => JSON.parse(cannedResponse),
    };

    const results = await onDocumentDiagnostic({
      document,
      filterForMissingKeys,
      sdk: sdk as unknown as SDK,
      log,
    });

    expect(results).toStrictEqual({
      kind: "full",

      items: [
        {
          message: "`api-rate-limit-per-user` is not defined.",
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
          message:
            "`everyone.is.pro` is not a defined feature flag. This will always return false.",
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
          message:
            "`hat.enabled` is not a defined feature flag. This will always return false.",
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
      ],
    });
  });

  it("returns nothing if the content has no missing config/flags", async () => {
    // We'll consider everything missing except for the api.enabled flag
    const filterForMissingKeys = async (methods: MethodLocation[]) => {
      return methods.filter((method) => {
        return method.key !== "api.enabled";
      });
    };

    const document = mkDocument({
      uri,
      text: "",
      languageId: "ruby",
    });

    const sdk = {
      detectMethods: () => [],
    };

    const results = await onDocumentDiagnostic({
      document,
      filterForMissingKeys,
      sdk: sdk as unknown as SDK,
      log,
    });

    expect(results).toStrictEqual({
      items: [],
      kind: "full",
    });
  });
});
