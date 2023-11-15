import { prefab, type PrefabConfig } from "../prefab";
import { ConfigType, type Settings } from "../types";

const CONFIG_TYPES = [ConfigType.CONFIG, "CONFIG"];
const FF_CONFIG_TYPES = [ConfigType.FEATURE_FLAG, "FEATURE_FLAG"];

export const urlFor = (
  keyOrConfig: string | PrefabConfig | undefined,
  settings: Settings
) => {
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

  const urlBase = settings.apiUrl
    ? settings.apiUrl.replace(/api\./, "app.").replace(/\/$/, "")
    : "https://app.prefab.cloud";

  if (FF_CONFIG_TYPES.includes(config.configType)) {
    return `${urlBase}/account/projects/${projectId}/flags/${key}`;
  }

  if (CONFIG_TYPES.includes(config.configType)) {
    return `${urlBase}/account/projects/${projectId}/configs/${key}`;
  }
};
