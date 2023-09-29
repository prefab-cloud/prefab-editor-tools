import type { Logger } from "../types";

import * as childProcess from "child_process";

const openURL = ({ url, log }: { url: string; log: Logger }) => {
  log(`Prefab: Opening ${url}`);

  if (process.platform === "darwin") {
    return childProcess.exec(`open ${url}`);
  }

  if (process.platform === "win32") {
    return childProcess.exec(`start ${url}`);
  }

  return childProcess.exec(`xdg-open ${url}`);
};

export default openURL;
