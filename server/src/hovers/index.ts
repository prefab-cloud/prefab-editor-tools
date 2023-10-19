import { Hover } from "vscode-languageserver/node";

import type { HoverAnalyzer, HoverAnalyzerArgs } from "../types";
import { get } from "../apiClient";
import { urlFor } from "../prefabClient";

import evaluations from "./evaluations";
import linkTitle from "./linkTitle";

// This order matters since it determines how content is concatenated
const hovers: HoverAnalyzer[] = [linkTitle, evaluations];

type Dependencies = {
  providedGet?: typeof get;
  providedUrlFor?: typeof urlFor;
};

export const runAllHovers = async (
  args: HoverAnalyzerArgs & Dependencies
): Promise<Hover | null> => {
  const allHovers = await Promise.all(hovers.map((hover) => hover(args)));

  const filteredHovers: Hover[] = allHovers.filter(
    (hover): hover is Hover => hover !== null
  );

  const firstHover = filteredHovers[0];

  if (!firstHover) {
    return null;
  }

  const hoverContent = filteredHovers
    .map((hover) => hover.contents)
    .join("\n\n");

  return {
    contents: hoverContent,
    // This is a simplification
    range: firstHover.range,
  };
};
