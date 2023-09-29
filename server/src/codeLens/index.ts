import { CodeLens } from "vscode-languageserver/node";
import { CodeLensAnalyzer, CodeLensAnalyzerArgs } from "../types";

import createFlag from "./createFlag";

export const codeLenses: CodeLensAnalyzer[] = [createFlag];

export const runAllCodeLens = async (
  args: CodeLensAnalyzerArgs
): Promise<CodeLens[]> => {
  const allCodeLens = await Promise.all(
    codeLenses.map((codeLens) => codeLens(args))
  );

  return allCodeLens.flat();
};
