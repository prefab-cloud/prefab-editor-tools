import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import { post } from "../apiClient";
import extractKey from "./extractKey";
import { variantsForFeatureFlag, valueOf } from "../prefabClient";

const overrideVariant: ExecutableCommand = {
  command: "prefab.overrideVariant",
  execute: async (args: ExecutableCommandExecuteArgs) => {
    const { connection, log, settings, params } = args;
    log({ overrideVariant: params });

    const key = extractKey(params.arguments);

    // get the flag from prefab and get all the variants
    const variants = await variantsForFeatureFlag(key, log);

    const options = variants.map((variant) => {
      return { title: valueOf(variant) };
    });

    const result = await connection.window.showInformationMessage(
      `Override ${key} for your machine`,
      ...options
    );

    const variant = result
      ? variants.find((variant) => valueOf(variant) === result.title)
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

    // TODO: update codelens
    // TODO: show current override (if any)
    // TODO: Allow unsetting override
  },
};

export default overrideVariant;
