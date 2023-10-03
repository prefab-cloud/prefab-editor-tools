import type { ExecutableCommand } from "../types";
import createFlag from "./createFlag";
import refreshDiagnostics from "./refreshDiagnostics";
import overrideVariant from "./overrideVariant";

const commandLookup: Record<string, ExecutableCommand> = Object.fromEntries(
  [createFlag, overrideVariant, refreshDiagnostics].map(
    (cmd: ExecutableCommand) => [cmd.command, cmd]
  )
);

const commands = Object.keys(commandLookup);

export { commands, commandLookup };
