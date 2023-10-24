import { describe, expect, it, mock } from "bun:test";
import { type Connection } from "vscode-languageserver/node";

import { log, mkAnnotatedDocument, mockRequest } from "../testHelpers";
import { ClientContext } from "../types";
import createFlag from "./createFlag";

const documentUri = "file://does/not/matter";
const apiKey = "123-P2-E9-SDK-api-key-1234";

const clientContext = {} as ClientContext;

describe("createFlag", () => {
  it("can open a browser to create a boolean flag", async () => {
    const key = "boolean.flag";

    const post = mockRequest([
      {
        json: {
          id: 0,
          projectId: "2",
          key: "boolean.flag",
          changedBy: { userId: 4, email: "", apiKeyId: "290" },
          rows: [
            { projectEnvId: 134, values: [{ value: { bool: false } }] },
            { projectEnvId: 105, values: [{ value: { bool: false } }] },
          ],
          allowableValues: [{ bool: true }, { bool: false }],
          configType: "FEATURE_FLAG",
        },
        status: 200,
      },
      { json: {}, status: 200 },
    ]);

    const document = mkAnnotatedDocument({});

    const refresh = mock(async () => {});

    const connection: Connection = mock(() => {}) as unknown as Connection;

    await createFlag.execute({
      connection,
      document,
      log,
      settings: { apiKey },
      params: { command: "createFlag", arguments: [documentUri, key] },
      post,
      refresh,
      clientContext,
    });

    expect(post).toHaveBeenCalledTimes(2);

    expect(post.mock.calls[0]).toStrictEqual([
      {
        log,
        clientContext,
        settings: {
          apiKey: "123-P2-E9-SDK-api-key-1234",
        },
        requestPath: "/api/v1/config-recipes/feature-flag/boolean",
        payload: {
          key: "boolean.flag",
          defaultValue: false,
        },
      },
    ]);

    expect(post.mock.calls[1]).toStrictEqual([
      {
        log,
        clientContext,
        payload: {
          key,
          id: 0,
          configType: "FEATURE_FLAG",
          projectId: "2",
          rows: [
            { projectEnvId: 134, values: [{ value: { bool: false } }] },
            { projectEnvId: 105, values: [{ value: { bool: false } }] },
          ],
          changedBy: { userId: 4, email: "", apiKeyId: "290" },
          allowableValues: [{ bool: true }, { bool: false }],
        },
        requestPath: "/api/v1/config/",
        settings: { apiKey },
      },
    ]);

    expect(refresh).toHaveBeenCalled();
  });
});
