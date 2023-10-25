import { get } from "../apiClient";
import { valueOfToString } from "../prefab";
import type { HoverAnalyzerArgs } from "../types";
import pluralize from "../utils/pluralize";

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
  log,
  settings,
  providedGet,
  method,
  clientContext,
}: Pick<HoverAnalyzerArgs, "log" | "settings" | "method" | "clientContext"> &
  Dependencies) => {
  const request = await (providedGet ?? get)({
    settings,
    requestPath: `/api/v1/evaluation-stats/${encodeURIComponent(method.key)}`,
    log,
    clientContext,
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
