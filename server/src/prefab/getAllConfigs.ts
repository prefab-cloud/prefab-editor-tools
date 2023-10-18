import { prefab, type PrefabConfig } from "./client";

export const getAllConfigs = (): PrefabConfig[] => {
  const configs: PrefabConfig[] = [];

  prefab.keys().map((key) => {
    const config = prefab.raw(key);

    if (config) {
      configs.push(config);
    }
  });

  return configs;
};
