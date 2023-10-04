import { Connection } from "vscode-languageserver/node";
import { prefabInit } from "./prefabClient";
import { type Logger, type Settings } from "./types";

import * as fs from "fs";
import * as path from "path";

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
  const workspaceFolders = await connection.workspace.getWorkspaceFolders();

  let apiKey: string | undefined = undefined;

  log("Lifecyle", { getSettings: { workspaceFolders } });

  workspaceFolders?.forEach((folder) => {
    if (folder.uri.startsWith("file://") && !apiKey) {
      const envFile = path.join(folder.uri.split("file://")[1], `.env`);
      if (fs.existsSync(envFile)) {
        fs.readFileSync(envFile, "utf8")
          .split("\n")
          .forEach((line) => {
            if (line.startsWith("PREFAB_API_KEY=")) {
              apiKey = line.split("PREFAB_API_KEY=")[1];

              log("Settings", `Pulled API key from .env file ${envFile}`);
            }
          });
      }
    }
  });

  const newSettings = await connection.workspace.getConfiguration("prefab");

  if (apiKey) {
    newSettings.apiKey = apiKey;
  } else {
    log("Settings", "Using API key from settings");
  }

  updateSettings(connection, newSettings, log, refresh);
};

const updateSettings = (
  connection: Connection,
  newSettings: Partial<Settings>,
  log: Logger,
  refresh: () => Promise<void>
) => {
  if ((!newSettings || !newSettings.apiKey) && !settings.apiKey) {
    connection.console.error("No API key set. Please update your settings.");
    warnAboutMissingApiKey(connection);
  }

  if (!newSettings) {
    return;
  }

  if (settings.apiKey !== newSettings.apiKey) {
    if (newSettings.apiKey) {
      log("Settings", "Initializing internal Prefab client");
      // TODO: respond to updates on Prefab's internal settings (SSE)
      prefabInit({
        apiKey: newSettings.apiKey,
        apiUrl: newSettings.apiUrl,
        log,
        onUpdate: () => {
          log("Settings", "Internal Prefab client updated");
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
