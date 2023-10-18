import { ConfigType } from "../types";
import { prefab, type PrefabConfig } from "./client";

const CONFIG_TYPES = [ConfigType.CONFIG, "CONFIG"];
const FF_CONFIG_TYPES = [ConfigType.FEATURE_FLAG, "FEATURE_FLAG"];

export const urlFor = (keyOrConfig: string | PrefabConfig | undefined) => {
  if (!keyOrConfig) {
    return;
  }

  const config =
    typeof keyOrConfig === "string" ? prefab.raw(keyOrConfig) : keyOrConfig;

  if (!config) {
    return;
  }

  const key = config.key;
  const projectId = config.projectId;

  if (FF_CONFIG_TYPES.includes(config.configType)) {
    return `https://app.prefab.cloud/account/projects/${projectId}/flags/${key}`;
  }

  if (CONFIG_TYPES.includes(config.configType)) {
    return `https://app.prefab.cloud/account/projects/${projectId}/configs/${key}`;
  }
};
