import * as fs from "fs";
import * as path from "path";
import { URL } from "url";
import type { ClientContext, Logger, Settings } from "./types";
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
  clientContext,
}: {
  settings: Settings;
  requestPath: string;
  clientContext: ClientContext;
}) => {
  if (!settings.apiKey) {
    throw new Error("No API key set. Please update your configuration.");
  }

  const token = Buffer.from(`authuser:${settings.apiKey}`).toString("base64");

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Basic ${token}`,
    "X-PrefabCloud-Client-Version": `prefab-lsp-${clientContext.editorIdentifier}-${version}`,
  };

  const uri = new URL(apiUrlOrDefault(settings));
  uri.pathname = requestPath;

  return { uri: uri.toString(), headers };
};

type Request = {
  settings: Settings;
  requestPath: string;
  log: Logger;
  clientContext: ClientContext;
};

export const get = async ({
  settings,
  requestPath,
  log,
  clientContext,
}: Request) => {
  const { uri, headers } = uriAndHeaders({
    settings,
    requestPath,
    clientContext,
  });

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
  clientContext,
}: Request & { payload: unknown }) => {
  const { uri, headers } = uriAndHeaders({
    settings,
    requestPath,
    clientContext,
  });

  log("ApiClient", { POST: { uri, payload } });

  return fetch(uri, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
};
