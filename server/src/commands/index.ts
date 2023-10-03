import type { ExecutableCommand } from "../types";
import createFlag from "./createFlag";
import refreshDiagnostics from "./refreshDiagnostics";

const commandLookup: Record<string, ExecutableCommand> = Object.fromEntries(
  [createFlag, refreshDiagnostics].map((cmd: ExecutableCommand) => [
    cmd.command,
    cmd,
  ])
);

const commands = Object.keys(commandLookup);

export { commands, commandLookup };
