import { Connection } from "vscode-languageserver/node";

import { type Logger } from "./types";

export const makeLogger = (connection: Connection): Logger => {
  const log: Logger = (scope, message, method = "info") => {
    let stringMessage: string;

    if (typeof message === "string") {
      stringMessage = message;
    } else {
      if (message instanceof Map) {
        stringMessage = JSON.stringify(Object.fromEntries(message));
      } else {
        stringMessage = JSON.stringify(message);
      }
    }

    connection.console[method](`[${scope}]: ${stringMessage}`);
  };

  log.error = (scope, message) => {
    log(scope, message, "error");
  };

  log.warn = (scope, message) => {
    log(scope, message, "warn");
  };

  return log;
};
