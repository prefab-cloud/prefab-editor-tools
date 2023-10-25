import {
  type ConfigValue,
  type Environment,
  type GetValue,
  type PrefabConfig,
  valueOf,
} from "../prefab";
import { type Logger } from "../types";

export type ConfigValueInEnvironment = {
  environment?: Environment;
  value: GetValue | undefined;
  rawValue: ConfigValue | undefined;
  hasRules: boolean;
  inherited: boolean;
};

export const configValuesInEnvironments = (
  config: PrefabConfig,
  environments: Environment[],
  log: Logger
) => {
  const values: ConfigValueInEnvironment[] = [];

  config.rows.forEach((row) => {
    const hasRules =
      row.values.length > 1 || row.values[0].criteria?.length > 0;

    if (!row.values[0].value) {
      return;
    }

    log("UI", { value: row.values[0].value });

    values.push({
      environment: environments.find(
        (environment) =>
          environment.id?.toString() === row.projectEnvId?.toString()
      ),
      value: hasRules ? undefined : valueOf(row.values[0].value),
      rawValue: hasRules ? undefined : row.values[0].value,
      inherited: false,
      hasRules,
    });
  });

  environments.map((environment) => {
    if (!values.find((value) => value.environment?.id === environment.id)) {
      values.push({
        environment,
        value: undefined,
        rawValue: undefined,
        hasRules: false,
        inherited: true,
      });
    }
  });

  return values;
};
