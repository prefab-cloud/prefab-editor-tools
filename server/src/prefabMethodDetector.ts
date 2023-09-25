import { ConfigType, type ConfigTypeValue } from "./prefabClient";
import { TextDocument } from "vscode-languageserver-textdocument";
import { Position } from "vscode-languageserver/node";
import { currentLine } from "./documentHelpers";

type HeuristicParams = {
  document: TextDocument;
  position: Position;
  line: string;
};

type Heuristic = RegExp | ((params: HeuristicParams) => boolean);

const JS_HEURISTICS = {
  [ConfigType.FEATURE_FLAG]: /prefab\.(isEnabled|isFeatureEnabled)\(["']$/,
  [ConfigType.CONFIG]: /prefab\.get\(["']$/,
};

const REACT_HEURISTICS = {
  [ConfigType.FEATURE_FLAG]: ({ document, line }: HeuristicParams): boolean => {
    const text = document.getText();

    return text.includes("usePrefab(") && /isEnabled\(["']$/.test(line);
  },
  [ConfigType.CONFIG]: ({ document, line }: HeuristicParams) => {
    const text = document.getText();

    return text.includes("usePrefab(") && /get\(["']$/.test(line);
  },
};

const METHOD_HEURISTICS: Record<string, Record<ConfigTypeValue, Heuristic>> = {
  ruby: {
    [ConfigType.FEATURE_FLAG]: /prefab\.enabled\?\(["']$/,
    [ConfigType.CONFIG]: /prefab\.get\(["']$/,
  },
  javascript: JS_HEURISTICS,
  typescript: JS_HEURISTICS,
  javascriptreact: REACT_HEURISTICS,
  typescriptreact: REACT_HEURISTICS,
};

const call = (
  heuristic: Heuristic,
  document: TextDocument,
  position: Position
) => {
  const line = currentLine(document, position);

  if (!line) {
    return false;
  }

  if (typeof heuristic === "function") {
    return heuristic({ document, position, line });
  }

  return heuristic.test(line);
};

export const getMethodFromContext = (
  document: TextDocument,
  position: Position
): ConfigTypeValue | null => {
  const lang = document.languageId;

  if (METHOD_HEURISTICS[lang]) {
    const heuristics = METHOD_HEURISTICS[lang];

    if (call(heuristics[ConfigType.FEATURE_FLAG], document, position)) {
      return ConfigType.FEATURE_FLAG;
    }

    if (call(heuristics[ConfigType.CONFIG], document, position)) {
      return ConfigType.CONFIG;
    }
  }

  return null;
};
