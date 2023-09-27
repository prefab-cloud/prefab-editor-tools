import { Connection } from "vscode-languageserver/node";
import { prefabInit } from "./prefabClient";

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

const getSettings = async (connection: Connection) => {
  const newSettings = await connection.workspace.getConfiguration("prefab");

  updateSettings(connection, newSettings);
};

const updateSettings = (
  connection: Connection,
  newSettings: Partial<Settings>
) => {
  if ((!newSettings || !newSettings.apiKey) && !settings.apiKey) {
    warnAboutMissingApiKey(connection);
  }

  if (!newSettings) {
    return;
  }

  if (settings.apiKey !== newSettings.apiKey) {
    if (newSettings.apiKey) {
      // TODO: respond to updates on Prefab's internal settings (SSE)
      prefabInit({ apiKey: newSettings.apiKey, apiUrl: newSettings.apiUrl });
    }
  }

  settings = newSettings;

  return settings;
};

export { settings, getSettings, updateSettings };
