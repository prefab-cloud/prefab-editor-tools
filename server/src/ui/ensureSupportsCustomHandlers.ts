import {
  ClientContext,
  CustomHandler,
  CustomHandlerValue,
  Logger,
} from "../types";
import { getInput } from "./getInput";
import { pickOption } from "./pickOption";

const mapping = {
  [CustomHandler.pickOption]: pickOption,
  [CustomHandler.getInput]: getInput,
};

export const ensureSupportsCustomHandlers = (
  requiredCustomHandlers: CustomHandlerValue[],
  clientContext: ClientContext,
  log: Logger
) => {
  const unsupportedHandlers = requiredCustomHandlers.filter(
    (handler) => !mapping[handler].supported(clientContext)
  );

  if (unsupportedHandlers.length) {
    log(
      "UI",
      `Client does not support custom handlers: ${unsupportedHandlers.join(
        ", "
      )}`
    );
    return false;
  }

  return true;
};
