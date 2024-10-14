import { Prefab } from "@prefab-cloud/prefab-cloud-node";
import { type Connection } from "vscode-languageserver/node";

import type { ConfigValue } from "../prefab-common/src/types";
import { apiUrlOrDefault } from "../settings";
import { Logger } from "../types";
import { getAllConfigs } from "./getAllConfigs";

export let prefab: Prefab;
export let prefabPromise: Promise<void> = new Promise(() => {});
export let userId: string;
export let overrides: Record<string, ConfigValue> = {};
export let overrideKeys: string[] = [];

const DEFAULT_CONTEXT_USER_ID_NAMESPACE = "prefab-api-key";
const DEFAULT_CONTEXT_USER_ID = "user-id";

const internalOnUpdate = (log: Logger) => {
  const context = prefab.defaultContext();

  if (!context) {
    log.error("PrefabClient", "No default context found.");
    return;
  }

  userId = context
    .get(DEFAULT_CONTEXT_USER_ID_NAMESPACE)
    ?.get(DEFAULT_CONTEXT_USER_ID) as string;

  if (!userId) {
    log.error(
      "PrefabClient",
      "No user ID found. Overrides and other user-specific functionality will not be enabled.",
    );
    return;
  }

  const newOverrides: typeof overrides = {};

  getAllConfigs().forEach((config) => {
    let override: ConfigValue | undefined;

    for (const row of config.rows) {
      for (const value of row.values) {
        for (const criterion of value.criteria) {
          if (
            criterion.propertyName ===
              `${DEFAULT_CONTEXT_USER_ID_NAMESPACE}.${DEFAULT_CONTEXT_USER_ID}` &&
            criterion.valueToMatch?.stringList?.values.includes(userId)
          ) {
            override = value.value;
          }
        }
      }
    }

    if (override) {
      newOverrides[config.key] = override;
    }
  });

  overrides = newOverrides;
  overrideKeys = Object.keys(overrides);
};

let onUpdateFailureCount = 0;

export const prefabInit = ({
  apiKey,
  apiUrl,
  log,
  connection,
  onUpdate,
}: {
  apiKey: string;
  apiUrl: string | undefined;
  log: Logger;
  connection: Connection;
  onUpdate: () => void;
}) => {
  log("PrefabClient", "Initializing Prefab client");

  prefabPromise = new Promise((resolve) => {
    prefab = new Prefab({
      apiKey,
      sources: [apiUrlOrDefault({ apiUrl })],
      enableSSE: true,
      defaultLogLevel: "warn",
      fetch,
      onUpdate: () => {
        try {
          log("PrefabClient", "Prefab client updated");
          internalOnUpdate(log);
          log("PrefabClient", { overrides });
          onUpdate();

          resolve();
        } catch (e) {
          onUpdateFailureCount++;

          if (onUpdateFailureCount > 3) {
            connection.window.showErrorMessage(
              "Prefab onUpdate Error: " +
                (e ?? "").toString().replace(/Error: /, ""),
            );
          }
          log.error("PrefabClient", "Error updating Prefab client: " + e);
        }
      },
    });

    prefab.init().catch((e) => {
      connection.window.showErrorMessage(
        "Prefab Error: " + e.toString().replace(/Error: /, ""),
      );
    });
  });
};
