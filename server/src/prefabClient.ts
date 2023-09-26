import { Prefab } from "@prefab-cloud/prefab-cloud-node";
import fetch from "node-fetch";

let prefab: Prefab;
let prefabPromise: Promise<void>;

const DEFAULT_API_URL = "https://api.prefab.cloud";

type PrefabConfig = Exclude<ReturnType<typeof prefab.raw>, undefined>;

export const CompletionType = {
  CONFIGS_AND_NON_BOOLEAN_FEATURE_FLAGS: 1,
  BOOLEAN_FEATURE_FLAGS: 2,
  NON_BOOLEAN_FEATURE_FLAGS: 3,
};

export type CompletionTypeValue =
  (typeof CompletionType)[keyof typeof CompletionType];

export const ConfigType = {
  CONFIG: 1,
  FEATURE_FLAG: 2,
};

export type ConfigTypeValue = (typeof ConfigType)[keyof typeof ConfigType];

export const MethodType = {
  GET: 1,
  IS_ENABLED: 2,
};

export type MethodTypeValue = (typeof MethodType)[keyof typeof MethodType];

// const prefabConfigsOfType = async (
//   type: ConfigTypeValue
// ): Promise<PrefabConfig[]> => {
//   await prefabPromise;
//
//   const configs: PrefabConfig[] = [];
//
//   prefab.keys().forEach((key) => {
//     const raw = prefab.raw(key);
//
//     if (raw && raw.configType === type) {
//       configs.push(raw);
//     }
//   });
//
//   return configs;
// };
//
// const prefabConfigNamesOfType = async (
//   type: ConfigTypeValue
// ): Promise<string[]> => {
//   const configs = await prefabConfigsOfType(type);
//
//   return configs.map((config) => config.key);
// };

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

export { prefab, prefabInit, keysForCompletionType };
