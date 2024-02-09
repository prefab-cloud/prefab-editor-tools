import { ConfigValueType } from "@prefab-cloud/prefab-cloud-node";

import {
  coerceIntoType,
  createConfig as createConfigBehavior,
  DEFAULT_SECRET_KEY_NAME,
  Secret,
  TYPE_MAPPING,
} from "../borrowedFromCLI";
import { ConfigValue, getProjectEnvFromApiKey } from "../prefab";
import { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { getInput } from "../ui/getInput";
import { Option, pickOption } from "../ui/pickOption";
import extractKey from "./extractKey";

type Args = ExecutableCommandExecuteArgs;

type TypeOptionChoice = {
  envVar: boolean;
  title: string;
  type: string;
};

const types: string[] = ["boolean", "string", "double", "int", "string-list"];

const typeChoices: TypeOptionChoice[] = [false, true].flatMap((envVar) =>
  types.flatMap((type) => ({
    envVar,
    title: `${type} ${envVar ? "provided by an ENV var" : ""}`,
    type,
  })),
);

const boolChoices = [
  { title: "true", value: true },
  { title: "false", value: false },
];

const visibilityChoices = [{ title: "normal" }, { title: "confidential" }];

const createConfig: ExecutableCommand<Args> = {
  command: "prefab.createConfig",
  execute: async (args: Args) => {
    const { clientContext, params, settings, log, connection, refresh } = args;
    const { projectId } = getProjectEnvFromApiKey(settings.apiKey);

    log("Command", { createConfig: params, settings });

    const key = extractKey(params.arguments);

    const chosenType = await pickOption<Option<TypeOptionChoice>>({
      connection,
      clientContext,
      title: "What type of config would you like to create?",
      options: typeChoices,
    });

    log("Command", { chosenType });

    if (!chosenType) {
      return;
    }

    let configValue: ConfigValue;
    let valueType: ConfigValueType;

    if (chosenType.envVar) {
      const envVar = await getInput({
        connection,
        title: `ENV var name`,
      });

      if (!envVar) {
        return;
      }

      configValue = {
        provided: {
          lookup: envVar,
          source: 1,
        },
      };

      valueType = TYPE_MAPPING[chosenType.type];
    } else {
      let chosenValue: { title: string; value: boolean } | string | undefined;

      if (chosenType.type === "boolean") {
        chosenValue = (
          await pickOption<Option<{ title: string; value: boolean }>>({
            connection,
            clientContext,
            title: `Default value for ${key}`,
            options: boolChoices,
          })
        )?.value.toString();
      } else {
        chosenValue = await getInput({
          connection,
          title: `Default value for ${key}`,
        });
      }

      connection.console.log(
        `Chosen value: ${JSON.stringify(
          chosenValue,
        )} | Chosen type: ${JSON.stringify(chosenType)} | ${
          typeof chosenValue === "string"
        }`,
      );

      if (!chosenValue) {
        return;
      }

      const parsedConfigValue = coerceIntoType(chosenType.type, chosenValue);

      connection.console.log(
        `Parsed value: ${JSON.stringify(parsedConfigValue)}`,
      );

      if (!parsedConfigValue) {
        return;
      }

      configValue = parsedConfigValue[0];
      valueType = parsedConfigValue[1];
    }

    let visibility;

    if (["string", "string-list"].includes(chosenType.type)) {
      if (!chosenType.envVar) {
        visibilityChoices.splice(1, 0, { title: "secret" });
      }

      const chosenVisibility = await pickOption<Option<{ title: string }>>({
        connection,
        clientContext,
        title: `Select visibility for ${key}`,
        options: visibilityChoices,
      });

      if (!chosenVisibility) {
        return;
      }

      visibility = chosenVisibility.title;
    } else {
      visibility = "normal";
    }

    const secret: Secret =
      visibility === "secret"
        ? { keyName: DEFAULT_SECRET_KEY_NAME, selected: true }
        : { keyName: DEFAULT_SECRET_KEY_NAME, selected: false };

    createConfigBehavior({
      connection,
      settings,
      confidential: visibility === "confidential" || visibility === "secret",
      key,
      log,
      projectId,
      secret,
      value: configValue,
      valueType,
    }).then(() => {
      refresh();
    });

    connection.console.log(
      `Creating config ${key} of type ${chosenType.type} with envVar=${
        chosenType.envVar
      } w/ visibility=${visibility} and value=${JSON.stringify(
        configValue,
      )} of valueType=${valueType}`,
    );
  },
};

export default createConfig;
