import { getConfigFromApi } from "../prefab-common/src/api/getConfigFromApi";
import {
  type Environment,
  getEnvironmentsFromApi,
} from "../prefab-common/src/api/getEnvironmentsFromApi";
import { configValuesInEnvironments } from "../prefab-common/src/configValuesInEnvironments";
import { getProjectEnvFromApiKey } from "../prefab-common/src/getProjectEnvFromApiKey";
import type {
  ConfigValue,
  GetValue,
  PrefabConfig,
  Provided,
} from "../prefab-common/src/types";
import { urlFor as rawUrlFor, urlForKey } from "../prefab-common/src/urlFor";
import { valueOf, valueOfToString } from "../prefab-common/src/valueOf";
import { allKeys } from "./allKeys";
import {
  overrideKeys,
  overrides,
  prefab,
  prefabInit,
  prefabPromise,
  userId,
} from "./client";
import { filterForMissingKeys } from "./filterForMissingKeys";
import { keysForCompletionType } from "./keysForCompletionType";
import { suggestKey } from "./suggestKey";
import { valueToConfigValue } from "./valueToConfigValue";
import { variantsForFeatureFlag } from "./variantsForFeatureFlag";

const urlFor = (
  config: PrefabConfig | string,
  settings: { apiUrl?: string }
) => {
  if (typeof config === "string") {
    return urlForKey(prefab, settings.apiUrl, config);
  }

  return rawUrlFor(settings.apiUrl, config);
};

export {
  allKeys,
  filterForMissingKeys,
  getConfigFromApi,
  getEnvironmentsFromApi,
  getProjectEnvFromApiKey,
  keysForCompletionType,
  overrideKeys,
  overrides,
  prefab,
  prefabInit,
  prefabPromise,
  urlFor,
  valueOf,
  valueOfToString,
  valueToConfigValue,
  variantsForFeatureFlag,
  configValuesInEnvironments,
  type ConfigValue,
  type Environment,
  type GetValue,
  type PrefabConfig,
  type Provided,
  suggestKey,
  userId,
};
