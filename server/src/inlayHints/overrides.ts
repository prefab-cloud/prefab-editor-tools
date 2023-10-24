import { InlayHint } from "vscode-languageserver/node";

import {
  overrideKeys,
  overrides as prefabOverrides,
  valueOfToString,
} from "../prefabClient";
import { InlayHintAnalyzer, InlayHintAnalyzerArgs } from "../types";

const pad = (value: string) => ` ${value} `;

const overrides: InlayHintAnalyzer = async ({
  document,
  log,
}: InlayHintAnalyzerArgs) => {
  log("InlayHint", {
    methodLocations: document.methodLocations,
  });

  return document.methodLocations
    .filter(({ key }) => overrideKeys.includes(key))
    .map((method) => {
      const override = prefabOverrides[method.key];
      const label: string = pad(valueOfToString(override));

      log("InlayHint", {
        key: method.key,
        label,
        override,
      });

      const hint: InlayHint = {
        position: {
          line: method.keyRange.end.line,
          character: method.keyRange.end.character + 1,
        },
        label,
      };

      return hint;
    });
};

export default overrides;
