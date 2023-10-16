import type {
  CustomHandlerValue,
  Logger,
  PrefabInitializeParams,
} from "../types";

export const ensureSupportsCustomHandlers = (
  requiredCustomHandlers: CustomHandlerValue[],
  initializeParams: PrefabInitializeParams,
  log: Logger
) => {
  const unsupportedHandlers = requiredCustomHandlers.filter(
    (handler) => !initializeParams.customHandlers.includes(handler)
  );

  if (unsupportedHandlers.length) {
    log(
      "CodeActions",
      `Client does not support custom handlers: ${unsupportedHandlers.join(
        ", "
      )}`
    );
    return false;
  }

  return true;
};
