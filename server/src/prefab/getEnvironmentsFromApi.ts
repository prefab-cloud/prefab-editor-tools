import { get } from "../apiClient";
import { ClientContext, Logger, Settings } from "../types";

export type Environment = {
  id: string;
  name: string;
};

export const getEnvironmentsFromApi = async ({
  settings,
  log,
  clientContext,
}: {
  settings: Settings;
  log: Logger;
  clientContext: ClientContext;
}): Promise<Environment[]> => {
  const requestPath = "/api/v1/project-environments";

  const response = await get({ settings, log, requestPath, clientContext });

  if (response.status !== 200) {
    log.error("PrefabClient", {
      message: "Error fetching environments",
      response,
    });

    return [];
  }

  return (await response.json()).envs
    .sort((a: Environment, b: Environment) => {
      a.name < b.name ? -1 : 1;
    })
    .map((env: Environment) => {
      return {
        id: env.id.toString(),
        name: env.name,
      };
    });
};
