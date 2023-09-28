import { Connection } from "vscode-languageserver/node";
import { prefabInit } from "./prefabClient";
import { type Logger } from "./types";

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

export interface Settings {
  apiKey?: string;
  apiUrl?: string;
}

let settings: Settings = {};

const getSettings = async (connection: Connection, log: Logger) => {
  const newSettings = await connection.workspace.getConfiguration("prefab");

  updateSettings(connection, newSettings, log);
};

const updateSettings = (
  connection: Connection,
  newSettings: Partial<Settings>,
  log: Logger
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
      });
    }
  }

  settings = newSettings;

  return settings;
};

export { settings, getSettings, updateSettings };
