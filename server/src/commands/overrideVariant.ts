import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { post } from "../apiClient";
import extractKey from "./extractKey";
import {
  variantsForFeatureFlag,
  overrides,
  valueOfToString,
} from "../prefabClient";

const overrideVariant: ExecutableCommand<ExecutableCommandExecuteArgs> = {
  command: "prefab.overrideVariant",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { clientContext, connection, log, settings, params, refresh } = args;
    log("Command", { overrideVariant: params });

    const key = extractKey(params.arguments);

    const override = overrides[key];

    // get the flag from prefab and get all the variants
    const variants = await variantsForFeatureFlag(key);

    const options = variants
      .filter((variant) => {
        return JSON.stringify(variant) !== JSON.stringify(override);
      })
      .map((variant) => {
        return { title: valueOfToString(variant) };
      });

    const removeCopy = override ? `*Remove override*` : undefined;

    if (removeCopy) {
      options.push({ title: removeCopy });
    }

    const result = await connection.window.showInformationMessage(
      `Override ${key} for your machine`,
      ...options
    );

    if (removeCopy && result?.title === removeCopy) {
      log("Command", "Remove variant ");

      const request = await post({
        requestPath: "/api/v1/config/remove-variant",
        settings,
        payload: {
          configKey: key,
          variant: override,
        },
        log,
        clientContext,
      });

      if (request.status !== 200) {
        const json = await request.json();
        connection.console.error(
          `Prefab: Failed to override variant: ${
            request.status
          } | ${JSON.stringify(json, null, 2)}`
        );
        return;
      }
    } else {
      const variant = result
        ? variants.find((variant) => valueOfToString(variant) === result.title)
        : null;

      if (!variant) {
        log("Command", "No variant selected");
        return;
      }

      log("Command", { selectedVariant: variant });

      const request = await post({
        requestPath: "/api/v1/config/assign-variant",
        settings,
        payload: {
          configKey: key,
          variant,
        },
        log,
        clientContext,
      });

      if (request.status !== 200) {
        connection.console.error(
          `Prefab: Failed to override variant: ${request.status}`
        );
        return;
      }
    }

    refresh();
  },
};

export default overrideVariant;
