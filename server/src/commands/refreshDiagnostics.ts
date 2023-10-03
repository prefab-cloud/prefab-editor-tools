// NOTE: This isn't exposed externally and is only used for manual testing
// e.g. :lua vim.lsp.buf.execute_command({command = "prefab.refreshDiagnostics", arguments ={"file:///private/tmp/minnow.rb"}})

import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";

const refreshDiagnostics: ExecutableCommand = {
  command: "prefab.refreshDiagnostics",
  execute: async ({ refreshDiagnostics }: ExecutableCommandExecuteArgs) => {
    await refreshDiagnostics();
  },
};

export default refreshDiagnostics;
