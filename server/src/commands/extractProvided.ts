import { TextEdit } from "vscode-languageserver/node";

import { post as defaultPost } from "../apiClient";
import {
  allKeys as defaultAllKeys,
  getProjectEnvFromApiKey,
  suggestKey,
} from "../prefab";
import type {
  ExecutableCommand,
  ExecutableCommandExecuteArgs,
  KeyLocation,
} from "../types";
import { getInput } from "../ui/getInput";

type Dependencies = {
  post?: typeof defaultPost;
  allKeys?: typeof defaultAllKeys;
};

type Args = ExecutableCommandExecuteArgs & Dependencies;

const command = "prefab.extractProvided";

const extractProvided: ExecutableCommand<Args> = {
  command,

  execute: async (args: Args) => {
    const { settings, log, document, connection, clientContext, params } = args;

    log("Command", { extractProvided: params });

    if (!params.arguments) {
      log.error("Command", { extractProvided: "No arguments provided" });
      return;
    }

    const keyLocation = params.arguments[1] as KeyLocation;

    const envVarName = keyLocation.key.slice(1, -1); // remove surrounding quotes

    const suggestedKey = suggestKey(envVarName);

    const confidential = params.arguments[2]?.confidential;

    const key = await getInput({
      connection,
      title: "Enter your new config name",
      defaultValue: suggestedKey,
    });

    if (!key) {
      return;
    }

    const { projectId } = getProjectEnvFromApiKey(settings.apiKey);

    const value: {
      provided: { lookup: string; source: string };
      confidential?: boolean;
    } = { provided: { lookup: envVarName, source: "ENV_VAR" } };

    if (confidential) {
      value.confidential = true;
    }

    const payload = {
      key,
      configType: "CONFIG",
      projectId,
      rows: [{ values: [{ value }] }],
    };

    const post = args.post ?? defaultPost;

    const request = await post({
      settings,
      requestPath: "/api/v1/config/",
      payload,
      log,
      clientContext,
    });

    if (request.status !== 200) {
      connection.window.showErrorMessage(
        `Prefab: Failed to extract provided: ${request.status} ${request.statusText}`
      );
      return;
    }

    const edit: TextEdit = {
      range: keyLocation.range,
      newText: document.sdk.configGet(key),
    };

    connection.sendRequest("workspace/applyEdit", {
      edit: {
        changes: { [document.uri]: [edit] },
      },
    });
  },
};

export default extractProvided;
