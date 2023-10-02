import { Connection } from "vscode-languageserver/node";
import { prefabInit } from "./prefabClient";
import { type Logger, type Settings } from "./types";

let lastApiKeyWarning = 0;

const warnAboutMissingApiKey = (connection: Connection) => {
  const now = Date.now();

  if (now - lastApiKeyWarning > 1000 * 60 * 5) {
    lastApiKeyWarning = now;

    connection.window.showWarningMessage(
      "Prefab: No API key set. Please set your API key in the Prefab extension settings."
    );
  }
};

let settings: Settings = {};

const getSettings = async (
  connection: Connection,
  log: Logger,
  refresh: () => Promise<void>
) => {
  const newSettings = await connection.workspace.getConfiguration("prefab");

  updateSettings(connection, newSettings, log, refresh);
};

const updateSettings = (
  connection: Connection,
  newSettings: Partial<Settings>,
  log: Logger,
  refresh: () => Promise<void>
) => {
  if ((!newSettings || !newSettings.apiKey) && !settings.apiKey) {
    connection.console.error(
      "No API key set. Please update your configuration."
    );
    warnAboutMissingApiKey(connection);
  }

  if (!newSettings) {
    return;
  }

  if (settings.apiKey !== newSettings.apiKey) {
    if (newSettings.apiKey) {
      log("Initializing internal Prefab client");
      // TODO: respond to updates on Prefab's internal settings (SSE)
      prefabInit({
        apiKey: newSettings.apiKey,
        apiUrl: newSettings.apiUrl,
        log,
        onUpdate: () => {
          log("Internal Prefab client updated");
          refresh();
        },
      });
    }
  }

  settings = newSettings;

  return settings;
};

const DEFAULT_API_URL = "https://api.prefab.cloud";

const apiUrlOrDefault = (settings: Settings) => {
  return settings.apiUrl ?? DEFAULT_API_URL;
};

export { settings, getSettings, updateSettings, apiUrlOrDefault };
