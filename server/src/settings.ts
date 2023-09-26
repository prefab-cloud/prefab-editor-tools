import { Connection } from "vscode-languageserver/node";
import { prefabInit } from "./prefabClient";

export interface Settings {
  apiKey?: string;
  apiUrl?: string;
}

let settings: Settings = {};

const getSettings = async (connection: Connection) => {
  const newSettings = await connection.workspace.getConfiguration("prefab");

  updateSettings(newSettings);
};

const updateSettings = (newSettings: Partial<Settings>) => {
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
