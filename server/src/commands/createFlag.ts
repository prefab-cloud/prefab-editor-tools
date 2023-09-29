import { Connection, ExecuteCommandParams } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";

import openURL from "../utils/openURL";
import type { ExecutableCommand, Logger, Settings } from "../types";
import { post } from "../apiClient";
import { runAllDiagnostics } from "../diagnostics";
import { getProjectEnvFromApiKey } from "../prefabClient";

import { SDK } from "../sdks/detection";

const BOOL_DEFAULT = "Create boolean flag";
const CUSTOM_FLAG = "Create flag with custom variants";

const createBooleanFlag = async ({
  connection,
  settings,
  apiKey,
  key,
  log,
  sdk,
  document,
}: {
  connection: Connection;
  settings: Settings;
  apiKey: string;
  key: string;
  log: Logger;
  sdk: SDK;
  document: TextDocument;
}) => {
  const projectEnv = getProjectEnvFromApiKey(apiKey);

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

  connection.sendRequest("workspace/codeLens/refresh");

  log({ uri: document.uri, updatedDiagnostics: diagnostics });
};

const customFlag = ({
  key,
  apiKey,
  log,
}: {
  key: string;
  apiKey: string;
  log: Logger;
}) => {
  const projectEnv = getProjectEnvFromApiKey(apiKey);

  openURL({
    url: `https://app.prefab.cloud/account/projects/${
      projectEnv.projectId
    }/flags/new?key=${encodeURIComponent(key)}`,

    log,
  });
};

const createFlag: ExecutableCommand = {
  command: "prefab.createFlag",
  execute: async ({
    connection,
    document,
    sdk,
    params,
    settings,
    log,
  }: {
    connection: Connection;
    document: TextDocument;
    sdk: SDK;
    params: ExecuteCommandParams;
    settings: Settings;
    log: Logger;
  }) => {
    log({ createFlag: params, settings });

    if (!settings.apiKey) {
      connection.console.error(
        "No API key set. Please update your configuration."
      );
      return;
    }

    if (!params.arguments || params.arguments.length < 1) {
      connection.console.error("Prefab: Please provide a key for your flag.");
      return;
    }

    const key = params.arguments[1];

    const result = await connection.window.showInformationMessage(
      `Create ${key} flag`,
      { title: BOOL_DEFAULT },
      { title: CUSTOM_FLAG }
    );

    if (result?.title === BOOL_DEFAULT) {
      return await createBooleanFlag({
        sdk,
        document,
        settings,
        apiKey: settings.apiKey,
        key,
        log,
        connection,
      });
    }

    if (result?.title === CUSTOM_FLAG) {
      return customFlag({ key, apiKey: settings.apiKey, log });
    }

    return null;
  },
};

export default createFlag;
