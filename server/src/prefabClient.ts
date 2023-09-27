import { log, logj } from "./log";

import { Prefab } from "@prefab-cloud/prefab-cloud-node";
import fetch from "node-fetch";
import {
  CompletionType,
  ConfigType,
  CompletionTypeValue,
  MethodLocation,
} from "./types";

let prefab: Prefab;
let prefabPromise: Promise<void>;

const DEFAULT_API_URL = "https://api.prefab.cloud";

type PrefabConfig = Exclude<ReturnType<typeof prefab.raw>, undefined>;

const getAllConfigs = async (): Promise<PrefabConfig[]> => {
  await prefabPromise;

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

const keysForCompletionType = async (
  completionType: CompletionTypeValue | null
) => {
  if (completionType === null) {
    return [];
  }

  const configs = await getAllConfigs();

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
  const configs = await getAllConfigs();
  const keys = configs.map((config) => config.key);

  return methods.filter((method) => {
    return !keys.includes(method.key);
  });
};

const prefabInit = ({
  apiKey,
  apiUrl,
}: {
  apiKey: string;
  apiUrl: string | undefined;
}) => {
  prefab = new Prefab({
    apiKey,
    apiUrl: apiUrl ?? DEFAULT_API_URL,
    enableSSE: true,
    defaultLogLevel: "warn",
    fetch,
  });

  prefabPromise = prefab.init();
};

export { prefab, prefabInit, prefabPromise, keysForCompletionType, Prefab };
