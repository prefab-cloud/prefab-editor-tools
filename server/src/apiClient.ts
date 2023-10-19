import * as fs from "fs";
import * as path from "path";
import { URL } from "url";
import type { Logger, Settings } from "./types";
import { apiUrlOrDefault } from "./settings";

const VS_EXTENSION_PATH = path.join(__dirname, "../../package.json");
const STANDALONE_EXTENSION_PATH = path.join(__dirname, "../package.json");

const readVersion = (path: string) => {
  return JSON.parse(fs.readFileSync(path, "utf-8"))["version"];
};

const version = fs.existsSync(VS_EXTENSION_PATH)
  ? readVersion(VS_EXTENSION_PATH)
  : readVersion(STANDALONE_EXTENSION_PATH);

export const uriAndHeaders = ({
  settings,
  requestPath,
}: {
  settings: Settings;
  requestPath: string;
}) => {
  if (!settings.apiKey) {
    throw new Error("No API key set. Please update your configuration.");
  }

  const token = Buffer.from(`authuser:${settings.apiKey}`).toString("base64");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Basic ${token}`,
    "X-PrefabCloud-Client-Version": `prefab-lsp-${version}`,
  };

  const uri = new URL(apiUrlOrDefault(settings));
  uri.pathname = requestPath;

  return { uri: uri.toString(), headers };
};

type Request = {
  settings: Settings;
  requestPath: string;
  log: Logger;
};

export const get = async ({ settings, requestPath, log }: Request) => {
  const { uri, headers } = uriAndHeaders({ settings, requestPath });

  log("ApiClient", { GET: { uri } });

  return fetch(uri, {
    method: "GET",
    headers,
  });
};

export const post = async ({
  settings,
  requestPath,
  payload,
  log,
}: Request & { payload: unknown }) => {
  const { uri, headers } = uriAndHeaders({ settings, requestPath });

  log("ApiClient", { POST: { uri, payload } });

  return fetch(uri, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
};
