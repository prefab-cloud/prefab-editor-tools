import { MethodLocation } from "../types";
import { prefabPromise } from "./client";
import { getAllConfigs } from "./getAllConfigs";

export const filterForMissingKeys = async (methods: MethodLocation[]) => {
  await prefabPromise;

  const configs = getAllConfigs();
  const keys = configs.map((config) => config.key);

  return methods.filter((method) => {
    return !keys.includes(method.key);
  });
};
