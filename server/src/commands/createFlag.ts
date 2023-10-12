import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { post } from "../apiClient";
import { runAllDiagnostics } from "../diagnostics";
import { getProjectEnvFromApiKey } from "../prefabClient";
import extractKey from "./extractKey";

const createBooleanFlag = async ({
  connection,
  settings,
  key,
  log,
  document,
  refresh,
}: ExecutableCommandExecuteArgs & { key: string }) => {
  const projectEnv = getProjectEnvFromApiKey(settings.apiKey);

  const payload = {
    key,
    configType: "FEATURE_FLAG",
    projectId: projectEnv.projectId,
    rows: [{ projectEnvId: projectEnv.id, values: [] }],
    allowableValues: [{ bool: true }, { bool: false }],
  };

  const request = await post({
    settings,
    requestPath: "/api/v1/config/",
    payload,
    log,
  });

  if (request.status !== 200) {
    connection.console.error(
      `Prefab: Failed to create boolean flag: ${request.status}`
    );
    return;
  }

  log("Command", `Prefab: Created boolean flag ${payload.key}`);

  const { diagnostics } = await runAllDiagnostics({
    log,
    document,
    exclude: [key],
  });

  await connection.sendDiagnostics({
    uri: document.uri,
    diagnostics,
  });

  refresh();

  log("Command", { uri: document.uri, updatedDiagnostics: diagnostics });
};

const createFlag: ExecutableCommand = {
  command: "prefab.createFlag",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { params, settings, log } = args;

    log("Command", { createFlag: params, settings });

    const key = extractKey(params.arguments);

    return await createBooleanFlag({
      ...args,
      key,
    });
  },
};

export default createFlag;
