import { get } from "../apiClient";
import { PrefabConfig } from "../prefab";
import { Logger } from "../types";

export const getConfigFromApi = async ({
  log,
  key,
}: {
  log: Logger;
  key: string;
}): Promise<PrefabConfig | undefined> => {
  const requestPath = `/api/v1/config/key/${encodeURIComponent(key)}`;

  const response = await get(requestPath);

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
