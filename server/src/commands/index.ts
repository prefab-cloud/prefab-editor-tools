import createFlag from "./createFlag";
import refreshDiagnostics from "./refreshDiagnostics";
import overrideVariant from "./overrideVariant";
import extractConfig from "./extractConfig";

const commandLookup = Object.fromEntries(
  [createFlag, overrideVariant, refreshDiagnostics, extractConfig].map(
    (cmd) => [cmd.command, cmd]
  )
);

const commands = Object.keys(commandLookup);

export { commands, commandLookup };
