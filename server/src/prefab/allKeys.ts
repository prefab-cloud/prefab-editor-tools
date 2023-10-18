import { prefab, prefabPromise } from "./client";

export const allKeys = async () => {
  await prefabPromise;

  return prefab.keys();
};
