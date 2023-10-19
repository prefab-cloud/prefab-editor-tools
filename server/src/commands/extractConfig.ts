import { Range, TextEdit } from "vscode-languageserver/node";
import {
  CustomHandler,
  type ExecutableCommand,
  type ExecutableCommandExecuteArgs,
  type GetInputResponse,
} from "../types";
import { post as defaultPost } from "../apiClient";
import {
  getProjectEnvFromApiKey,
  allKeys as defaultAllKeys,
} from "../prefabClient";

type Dependencies = {
  post?: typeof defaultPost;
  allKeys?: typeof defaultAllKeys;
};

type Args = ExecutableCommandExecuteArgs & Dependencies;

const command = "prefab.extractConfig";

const extractConfig: ExecutableCommand<Args> = {
  command,

  execute: async (args: Args) => {
    const {
      clientContext,
      connection,
      document,
      log,
      params,
      refresh,
      settings,
    } = args;

    log("Command", `extractConfig: ${JSON.stringify(params)}`);

    if (!document.sdk.configGet) {
      connection.window.showErrorMessage(
        `Prefab: Unexpected error. ${document.uri} is not supported for extractConfig.`
      );
      return;
    }

    const result: GetInputResponse = await connection.sendRequest(
      CustomHandler.getInput,
      { title: "Enter the config name" }
    );

    const key = (result?.input ?? "").trim();

    if (key) {
      const allKeys = await (args.allKeys ?? defaultAllKeys)();

      if (allKeys.includes(key)) {
        connection.window.showErrorMessage(`Prefab: ${key} already exists`);
        return;
      }

      const [uri, value, range] = params.arguments as [string, string, Range];

      const post = args.post ?? defaultPost;

      const { projectId } = getProjectEnvFromApiKey(settings.apiKey);

      const withoutQuotes = value.slice(1, -1);

      const payload = {
        key,
        configType: "CONFIG",
        projectId,
        rows: [{ values: [{ value: { string: withoutQuotes } }] }],
      };

      const request = await post({
        settings,
        requestPath: "/api/v1/config/",
        payload,
        log,
        clientContext,
      });

      if (request.status !== 200) {
        connection.window.showErrorMessage(
          `Prefab: Failed to extract config: ${request.status} ${request.statusText}`
        );
        return;
      }

      const edit: TextEdit = {
        range,
        newText: document.sdk.configGet(key),
      };

      connection.sendRequest("workspace/applyEdit", {
        edit: {
          changes: { [uri]: [edit] },
        },
      });
    }

    await refresh();
  },
};

export default extractConfig;
