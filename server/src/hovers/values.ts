import { apiClient } from "../apiClient";
import { DEFAULT_ENVIRONMENT_NAME, INHERIT } from "../constants";
import {
  configValuesInEnvironments,
  getConfigFromApi,
  getEnvironmentsFromApi,
  type Provided,
  urlFor,
  valueOf,
} from "../prefab";
import { type HoverAnalyzerArgs } from "../types";

type Dependencies = {
  providedGetConfigFromApi?: typeof getConfigFromApi;
  providedGetEnvironmentsFromApi?: typeof getEnvironmentsFromApi;
};

const values = async ({
  log,
  method,
  settings,
  providedGetConfigFromApi,
  providedGetEnvironmentsFromApi,
}: Pick<HoverAnalyzerArgs, "log" | "method" | "settings"> & Dependencies) => {
  const { key, keyRange } = method;

  const config = await (providedGetConfigFromApi ?? getConfigFromApi)({
    client: apiClient,
    key,
    errorLog: log,
  });

  if (!config) {
    log.error("Hover", { values: `No config found named ${key}` });
    return null;
  }

  log("Hover", { config });

  const environments = await (
    providedGetEnvironmentsFromApi ?? getEnvironmentsFromApi
  )({ client: apiClient, log });

  const values = configValuesInEnvironments(config, environments, log);

  const contents: string[] = [];

  values.forEach((value) => {
    if (value.hasRules) {
      contents.push(
        `- ${
          value.environment?.name ?? DEFAULT_ENVIRONMENT_NAME
        }: [see rules](${
          urlFor(config, settings) + "?environment=" + value.environment?.id
        })`
      );
    } else {
      let valueStr = `\`${value.value ?? INHERIT}\``;

      if (value.rawValue?.weightedValues) {
        valueStr = value.rawValue.weightedValues.weightedValues
          .sort((a, b) => b.weight - a.weight)
          .map((weightedValue) => {
            const value = weightedValue.value
              ? valueOf(weightedValue.value)
              : "";
            return `${weightedValue.weight}% \`${value}\``;
          })
          .join(", ");
      }

      // TODO: remove this check on `provided` is in the proto
      if ("provided" in (value.rawValue ?? {})) {
        valueStr = `\`${
          (value.rawValue as Provided).provided.lookup
        }\` via ENV`;
      }

      contents.push(
        `- ${value.environment?.name ?? DEFAULT_ENVIRONMENT_NAME}: ${valueStr}`
      );
    }
  });

  return { contents: contents.sort().join("\n"), range: keyRange };
};

export default values;
