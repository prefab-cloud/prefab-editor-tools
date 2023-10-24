import type { CodeAction } from "vscode-languageserver/node";

import type { CodeActionAnalyzer, CodeActionAnalyzerArgs } from "../types";
import extractString from "./extractString";

const codeActions: CodeActionAnalyzer[] = [extractString];

export const runAllCodeActions = async (
  args: CodeActionAnalyzerArgs
): Promise<CodeAction[]> => {
  const allCodeActions = await Promise.all(
    codeActions.map((codeAction) => codeAction(args))
  );

  return allCodeActions.flat();
};
