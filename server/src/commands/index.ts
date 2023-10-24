import createFlag from "./createFlag";
import extractConfig from "./extractConfig";
import overrideVariant from "./overrideVariant";
import refreshDiagnostics from "./refreshDiagnostics";

const commandLookup = Object.fromEntries(
  [createFlag, overrideVariant, refreshDiagnostics, extractConfig].map(
    (cmd) => [cmd.command, cmd]
  )
);

const commands = Object.keys(commandLookup);

export { commands, commandLookup };
