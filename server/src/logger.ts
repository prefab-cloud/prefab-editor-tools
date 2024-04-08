import * as fs from "fs";
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

    if (process.env.LOG_TO_FILE) {
      fs.appendFileSync(
        process.env.LOG_TO_FILE,
        `${new Date()} [${scope}]: ${stringMessage}\n`,
      );
    }

    connection.console[method](`[${scope}] !!!: ${stringMessage}`);
  };

  log.error = (scope, message) => {
    log(scope, message, "error");
  };

  log.warn = (scope, message) => {
    log(scope, message, "warn");
  };

  return log;
};
