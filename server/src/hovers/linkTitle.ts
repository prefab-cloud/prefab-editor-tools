import {
  type HoverAnalyzerArgs,
  type HoverAnalyzer,
  MethodType,
} from "../types";
import { methodAtPosition } from "../documentAnnotations";
import {
  getProjectEnvFromApiKey,
  filterForMissingKeys as defaultFilterForMissingKeys,
} from "../prefabClient";

const link: HoverAnalyzer = async ({
  document,
  log,
  position,
  settings,
  filterForMissingKeys,
}: HoverAnalyzerArgs) => {
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

  const { key, type, keyRange } = method;

  const { projectId } = getProjectEnvFromApiKey(settings.apiKey);

  switch (type) {
    case MethodType.GET:
      return {
        contents: `[${key}](https://app.prefab.cloud/account/projects/${projectId}/configs/${key})`,
        range: keyRange,
      };
    case MethodType.IS_ENABLED:
      return {
        contents: `[${key}](https://app.prefab.cloud/account/projects/${projectId}/flags/${key})`,
        range: keyRange,
      };
    default:
      return null;
  }
};

export default link;
