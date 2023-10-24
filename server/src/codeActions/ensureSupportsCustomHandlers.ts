import type { ClientContext, CustomHandlerValue, Logger } from "../types";

export const ensureSupportsCustomHandlers = (
  requiredCustomHandlers: CustomHandlerValue[],
  clientContext: ClientContext,
  log: Logger
) => {
  const unsupportedHandlers = requiredCustomHandlers.filter(
    (handler) => !clientContext.customHandlers.includes(handler)
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
