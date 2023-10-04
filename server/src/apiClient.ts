import type { Logger, Settings } from "./types";
import * as path from "path";
import { apiUrlOrDefault } from "./settings";

const post = async ({
  settings,
  requestPath,
  payload,
  log,
}: {
  settings: Settings;
  requestPath: string;
  payload: any;
  log: Logger;
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

  log("ApiClient", { POST: { uri, payload } });

  return fetch(uri, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
};

export { post };
