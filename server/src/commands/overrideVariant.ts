import { post } from "../apiClient";
import { overrides, valueOfToString, variantsForFeatureFlag } from "../prefab";
import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { pickOption } from "../ui/pickOption";
import extractKey from "./extractKey";

const overrideVariant: ExecutableCommand<ExecutableCommandExecuteArgs> = {
  command: "prefab.overrideVariant",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { clientContext, connection, log, params, refresh } = args;
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
        return valueOfToString(variant);
      });

    const removeCopy = override ? `*Remove override*` : undefined;

    if (removeCopy) {
      options.push(removeCopy);
    }

    const result = await pickOption({
      connection,
      clientContext,
      title: `Override ${key} for your machine`,
      options,
    });

    if (removeCopy && result === removeCopy) {
      log("Command", "Remove variant ");

      const request = await post("/api/v1/config/remove-variant", {
        configKey: key,
        variant: override,
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
        ? variants.find((variant) => valueOfToString(variant) === result)
        : null;

      if (!variant) {
        log("Command", "No variant selected");
        return;
      }

      log("Command", { selectedVariant: variant });

      const request = await post("/api/v1/config/assign-variant", {
        configKey: key,
        variant,
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
