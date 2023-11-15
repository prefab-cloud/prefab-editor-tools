import { post } from "../apiClient";
import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { environmentBasedPicker } from "../ui/environmentBasedPicker";
import extractKey from "./extractKey";

const localFormatter = (projectEnvName: string, value: string) =>
  `${projectEnvName}: Set ${value === "true" ? "false" : "true"}`;
const remoteFormatter = (projectEnvName: string) =>
  `Edit ${projectEnvName} on prefab.cloud`;

const toggleFlag: ExecutableCommand<ExecutableCommandExecuteArgs> = {
  command: "prefab.toggleFlag",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { clientContext, connection, log, params, refresh, settings } = args;

    log("Command", { toggle: params });

    const key = extractKey(params.arguments);

    const choice = await environmentBasedPicker({
      loggerName: "toggle",
      title: `Toggle ${key} in environment`,
      localFormatter,
      remoteFormatter,
      log,
      settings,
      clientContext,
      key,
      connection,
    });

    if (!choice) {
      log("Command", `editConfig cancelled`);
      return;
    }

    const payload = {
      configKey: key,
      value: { bool: !choice.currentValue },
      environmentId: choice.projectEnvId,
      currentVersionId: choice.config.id.toString(),
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

export default toggleFlag;
