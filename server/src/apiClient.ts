import type { Logger, Settings } from "./types";
import fetch from "node-fetch";
import * as path from "path";
import { apiUrlOrDefault } from "./settings";

const uriAndHeaders = ({
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
    // TODO: add version here
    "X-PrefabCloud-Client-Version": `prefab-lsp`,
  };

  const uri = path.join(apiUrlOrDefault(settings), requestPath);

  return { uri, headers };
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
