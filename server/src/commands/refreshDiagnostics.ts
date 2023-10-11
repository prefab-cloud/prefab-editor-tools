// NOTE: This isn't exposed externally and is only used for manual testing
// e.g. :lua vim.lsp.buf.execute_command({command = "prefab.refreshDiagnostics", arguments ={"file:///private/tmp/minnow.rb"}})

import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";

const refreshDiagnostics: ExecutableCommand<ExecutableCommandExecuteArgs> = {
  command: "prefab.refreshDiagnostics",
  execute: async ({ refresh }: ExecutableCommandExecuteArgs) => {
    await refresh();
  },
};

export default refreshDiagnostics;
