import { CodeLens } from "vscode-languageserver/node";

import type { CodeLensAnalyzer, CodeLensAnalyzerArgs } from "../types";
import createFlag from "./createFlag";
import editConfig from "./editConfig";
import overrideVariant from "./overrideVariant";
import toggleFlag from "./toggleFlag";

const codeLenses: CodeLensAnalyzer[] = [
  overrideVariant,
  createFlag,
  toggleFlag,
  editConfig,
];

export const runAllCodeLens = async (
  args: CodeLensAnalyzerArgs
): Promise<CodeLens[]> => {
  const allCodeLens = await Promise.all(
    codeLenses.map((codeLens) => codeLens(args))
  );

  return allCodeLens.flat();
};
