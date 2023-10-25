import { Connection } from "vscode-languageserver/node";

import {
  type Environment,
  getConfigFromApi,
  getEnvironmentsFromApi,
  type GetValue,
  type PrefabConfig,
  urlFor,
  valueOf,
} from "../prefab";
import type { ClientContext, Logger, Settings } from "../types";
import { pickOption } from "../ui/pickOption";
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

const getEnvName = (environments: Environment[], id: string): string => {
  return environments.find((env) => env.id === id)?.name ?? "Default";
};

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
  const choices: Choice[] = [];

  config.rows.forEach((row) => {
    const singleValue = row.values.length === 1 && !row.values[0].criteria;
    const projectEnvName = getEnvName(
      environments,
      row.projectEnvId?.toString()
    );

    if (!row.values[0].value) {
      return;
    }

    const projectEnvId = row.projectEnvId?.toString();

    if (singleValue) {
      const value = valueOf(row.values[0].value);

      log("UI", { value });

      choices.push({
        canEditLocally: true,
        projectEnvId,
        projectEnvName,
        currentValue: value,
        title: localFormatter(projectEnvName, JSON.stringify(value)),
      });
    } else {
      choices.push({
        canEditLocally: false,
        projectEnvId,
        projectEnvName,
        title: remoteFormatter(projectEnvName),
      });
    }
  });

  environments.map((environment) => {
    if (!choices.find((choice) => choice.projectEnvId === environment.id)) {
      const projectEnvName = getEnvName(environments, environment.id);

      choices.push({
        canEditLocally: true,
        projectEnvId: environment.id,
        projectEnvName,
        title: localFormatter(projectEnvName, "[inherit]"),
      });
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
    key,
    settings,
    log,
    clientContext,
  });

  if (!config) {
    log.error("UI", { [loggerName]: `No config found named ${key}` });
    return;
  }

  log("UI", { [loggerName]: config });

  const environments = await getEnvironmentsFromApi({
    settings,
    log,
    clientContext,
  });

  log("UI", { [loggerName]: environments });

  const choices = getOptions({
    config,
    environments,
    remoteFormatter,
    localFormatter,
    log,
  });

  const result = await pickOption({
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
