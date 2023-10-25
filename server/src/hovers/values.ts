import { DEFAULT_ENVIRONMENT_NAME, INHERIT } from "../constants";
import {
  configValuesInEnvironments,
  getConfigFromApi,
  getEnvironmentsFromApi,
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
  clientContext,
  providedGetConfigFromApi,
  providedGetEnvironmentsFromApi,
}: Pick<HoverAnalyzerArgs, "log" | "method" | "settings" | "clientContext"> &
  Dependencies) => {
  const { key, keyRange } = method;

  const config = await (providedGetConfigFromApi ?? getConfigFromApi)({
    key,
    settings,
    log,
    clientContext,
  });

  if (!config) {
    log.error("Hover", { values: `No config found named ${key}` });
    return null;
  }

  log("Hover", { config });

  const environments = await (
    providedGetEnvironmentsFromApi ?? getEnvironmentsFromApi
  )({
    settings,
    log,
    clientContext,
  });

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
      let valueStr = `\`${value.value || INHERIT}\``;

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

      contents.push(
        `- ${value.environment?.name ?? DEFAULT_ENVIRONMENT_NAME}: ${valueStr}`
      );
    }
  });

  return { contents: contents.sort().join("\n"), range: keyRange };
};

export default values;
