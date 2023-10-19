import { expect, it, describe, mock } from "bun:test";

import { type Connection } from "vscode-languageserver/node";
import { ClientContext, CustomHandler } from "../types";
import { mkAnnotatedDocument, mockRequest, log } from "../testHelpers";
import RubySDK from "../sdks/ruby";

import extractConfig from "./extractConfig";

const documentUri = "file://does/not/matter";
const apiKey = "123-P2-E9-SDK-api-key-1234";

const range = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const params = {
  command: "prefab.extractConfig",
  arguments: [documentUri, '"some text here"', range],
};

const allKeys = mock(async () => []);

const document = mkAnnotatedDocument({
  sdk: RubySDK,
});

const clientContext = {} as ClientContext;

describe("extractConfig", () => {
  it("replaces the string with a prefab call after creating the config", async () => {
    const post = mockRequest({ json: {}, status: 200 });
    const refresh = mock(async () => {});

    const sendRequestMock = mock(() => {
      return {
        input: "some.key",
      };
    });

    const connection = {
      sendRequest: sendRequestMock,
    } as unknown as Connection;

    await extractConfig.execute({
      allKeys,
      document,
      connection,
      log,
      params,
      refresh,
      settings: { apiKey },
      post,
      clientContext,
    });

    expect(sendRequestMock).toHaveBeenCalledTimes(2);
    expect(sendRequestMock.mock.calls[0]).toStrictEqual([
      CustomHandler.getInput,
      { title: "Enter the config name" },
    ]);
    expect(sendRequestMock.mock.calls[1]).toStrictEqual([
      "workspace/applyEdit",
      {
        edit: {
          changes: {
            "file://does/not/matter": [
              {
                range,
                newText: '$prefab.get("some.key")',
              },
            ],
          },
        },
      },
    ]);

    expect(post).toHaveBeenCalledTimes(1);
    expect(post.mock.calls[0]).toStrictEqual([
      {
        log,
        clientContext,
        payload: {
          configType: "CONFIG",
          key: "some.key",
          projectId: "2",
          rows: [{ values: [{ value: { string: "some text here" } }] }],
        },
        requestPath: "/api/v1/config/",
        settings: { apiKey },
      },
    ]);

    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("cancels if there's no user input", async () => {
    const sendRequestMock = mock(() => {
      return undefined;
    });

    const connection = {
      sendRequest: sendRequestMock,
    } as unknown as Connection;

    await extractConfig.execute({
      document,
      connection,
      log,
      params,
      refresh: async () => {},
      settings: { apiKey },
      clientContext,
    });

    expect(sendRequestMock).toHaveBeenCalledTimes(1);
    expect(sendRequestMock.mock.calls[0]).toStrictEqual([
      CustomHandler.getInput,
      { title: "Enter the config name" },
    ]);
  });

  it("cancels if the key conflicts", async () => {
    const post = mock(async (): Promise<Response> => {
      return {} as Response;
    });

    const sendRequestMock = mock(() => {
      return {
        input: "some.key",
      };
    });

    const errorMessageMock = mock(() => {});

    const connection = {
      sendRequest: sendRequestMock,
      window: {
        showErrorMessage: errorMessageMock,
      },
    } as unknown as Connection;

    await extractConfig.execute({
      allKeys: async () => ["some.key", "some.other.key"],
      document,
      connection,
      log,
      params,
      refresh: async () => {},
      settings: { apiKey },
      post,
      clientContext: {} as ClientContext,
    });

    expect(sendRequestMock).toHaveBeenCalledTimes(1);
    expect(sendRequestMock.mock.calls[0]).toStrictEqual([
      CustomHandler.getInput,
      { title: "Enter the config name" },
    ]);

    expect(errorMessageMock).toHaveBeenCalledTimes(1);
    expect(errorMessageMock.mock.calls[0]).toStrictEqual([
      "Prefab: some.key already exists",
    ]);

    expect(post).not.toHaveBeenCalled();
  });

  it("does not replace the string if the config creation request fails", async () => {
    const post = mockRequest({
      json: {},
      status: 400,
      statusText: "Invalid request",
    });

    const sendRequestMock = mock(() => {
      return {
        input: "some.key",
      };
    });

    const errorMessageMock = mock(() => {});

    const connection = {
      sendRequest: sendRequestMock,
      window: {
        showErrorMessage: errorMessageMock,
      },
    } as unknown as Connection;

    await extractConfig.execute({
      allKeys,
      document,
      connection,
      log,
      params,
      refresh: async () => {},
      settings: { apiKey },
      post,
      clientContext: {} as ClientContext,
    });

    expect(sendRequestMock).toHaveBeenCalledTimes(1);
    expect(sendRequestMock.mock.calls[0]).toStrictEqual([
      CustomHandler.getInput,
      { title: "Enter the config name" },
    ]);

    expect(errorMessageMock).toHaveBeenCalledTimes(1);
    expect(errorMessageMock.mock.calls[0]).toStrictEqual([
      "Prefab: Failed to extract config: 400 Invalid request",
    ]);

    expect(post).toHaveBeenCalledTimes(1);
  });
});
