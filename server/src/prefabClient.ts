import { Prefab } from "@prefab-cloud/prefab-cloud-node";
import {
  CompletionType,
  ConfigType,
  CompletionTypeValue,
  MethodLocation,
  Logger,
} from "./types";

import { apiUrlOrDefault } from "./settings";

export let prefab: Prefab;
export let prefabPromise: Promise<void> = new Promise(() => {});
export let userId: string;
export let overrides: Record<string, ConfigValue> = {};
export let overrideKeys: string[] = [];

type PrefabConfig = Exclude<ReturnType<typeof prefab.raw>, undefined>;

type ConfigValue = Exclude<
  PrefabConfig["rows"][0]["values"][0]["value"],
  undefined
>;

const getAllConfigs = (): PrefabConfig[] => {
  const configs: PrefabConfig[] = [];

  prefab.keys().map((key) => {
    const config = prefab.raw(key);

    if (config) {
      configs.push(config);
    }
  });

  return configs;
};

const isBooleanConfig = (config: PrefabConfig) => {
  const allowableValues = config.allowableValues.map((value) => value.bool);

  return (
    allowableValues.length === 2 &&
    allowableValues.includes(true) &&
    allowableValues.includes(false)
  );
};

export const keysForCompletionType = async (
  completionType: CompletionTypeValue | null
) => {
  if (completionType === null) {
    return [];
  }

  await prefabPromise;

  const configs = getAllConfigs();

  switch (completionType) {
    case CompletionType.CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS:
      return configs
        .filter(
          (config) =>
            config.configType === ConfigType.CONFIG ||
            (config.configType === ConfigType.FEATURE_FLAG &&
              !isBooleanConfig(config))
        )
        .map((config) => config.key);
    case CompletionType.NON_BOOLEAN_FEATURE_FLAGS:
      return configs
        .filter(
          (config) =>
            config.configType === ConfigType.FEATURE_FLAG &&
            !isBooleanConfig(config)
        )
        .map((config) => config.key);
    case CompletionType.BOOLEAN_FEATURE_FLAGS:
      return configs
        .filter(
          (config) =>
            config.configType === ConfigType.FEATURE_FLAG &&
            isBooleanConfig(config)
        )
        .map((config) => config.key);
    default:
      return [];
  }
};

export const filterForMissingKeys = async (methods: MethodLocation[]) => {
  await prefabPromise;

  const configs = getAllConfigs();
  const keys = configs.map((config) => config.key);

  return methods.filter((method) => {
    return !keys.includes(method.key);
  });
};

export const allKeys = async () => {
  await prefabPromise;

  return prefab.keys();
};

export const valueOf = (value: ConfigValue): ReturnType<typeof prefab.get> => {
  switch (Object.keys(value)[0]) {
    case "string":
      return value.string;
    case "stringList":
      return value.stringList?.values;
    case "int":
      return value.int?.toString();
    case "bool":
      return value.bool;
    case "double":
      return value.double;
    case "logLevel":
      return value.logLevel;
    default:
      throw new Error(`Unexpected value ${JSON.stringify(value)}`);
  }
};

export const valueOfToString = (value: ConfigValue): string => {
  const v = valueOf(value);

  if (typeof v === "string") {
    return v;
  }

  if (Array.isArray(v)) {
    return v.join(", ");
  }

  return JSON.stringify(v);
};

export const variantsForFeatureFlag = async (key: string) => {
  await prefabPromise;

  const config = prefab.raw(key);

  if (!config) {
    return [];
  }

  return config.allowableValues;
};

const DEFAULT_CONTEXT_USER_ID_NAMESPACE = "prefab-api-key";
const DEFAULT_CONTEXT_USER_ID = "user-id";

const internalOnUpdate = (log: Logger) => {
  const context = prefab.defaultContext();

  if (!context) {
    log.error("PrefabClient", "No default context found.");
    return;
  }

  userId = context
    .get(DEFAULT_CONTEXT_USER_ID_NAMESPACE)
    ?.get(DEFAULT_CONTEXT_USER_ID) as string;

  if (!userId) {
    log.error(
      "PrefabClient",
      "No user ID found. Overrides and other user-specific functionality will not be enabled."
    );
    return;
  }

  const newOverrides: typeof overrides = {};

  getAllConfigs().forEach((config) => {
    let override: ConfigValue | undefined;

    for (const row of config.rows) {
      for (const value of row.values) {
        for (const criterion of value.criteria) {
          if (
            criterion.propertyName ===
              `${DEFAULT_CONTEXT_USER_ID_NAMESPACE}.${DEFAULT_CONTEXT_USER_ID}` &&
            criterion.valueToMatch?.stringList?.values.includes(userId)
          ) {
            override = value.value;
          }
        }
      }
    }

    if (override) {
      newOverrides[config.key] = override;
    }
  });

  overrides = newOverrides;
  overrideKeys = Object.keys(overrides);
};

export const prefabInit = ({
  apiKey,
  apiUrl,
  log,
  onUpdate,
}: {
  apiKey: string;
  apiUrl: string | undefined;
  log: Logger;
  onUpdate: () => void;
}) => {
  log("PrefabClient", "Initializing Prefab client");

  prefab = new Prefab({
    apiKey,
    apiUrl: apiUrlOrDefault({ apiUrl }),
    enableSSE: true,
    defaultLogLevel: "warn",
    fetch,
    onUpdate: () => {
      log("PrefabClient", "Prefab client updated");
      internalOnUpdate(log);
      log("PrefabClient", { overrides });
      onUpdate();
    },
  });

  prefabPromise = prefab.init();
};

type ProjectEnvId = {
  projectId: string;
  id: string;
};

export const getProjectEnvFromApiKey = (
  apiKey: string | undefined
): ProjectEnvId => {
  if (!apiKey) {
    throw new Error("No API key set. Please update your configuration.");
  }

  const parts = /-P(\d+)-E(\d+)-SDK-/.exec(apiKey);

  if (!parts) {
    throw new Error("Invalid API key");
  }

  const projectId = parts[1];
  const projectEnvId = parts[2];

  if (!projectEnvId || !projectId) {
    throw new Error("Invalid API key (missing project or environment ID)");
  }

  return {
    projectId,
    id: projectEnvId,
  };
};
