import { InlayHint } from "vscode-languageserver/node";
import { InlayHintAnalyzer, InlayHintAnalyzerArgs } from "../types";

import overrides from "./overrides";

export const inlayHints: InlayHintAnalyzer[] = [overrides];

export const runAllInlayHints = async (
  args: InlayHintAnalyzerArgs
): Promise<InlayHint[]> => {
  const allInlayHints = await Promise.all(
    inlayHints.map((inlayHint) => inlayHint(args))
  );

  return allInlayHints.flat();
};
