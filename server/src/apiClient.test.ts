import { describe, expect, it } from "bun:test";
import * as fs from "fs";
import * as path from "path";

import { uriAndHeaders } from "./apiClient";
import { ClientContext } from "./types";

const version: string = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../package.json"), "utf-8")
)["version"];

const clientContext = {
  editorIdentifier: "neovim",
} as ClientContext;

describe("apiClient", () => {
  describe("uriAndHeaders", () => {
    it("generates headers based on the version and api key", () => {
      const { headers } = uriAndHeaders({
        settings: {
          apiKey: "abcdefg",
        },
        requestPath: "foo",
        clientContext,
      });

      expect(headers).toStrictEqual({
        Accept: "application/json",
        Authorization: "Basic YXV0aHVzZXI6YWJjZGVmZw==",
        "Content-Type": "application/json",
        "X-PrefabCloud-Client-Version": `prefab-lsp-${clientContext.editorIdentifier}-${version}`,
      });
    });

    it("can return a prod uri", () => {
      const { uri } = uriAndHeaders({
        settings: {
          apiKey: "abcdefg",
        },
        requestPath: "foo",
        clientContext,
      });

      expect(uri).toBe("https://api.prefab.cloud/foo");
    });

    it("doesn't duplicate slashes if the path starts with a slash", () => {
      const { uri } = uriAndHeaders({
        settings: {
          apiKey: "abcdefg",
        },
        requestPath: "/foo",
        clientContext,
      });

      expect(uri).toBe("https://api.prefab.cloud/foo");
    });

    it("can return a staging uri", () => {
      const { uri } = uriAndHeaders({
        settings: {
          apiKey: "abcdefg",
          apiUrl: "https://api.staging-prefab.cloud",
        },
        requestPath: "foo",
        clientContext,
      });

      expect(uri).toBe("https://api.staging-prefab.cloud/foo");
    });
  });
});
