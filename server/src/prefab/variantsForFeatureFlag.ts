import { prefab, prefabPromise } from "./client";

export const variantsForFeatureFlag = async (key: string) => {
  await prefabPromise;

  const config = prefab.raw(key);

  if (!config) {
    return [];
  }

  return config.allowableValues;
};
