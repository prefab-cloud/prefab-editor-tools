import { CompletionItem } from "vscode-languageserver/node";

import type { CompletionAnalyzer, CompletionAnalyzerArgs } from "../types";
import keys from "./keys";

const completions: CompletionAnalyzer[] = [keys];

export const runAllCompletions = async (
  args: CompletionAnalyzerArgs
): Promise<CompletionItem[]> => {
  const allCompletions = await Promise.all(
    completions.map((completion) => completion(args))
  );

  return allCompletions.flat();
};
