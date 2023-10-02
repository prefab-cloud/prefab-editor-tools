import { Prefab } from "@prefab-cloud/prefab-cloud-node";
import fetch from "node-fetch";
import {
  CompletionType,
  ConfigType,
  CompletionTypeValue,
  MethodLocation,
  Logger,
} from "./types";

import { apiUrlOrDefault } from "./settings";

let prefab: Prefab;
let prefabPromise: Promise<void>;

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

export const filterForMissingKeys = async (
  methods: MethodLocation[],
  log: Logger
) => {
  const configs = await getAllConfigs();
  const keys = configs.map((config) => config.key);

  log({ keys });

  return methods.filter((method) => {
    return !keys.includes(method.key);
  });
};

const prefabInit = ({
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
  prefab = new Prefab({
    apiKey,
    apiUrl: apiUrlOrDefault({ apiUrl }),
    enableSSE: true,
    defaultLogLevel: "warn",
    fetch,
    onUpdate,
  });

  prefabPromise = prefab.init();

  prefabPromise.then(() => {
    log("Internal Prefab client initialized");
  });
};

type ProjectEnvId = {
  projectId: string;
  id: string;
};

const getProjectEnvFromApiKey = (apiKey: string): ProjectEnvId => {
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

export {
  prefab,
  prefabInit,
  prefabPromise,
  keysForCompletionType,
  Prefab,
  getProjectEnvFromApiKey,
};
