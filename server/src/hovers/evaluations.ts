import { apiClient } from "../apiClient";
import { valueOfToString } from "../prefab";
import { getEvaluationStats } from "../prefab-common/src/evaluations/stats";
import type { HoverAnalyzerArgs } from "../types";
import pluralize from "../utils/pluralize";

const percent = (value: number) => {
  return `${Math.round(value * 100)}%`;
};

type Dependencies = {
  providedClient?: typeof apiClient;
};

const evaluations = async ({
  log,
  method,
  providedClient,
}: Pick<HoverAnalyzerArgs, "log" | "method"> & Dependencies) => {
  const evaluations = await getEvaluationStats({
    key: method.key,
    client: providedClient ?? apiClient,
    log,
  });

  if (!evaluations) {
    log("Hover", "No evaluations found");
    return null;
  }

  log("Hover", `evaluations: ${JSON.stringify(evaluations, null, 2)}`);

  const contents = [
    `${pluralize(
      evaluations.total,
      "evaluation",
      "evaluations"
    )} over the last 24 hours`,
    "",
  ];

  evaluations.environments.forEach((env) => {
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
