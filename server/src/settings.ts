import * as fs from "fs";
import * as path from "path";
import { Connection } from "vscode-languageserver/node";

import { getProjectEnvFromApiKey, prefabInit } from "./prefab";
import { type Logger, type Settings } from "./types";

let lastApiKeyWarning = 0;

const warnAboutMissingApiKey = (connection: Connection) => {
  const now = Date.now();

  if (now - lastApiKeyWarning > 1000 * 60 * 5) {
    lastApiKeyWarning = now;

    connection.window.showWarningMessage(
      "Prefab: No API key set. Please set your API key in the Prefab extension settings.",
    );
  }
};

let settings: Settings = {};

const SUPPORTED_FILES = [".env", ".envrc", ".env.local"];

const getSettings = async (
  connection: Connection,
  log: Logger,
  refresh: () => Promise<void>,
  refreshApiClient: () => void,
) => {
  if (process.env.SKIP_SETTINGS === undefined) {
    const workspaceFolders = await connection.workspace.getWorkspaceFolders();

    let apiKey: string | undefined = undefined;
    const envVars: Settings["envVars"] = {};

    workspaceFolders?.forEach((folder) => {
      SUPPORTED_FILES.forEach((file) => {
        if (folder.uri.startsWith("file://") && !apiKey) {
          const envFile = path.join(folder.uri.split("file://")[1], file);
          if (fs.existsSync(envFile)) {
            fs.readFileSync(envFile, "utf8")
              .split("\n")
              .forEach((line) => {
                if (/^(EXPORT )?PREFAB_API_KEY=/.test(line)) {
                  apiKey = line.split("PREFAB_API_KEY=")[1];

                  log(
                    "Settings",
                    `Pulled API key from ${file} file ${envFile}`,
                  );
                } else {
                  const match = line.match(/^([^=]+)=(.*)$/);
                  if (match) {
                    envVars[match[1]] = match[2];
                  }
                }
              });
          }
        }
      });
    });
    const newSettings = await connection.workspace.getConfiguration("prefab");

    if (apiKey) {
      newSettings.apiKey = apiKey;
    } else {
      log("Settings", "Using API key from settings");
    }

    log("Settings", newSettings);

    newSettings.envVars = envVars;

    updateSettings(connection, newSettings, log, refresh, refreshApiClient);
  } else {
    if (process.env.PREFAB_API_KEY) {
      updateSettings(
        connection,
        { apiKey: process.env.PREFAB_API_KEY },
        log,
        refresh,
        refreshApiClient,
      );
    }
  }
};

const updateSettings = (
  connection: Connection,
  newSettings: Partial<Settings>,
  log: Logger,
  refresh: () => Promise<void>,
  refreshApiClient: () => void,
) => {
  if ((!newSettings || !newSettings.apiKey) && !settings.apiKey) {
    connection.console.error("No API key set. Please update your settings.");
    warnAboutMissingApiKey(connection);
  }

  if (!newSettings) {
    return;
  }

  if (settings.apiKey !== newSettings.apiKey) {
    settings = newSettings;

    refreshApiClient();

    if (newSettings.apiKey) {
      log("Settings", "Initializing internal Prefab client");

      // validate the apiKey. TODO: this might as well set the project and env in Settings
      getProjectEnvFromApiKey(newSettings.apiKey);

      prefabInit({
        apiKey: newSettings.apiKey,
        apiUrl: newSettings.apiUrl,
        log,
        connection,
        onUpdate: () => {
          log("Settings", "Internal Prefab client updated");
          refresh();
        },
      });
    }
  } else {
    settings = newSettings;
  }

  return settings;
};

const DEFAULT_API_URL = "https://api.prefab.cloud";

const apiUrlOrDefault = (settings: Settings) => {
  return settings.apiUrl ?? DEFAULT_API_URL;
};

export { settings, getSettings, updateSettings, apiUrlOrDefault };
