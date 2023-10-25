import { urlFor } from "../prefab";
import { type HoverAnalyzerArgs } from "../types";

type Dependencies = {
  providedUrlFor?: typeof urlFor;
};

const linkTitle = async ({
  providedUrlFor,
  settings,
  method,
}: Pick<HoverAnalyzerArgs, "settings" | "method"> & Dependencies) => {
  const { key, keyRange } = method;

  const url = (providedUrlFor ?? urlFor)(key, settings);

  if (url) {
    const contents = `[${key}](${url})`;
    return { contents, range: keyRange };
  }

  return null;
};

export default linkTitle;
