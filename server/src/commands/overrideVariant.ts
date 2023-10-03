import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { post } from "../apiClient";
import extractKey from "./extractKey";
import {
  variantsForFeatureFlag,
  getOverride,
  prefabUserId,
  valueOf,
} from "../prefabClient";

const overrideVariant: ExecutableCommand = {
  command: "prefab.overrideVariant",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { connection, log, settings, params } = args;
    log({ overrideVariant: params });

    const key = extractKey(params.arguments);

    const userId = await prefabUserId();
    const override = getOverride(key, userId);

    // get the flag from prefab and get all the variants
    const variants = await variantsForFeatureFlag(key);

    const options = variants
      .filter((variant) => {
        return JSON.stringify(variant) !== JSON.stringify(override);
      })
      .map((variant) => {
        return { title: valueOf(variant).toString() };
      });

    const removeCopy = override ? `*Remove override*` : undefined;

    if (override) {
      options.push({ title: removeCopy });
    }

    const result = await connection.window.showInformationMessage(
      `Override ${key} for your machine`,
      ...options
    );

    if (removeCopy && result?.title === removeCopy) {
      // TODO: Unset override
      log("Should remove override");
    } else {
      const variant = result
        ? variants.find(
            (variant) => valueOf(variant).toString() === result.title
          )
        : null;

      if (!variant) {
        log("No variant selected");
        return;
      }

      log({ selectedVariant: variant });

      const request = await post({
        requestPath: "/api/v1/config/assign-variant",
        settings,
        payload: {
          configKey: key,
          variant,
        },
        log,
      });

      if (request.status !== 200) {
        connection.console.error(
          `Prefab: Failed to override variant: ${request.status}`
        );
        return;
      }
    }

    // TODO: show current override (if any)
  },
};

export default overrideVariant;
