import type { HoverAnalyzerArgs } from "../types";

import pluralize from "../utils/pluralize";
import { get } from "../apiClient";
import { methodAtPosition } from "../documentAnnotations";

type EvaluationStats = {
  key: string;
  start: number;
  end: number;
  total: number;
  environments: {
    [envId: string]: {
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
}: HoverAnalyzerArgs & Dependencies) => {
  log("Hover", { uri: document.uri, position });

  const method = methodAtPosition(document, position);

  if (!method) {
    log("Hover", "No method found at position");
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

  const json: EvaluationStats = await request.json();

  log("Hover", { json });

  if (!json.environments) {
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

  Object.entries(json.environments).forEach(([envId, env]) => {
    contents.push(`Environment ${envId}: ${env.total.toLocaleString()}`);

    // TODO: add zeros for missing values
    const counts: string[] = [];

    env.counts.forEach((count) => {
      counts.push(
        `- ${percent(count.count / env.total)} - ${count.configValue.string}`
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
