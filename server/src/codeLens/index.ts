import { CodeLens } from "vscode-languageserver/node";
import type { CodeLensAnalyzer, CodeLensAnalyzerArgs } from "../types";

import createFlag from "./createFlag";
import overrideVariant from "./overrideVariant";

const codeLenses: CodeLensAnalyzer[] = [overrideVariant, createFlag];

export const runAllCodeLens = async (
  args: CodeLensAnalyzerArgs
): Promise<CodeLens[]> => {
  const allCodeLens = await Promise.all(
    codeLenses.map((codeLens) => codeLens(args))
  );

  return allCodeLens.flat();
};
