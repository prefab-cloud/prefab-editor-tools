import { methodAtPosition } from "../documentAnnotations";
import {
  filterForMissingKeys as defaultFilterForMissingKeys,
  urlFor,
} from "../prefab";
import { type HoverAnalyzerArgs } from "../types";

type Dependencies = {
  providedUrlFor?: typeof urlFor;
};

const linkTitle = async ({
  document,
  log,
  position,
  filterForMissingKeys,
  providedUrlFor,
  settings,
}: HoverAnalyzerArgs & Dependencies) => {
  log("Hover", { link: { uri: document.uri, position } });

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

  const { key, keyRange } = method;

  const url = (providedUrlFor ?? urlFor)(key, settings);

  if (url) {
    const contents = `[${key}](${url})`;
    return { contents, range: keyRange };
  }

  return null;
};

export default linkTitle;
