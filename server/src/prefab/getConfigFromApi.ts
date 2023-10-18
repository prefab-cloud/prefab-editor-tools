import { get } from "../apiClient";
import { ClientContext, Logger, Settings } from "../types";
import { PrefabConfig } from "./client";

export const getConfigFromApi = async ({
  settings,
  log,
  clientContext,
  key,
}: {
  settings: Settings;
  log: Logger;
  clientContext: ClientContext;
  key: string;
}): Promise<PrefabConfig | undefined> => {
  const requestPath = `/api/v1/config/key/${encodeURIComponent(key)}`;

  const response = await get({ settings, log, requestPath, clientContext });

  if (response.status !== 200) {
    const text = response.text();
    const statusText = response.statusText;

    log.error("PrefabClient", {
      message: "Error fetching config",
      response,
      text,
      statusText,
    });

    return;
  }

  return await response.json();
};
