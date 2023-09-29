import type { ExecutableCommand } from "../types";
import createFlag from "./createFlag";

const commandLookup: Record<string, ExecutableCommand> = Object.fromEntries(
  [createFlag].map((cmd: ExecutableCommand) => [cmd.command, cmd])
);

const commands = Object.keys(commandLookup);

export { commands, commandLookup };
