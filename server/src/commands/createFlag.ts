import openURL from "../utils/openURL";
import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { post } from "../apiClient";
import { runAllDiagnostics } from "../diagnostics";
import { getProjectEnvFromApiKey } from "../prefabClient";
import extractKey from "./extractKey";

const BOOL_DEFAULT = "Create boolean flag";
const CUSTOM_FLAG = "Create flag with custom variants";

const createBooleanFlag = async ({
  connection,
  settings,
  key,
  log,
  sdk,
  document,
  refreshDiagnostics,
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

  log(`Prefab: Created boolean flag ${payload.key}`);

  const { diagnostics } = await runAllDiagnostics({
    log,
    sdk,
    document,
    exclude: [key],
  });

  await connection.sendDiagnostics({
    uri: document.uri,
    diagnostics,
  });

  refreshDiagnostics();

  log({ uri: document.uri, updatedDiagnostics: diagnostics });
};

const customFlag = ({
  key,
  settings,
  log,
}: ExecutableCommandExecuteArgs & { key: string }) => {
  const projectEnv = getProjectEnvFromApiKey(settings.apiKey);

  openURL({
    url: `https://app.prefab.cloud/account/projects/${
      projectEnv.projectId
    }/flags/new?key=${encodeURIComponent(key)}`,

    log,
  });
};

const createFlag: ExecutableCommand = {
  command: "prefab.createFlag",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { connection, params, settings, log } = args;

    log({ createFlag: params, settings });

    const key = extractKey(params.arguments);

    const result = await connection.window.showInformationMessage(
      `Create ${key} flag`,
      { title: BOOL_DEFAULT },
      { title: CUSTOM_FLAG }
    );

    if (result?.title === BOOL_DEFAULT) {
      return await createBooleanFlag({
        ...args,
        key,
      });
    }

    if (result?.title === CUSTOM_FLAG) {
      return customFlag({
        ...args,
        key,
      });
    }

    return null;
  },
};

export default createFlag;
