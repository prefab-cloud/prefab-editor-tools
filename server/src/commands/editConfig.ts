import { post } from "../apiClient";
import {
  type ConfigValue,
  type PrefabConfig,
  valueToConfigValue,
} from "../prefab";
import type {
  ExecutableCommand,
  ExecutableCommandExecuteArgs,
  RetryableError,
} from "../types";
import { isRetryableError, isUnretryableError } from "../types";
import { environmentBasedPicker } from "../ui/environmentBasedPicker";
import { getInput } from "../ui/getInput";
import extractKey from "./extractKey";

const localFormatter = (projectEnvName: string, value: string) =>
  `${projectEnvName}: ${value}`;
const remoteFormatter = (projectEnvName: string) =>
  `Edit ${projectEnvName} on prefab.cloud`;

const editConfig: ExecutableCommand<ExecutableCommandExecuteArgs> = {
  command: "prefab.editConfig",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { clientContext, connection, log, params, refresh, settings } = args;

    log("Command", { editConfig: params });

    const key = extractKey(params.arguments);

    const choice = await environmentBasedPicker({
      loggerName: "editConfig",
      title: `Edit ${key} in environment`,
      localFormatter,
      remoteFormatter,
      log,
      settings,
      clientContext,
      key,
      connection,
    });

    if (!choice || !choice.config) {
      log("Command", `editConfig cancelled`);
      return;
    }

    const config = choice.config;

    const value = await prompt({
      config,
      connection,
      key,
      log,
      projectEnvName: choice.projectEnvName,
    });

    if (!value) {
      log("Command", `editConfig cancelled`);
      return;
    }

    const payload = {
      configKey: key,
      value,
      environmentId: choice.projectEnvId,
      currentVersionId: config.id.toString(),
    };

    const requestPath = "/api/v1/config/set-default/";

    const setResponse = await post(requestPath, payload);

    if (setResponse.status !== 200) {
      connection.window.showErrorMessage("Failed to edit config.");

      const text = await setResponse.text();

      connection.console.error(
        `Prefab: Failed to set default: ${setResponse.status} | ${text}`
      );
      return;
    }

    await refresh();
  },
};

const prompt = async ({
  config,
  connection,
  key,
  log,
  projectEnvName,
  error,
}: {
  config: PrefabConfig;
  connection: ExecutableCommandExecuteArgs["connection"];
  key: string;
  log: ExecutableCommandExecuteArgs["log"];
  projectEnvName: string;
  error?: RetryableError;
}): Promise<ConfigValue | undefined> => {
  let title = `Enter the new value for ${key} in ${projectEnvName}`;
  if (error) {
    title = `${error.message}. ${title}`;
  }

  const rawValue = await getInput({
    title,
    connection,
  });

  if (!rawValue) {
    return;
  }

  log("Command", { editConfig: rawValue });

  const value = valueToConfigValue(rawValue, config);

  if (isUnretryableError(value)) {
    connection.window.showErrorMessage(value.message);
    return;
  }

  if (isRetryableError(value)) {
    return await prompt({
      config,
      connection,
      key,
      log,
      projectEnvName,
      error: value,
    });
  }

  return value;
};

export default editConfig;
