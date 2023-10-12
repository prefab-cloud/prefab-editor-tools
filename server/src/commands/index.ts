import createFlag from "./createFlag";
import refreshDiagnostics from "./refreshDiagnostics";
import overrideVariant from "./overrideVariant";

const commandLookup = Object.fromEntries(
  [createFlag, overrideVariant, refreshDiagnostics].map((cmd) => [
    cmd.command,
    cmd,
  ])
);

const commands = Object.keys(commandLookup);

export { commands, commandLookup };
