import { Hover } from "vscode-languageserver/node";

import type { HoverAnalyzer, HoverAnalyzerArgs } from "../types";

import evaluations from "./evaluations";

const hovers: HoverAnalyzer[] = [evaluations];

export const runAllHovers = async (
  args: HoverAnalyzerArgs
): Promise<Hover | null> => {
  const allHovers = await Promise.all(hovers.map((hover) => hover(args)));

  const filteredHovers: Hover[] = allHovers.filter(
    (hover): hover is Hover => hover !== null
  );

  const firstHover = filteredHovers[0];

  if (!firstHover) {
    return null;
  }

  const hoverContent = filteredHovers.map((hover) => hover.contents).join("\n");

  return {
    contents: hoverContent,
    // This is a simplification
    range: firstHover.range,
  };
};
