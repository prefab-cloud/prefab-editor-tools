import type { Logger } from "../types";

import * as childProcess from "child_process";

const openURL = ({ url, log }: { url: string; log: Logger }) => {
  log("Utility", `Prefab: Opening ${url}`);

  switch (process.platform) {
    case "darwin":
      childProcess.exec(`open ${url}`);
      break;

    case "win32":
      childProcess.exec(`start ${url}`);
      break;

    default:
      childProcess.exec(`xdg-open ${url}`);
  }
};

export default openURL;
