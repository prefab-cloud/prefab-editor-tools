import * as fs from "fs";
import * as path from "path";

import { Client } from "./prefab-common/src/api/client";
import type { ClientContext, Logger, Settings } from "./types";

const VS_EXTENSION_PATH = path.join(__dirname, "../../package.json");
const STANDALONE_EXTENSION_PATH = path.join(__dirname, "../package.json");

const readVersion = (path: string) => {
  return JSON.parse(fs.readFileSync(path, "utf-8"))["version"];
};

const version = fs.existsSync(VS_EXTENSION_PATH)
  ? readVersion(VS_EXTENSION_PATH)
  : readVersion(STANDALONE_EXTENSION_PATH);

export const editorIdentifier = (clientContext: ClientContext) => {
  return `${clientContext.editorIdentifier}-${version}`;
};

let apiClient: Client;

export const updateApiClient = ({
  settings,
  log,
  clientContext,
}: {
  settings: Settings;
  log: Logger;
  clientContext: ClientContext;
}) => {
  apiClient = new Client({
    apiUrl: settings.apiUrl,
    apiKey: settings.apiKey,
    clientIdentifier: editorIdentifier(clientContext),
    log,
  });
};

export const get = async (requestPath: string) => {
  return apiClient.get(requestPath);
};

export const post = async (requestPath: string, payload: unknown) => {
  return apiClient.post(requestPath, payload);
};

export { Client, apiClient };
