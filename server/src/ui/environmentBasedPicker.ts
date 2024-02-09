import { Connection } from "vscode-languageserver/node";

import { apiClient } from "../apiClient";
import { DEFAULT_ENVIRONMENT_NAME, INHERIT } from "../constants";
import {
  configValuesInEnvironments,
  type Environment,
  getConfigFromApi,
  getEnvironmentsFromApi,
  type GetValue,
  type PrefabConfig,
  urlFor,
} from "../prefab";
import type { ClientContext, Logger, Settings } from "../types";
import { deprecatedPickOption } from "../ui/pickOption";
import openURL from "../utils/openURL";

type Choice = {
  title: string;
  projectEnvName: string;
  projectEnvId: string | undefined;
  canEditLocally: boolean;
  currentValue?: GetValue;
};

type LocalTitleFormatter = (projectEnvName: string, value: string) => string;
type RemoteTitleFormatter = (projectEnvName: string) => string;

export const getOptions = ({
  config,
  environments,
  remoteFormatter,
  localFormatter,
  log,
}: {
  config: PrefabConfig;
  environments: Environment[];
  remoteFormatter: RemoteTitleFormatter;
  localFormatter: LocalTitleFormatter;
  log: Logger;
}): Choice[] => {
  const values = configValuesInEnvironments(config, environments, log);

  const choices: Choice[] = values.map((value) => {
    const projectEnvName = value.environment?.name ?? DEFAULT_ENVIRONMENT_NAME;
    const projectEnvId = value.environment?.id;

    if (value.hasRules) {
      return {
        canEditLocally: false,
        projectEnvId,
        projectEnvName,
        title: remoteFormatter(projectEnvName),
      };
    } else {
      const title = localFormatter(
        projectEnvName,
        value.inherited ? INHERIT : JSON.stringify(value.value),
      );

      return {
        canEditLocally: true,
        projectEnvId,
        projectEnvName,
        currentValue: value.value,
        title,
      };
    }
  });

  return choices;
};

export const environmentBasedPicker = async ({
  loggerName,
  title,
  localFormatter,
  remoteFormatter,
  log,
  settings,
  clientContext,
  key,
  connection,
}: {
  loggerName: string;
  title: string;
  localFormatter: LocalTitleFormatter;
  remoteFormatter: RemoteTitleFormatter;
  log: Logger;
  settings: Settings;
  clientContext: ClientContext;
  key: string;
  connection: Connection;
}): Promise<(Choice & { config: PrefabConfig }) | undefined> => {
  const config = await getConfigFromApi({
    client: apiClient,
    key,
    errorLog: log,
  });

  if (!config) {
    log.error("UI", { [loggerName]: `No config found named ${key}` });
    return;
  }

  log("UI", { [loggerName]: config });

  const environments = await getEnvironmentsFromApi({ client: apiClient, log });

  log("UI", { [loggerName]: environments });

  const choices = getOptions({
    config,
    environments,
    remoteFormatter,
    localFormatter,
    log,
  });

  const result = await deprecatedPickOption({
    connection,
    clientContext,
    title,
    options: choices.map(({ title }) => title),
  });

  if (!result) {
    return;
  }

  const choice = choices.find((choice) => choice.title === result);

  if (!choice) {
    return;
  }

  log("UI", { editConfig: { choice } });

  if (!choice.canEditLocally) {
    const url = urlFor(config, settings);

    if (url) {
      log("UI", { editConfig: url });
      openURL({ url, log });
    } else {
      log("UI", { editConfig: "No URL found" });
    }

    return;
  }

  return { ...choice, config };
};
