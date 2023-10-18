import { CompletionType, CompletionTypeValue,ConfigType } from "../types";
import { type PrefabConfig,prefabPromise } from "./client";
import { getAllConfigs } from "./getAllConfigs";

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
