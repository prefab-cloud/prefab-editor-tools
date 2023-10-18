import { InlayHint } from "vscode-languageserver/node";
import { InlayHintAnalyzer, InlayHintAnalyzerArgs } from "../types";

import overrides from "./overrides";

const ZERO_WIDTH_SPACE = "​";

export const inlayHints: InlayHintAnalyzer[] = [overrides];

export const runAllInlayHints = async (
  args: InlayHintAnalyzerArgs
): Promise<InlayHint[]> => {
  const allInlayHints = await Promise.all(
    inlayHints.map((inlayHint) => inlayHint(args))
  );

  return allInlayHints.flat();
};

export const NULL_HINT: InlayHint = {
  label: ZERO_WIDTH_SPACE,
  position: {
    line: 0,
    character: Number.MAX_SAFE_INTEGER,
  },
};
