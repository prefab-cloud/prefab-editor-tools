/* via the CLI codebase. TODO: merge */
import {
  ConfigType,
  ConfigValue,
  ConfigValueType,
  encryption,
} from "@prefab-cloud/prefab-cloud-node";
import { Connection } from "vscode-languageserver/node";

import { apiClient } from "./apiClient";
import { getConfigFromApi, valueOfToString } from "./prefab";
import { NewConfig } from "./prefab-common/src/types";
import { Logger, Settings } from "./types";

export type Secret = {
  keyName: string;
  selected: boolean;
};

const TRUE_VALUES = new Set(["true", "1", "t"]);
const BOOLEAN_VALUES = new Set([...TRUE_VALUES, "false", "0", "f"]);

export const DEFAULT_SECRET_KEY_NAME = "prefab.secrets.encryption.key";

type ConfigValueWithConfigValueType = [ConfigValue, ConfigValueType];

export const TYPE_MAPPING: Record<string, ConfigValueType> = {
  bool: ConfigValueType.BOOL,
  boolean: ConfigValueType.BOOL,
  double: ConfigValueType.DOUBLE,
  int: ConfigValueType.INT,
  string: ConfigValueType.STRING,
  "string-list": ConfigValueType.STRING_LIST,
  stringList: ConfigValueType.STRING_LIST,
};

export const coerceIntoType = (
  type: string,
  value: string,
): ConfigValueWithConfigValueType | undefined => {
  switch (type) {
    case "string": {
      return [{ string: value }, TYPE_MAPPING[type]];
    }

    case "int": {
      const int = Number.parseInt(value, 10);

      if (Number.isNaN(int)) {
        throw new TypeError(`Invalid default value for int: ${value}`);
      }

      return [{ int: int as unknown }, TYPE_MAPPING[type]];
    }

    case "double": {
      const double = Number.parseFloat(value);

      if (Number.isNaN(double)) {
        throw new TypeError(`Invalid default value for double: ${value}`);
      }

      return [{ double }, TYPE_MAPPING[type]];
    }

    case "bool":
    case "boolean": {
      return [{ bool: coerceBool(value) }, TYPE_MAPPING[type]];
    }

    case "stringList":
    case "string-list": {
      return [
        { stringList: { values: value.split(/\s*,\s*/) } },
        TYPE_MAPPING[type],
      ];
    }

    default: {
      return undefined;
    }
  }
};

export const coerceBool = (value: string): boolean => {
  if (!BOOLEAN_VALUES.has(value.toLowerCase())) {
    throw new TypeError(`Invalid default value for boolean: ${value}`);
  }

  return TRUE_VALUES.has(value.toLowerCase());
};

export const makeConfidentialValue = async ({
  connection,
  environmentId,
  log,
  secret,
  value,
  settings,
}: {
  connection: Connection;
  environmentId: string;
  log: Logger;
  secret: Secret;
  value: string;
  settings: Settings;
}): Promise<ConfigValue> => {
  const rawConfig = await getConfigFromApi({
    client: apiClient,
    errorLog: log,
    key: secret.keyName,
  });

  if (!rawConfig) {
    throw new Error(`Failed to create secret: ${secret.keyName} not found`);
  }

  if (!rawConfig.rows) {
    throw new Error(`Failed to create secret: ${secret.keyName} has no rows`);
  }

  const secretKeyRow =
    rawConfig.rows.find((row) => (row.projectEnvId ?? "") === environmentId) ??
    rawConfig.rows.find((row) => (row.projectEnvId ?? "") === "");

  const envVar = secretKeyRow?.values[0]?.value?.provided?.lookup;

  if (!envVar) {
    throw new Error(
      `Failed to create secret: ${secret.keyName} not found for environmentId ${environmentId} or default env`,
    );
  }

  const secretKey = settings.envVars && settings.envVars[envVar];

  if (typeof secretKey !== "string") {
    const workspaceFolders = await connection.workspace.getWorkspaceFolders();

    let message = `Failed to create secret: env var ${envVar} is not present. You can specify it via a .env, .envrc, or .env.local file`;

    if (workspaceFolders) {
      message += ` in one of the following workspace folders: ${workspaceFolders
        .map((folder) => folder.uri.replace("file://", ""))
        .join(", ")}`;
    }

    connection.window.showErrorMessage(message);
    throw new Error(
      `Failed to create secret: env var ${envVar} is not present. `,
    );
  }

  if (secretKey.length !== 64) {
    throw new Error(
      `Failed to create secret: Secret key is too short. ${secret.keyName} must be 64 characters.`,
    );
  }

  return {
    confidential: true,
    decryptWith: secret.keyName,
    string: encryption.encrypt(value, secretKey),
  };
};

export const createConfig = async ({
  connection,
  settings,
  confidential,
  key,
  log,
  projectId,
  secret,
  value,
  valueType,
}: {
  connection: Connection;
  settings: Settings;
  confidential: boolean;
  key: string;
  log: Logger;
  projectId: string;
  secret: Secret;
  value: ConfigValue;
  valueType: ConfigValueType;
}): Promise<object> => {
  if (confidential || secret.selected) {
    value.confidential = true;
  }

  if (secret.selected) {
    const valueOfValue = valueOfToString(value);

    const confidentialValueResult = await makeConfidentialValue({
      connection,
      settings,
      environmentId: "",
      log,
      secret,
      value: valueOfValue,
    });

    value = confidentialValueResult;
  }

  const newConfig: Omit<NewConfig, "allowableValues"> = {
    configType: ConfigType.CONFIG,
    key,
    projectId,
    rows: [
      {
        properties: {},
        values: [{ criteria: [], value }],
      },
    ],
    sendToClientSdk: false,
    valueType,
  };

  const request = await apiClient.post("/api/v1/config/", newConfig);

  if (!request.ok) {
    const requestError = await request.text();
    const errMsg =
      request.status === 409
        ? `Failed to create config: ${key} already exists`
        : `Failed to create config: ${request.status} | ${JSON.stringify(
            requestError,
          )}`;

    throw new Error(errMsg);
  }

  return { key, ...request.json };
};
