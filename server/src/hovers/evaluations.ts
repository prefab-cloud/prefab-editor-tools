import type { HoverAnalyzerArgs } from "../types";

import pluralize from "../utils/pluralize";
import { get } from "../apiClient";
import { methodAtPosition } from "../documentAnnotations";
import {
  filterForMissingKeys as defaultFilterForMissingKeys,
  valueOfToString,
} from "../prefabClient";

type EvaluationStats = {
  key: string;
  start: number;
  end: number;
  total: number;
  environments: {
    [envId: string]: {
      name: string;
      total: number;
      counts: Array<{
        configValue: {
          string: string;
        };
        count: number;
      }>;
    };
  };
};

type Dependencies = {
  providedGet?: typeof get;
};

const percent = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

const evaluations = async ({
  document,
  log,
  position,
  settings,
  providedGet,
  filterForMissingKeys,
}: HoverAnalyzerArgs & Dependencies) => {
  log("Hover", { evaluations: { uri: document.uri, position } });

  const method = methodAtPosition(document, position);

  if (!method) {
    log("Hover", "No method found at position");
    return null;
  }

  const missingKeyMethods = await (
    filterForMissingKeys ?? defaultFilterForMissingKeys
  )([method]);

  if (missingKeyMethods.length > 0) {
    log("Hover", "Key does not exist");
    return null;
  }

  log("Hover", { key: method.key });

  const request = await (providedGet ?? get)({
    settings,
    requestPath: `/api/v1/evaluation-stats/${encodeURIComponent(method.key)}`,
    log,
  });

  if (request.status !== 200) {
    log("Hover", `Error: ${request.status} ${request.statusText}`);

    return null;
  }

  const json = (await request.json()) as EvaluationStats;

  log("Hover", { json });

  if (!json.environments) {
    log("Hover", `No environment evaluations found for ${method.key}`);
    return null;
  }

  const contents = [
    `${pluralize(
      json.total,
      "evaluation",
      "evaluations"
    )} over the last 24 hours`,
    "",
  ];

  // Sort environments by most to least number of evaluations
  const sortedKeys = Object.keys(json.environments)
    .sort((a, b) => json.environments[a].total - json.environments[b].total)
    .reverse();

  sortedKeys.forEach((envId) => {
    const env = json.environments[envId];
    contents.push(`${env.name}: ${env.total.toLocaleString()}`);

    // TODO: add zeros for missing values
    const counts: string[] = [];

    env.counts.forEach((count) => {
      counts.push(
        `- ${percent(count.count / env.total)} - ${valueOfToString(
          count.configValue
        )}`
      );
    });

    counts.forEach((count) => {
      contents.push(count);
    });

    contents.push("");
  });

  return {
    contents: contents.join("\n").trim(),
    range: method.keyRange,
  };
};

export default evaluations;
