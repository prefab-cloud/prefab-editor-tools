import { Hover } from "vscode-languageserver/node";

import { get } from "../apiClient";
import { methodAtPosition } from "../documentAnnotations";
import {
  filterForMissingKeys as defaultFilterForMissingKeys,
  urlFor,
} from "../prefab";
import type { HoverAnalyzer, HoverAnalyzerArgs } from "../types";
import evaluations from "./evaluations";
import linkTitle from "./linkTitle";

// This order matters since it determines how content is concatenated
const hovers: HoverAnalyzer[] = [linkTitle, evaluations];

type Dependencies = {
  providedGet?: typeof get;
  providedUrlFor?: typeof urlFor;
};

export const runAllHovers = async (
  args: Omit<HoverAnalyzerArgs, "method"> & Dependencies
): Promise<Hover | null> => {
  const { filterForMissingKeys, log, document, position } = args;

  const method = methodAtPosition(document, position);

  if (!method) {
    log("Hover", "No method found at position");
    return null;
  }

  const missingKeyMethods = await (
    filterForMissingKeys ?? defaultFilterForMissingKeys
  )([method]);

  if (missingKeyMethods.length > 0) {
    log("Hover", "Key does not exist");
    return null;
  }

  const allHovers = await Promise.all(
    hovers.map((hover) => hover({ ...args, method }))
  );

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
