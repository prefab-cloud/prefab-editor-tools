import createFlag from "./createFlag";
import editConfig from "./editConfig";
import extractConfig from "./extractConfig";
import extractProvided from "./extractProvided";
import overrideVariant from "./overrideVariant";
import refreshDiagnostics from "./refreshDiagnostics";
import toggleFlag from "./toggleFlag";

const commandLookup = Object.fromEntries(
  [
    createFlag,
    overrideVariant,
    refreshDiagnostics,
    extractConfig,
    toggleFlag,
    editConfig,
    extractProvided,
  ].map((cmd) => [cmd.command, cmd])
);

const commands = Object.keys(commandLookup);

export { commands, commandLookup };
