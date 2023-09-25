import { Prefab } from "@prefab-cloud/prefab-cloud-node";
import fetch from "node-fetch";

let prefab: Prefab;
let prefabPromise: Promise<void>;

const DEFAULT_API_URL = "https://api.prefab.cloud";

type PrefabConfig = Exclude<ReturnType<typeof prefab.raw>, undefined>;

export const ConfigType = {
  CONFIG: 1,
  FEATURE_FLAG: 2,
};

export type ConfigTypeValue = (typeof ConfigType)[keyof typeof ConfigType];

const prefabConfigsOfType = async (
  type: ConfigTypeValue
): Promise<PrefabConfig[]> => {
  await prefabPromise;

  const configs: PrefabConfig[] = [];

  prefab.keys().forEach((key) => {
    const raw = prefab.raw(key);

    if (raw && raw.configType === type) {
      configs.push(raw);
    }
  });

  return configs;
};

const prefabConfigNamesOfType = async (
  type: ConfigTypeValue
): Promise<string[]> => {
  const configs = await prefabConfigsOfType(type);

  return configs.map((config) => config.key);
};

const prefabValue = (config: Record<string, unknown>) => {
  return Object.values(config)[0];
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

export { prefab, prefabInit, prefabConfigNamesOfType, prefabValue };
