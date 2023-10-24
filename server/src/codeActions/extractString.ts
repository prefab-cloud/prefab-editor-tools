import { CodeActionKind } from "vscode-languageserver/node";

import {
  type CodeActionAnalyzer,
  type CodeActionAnalyzerArgs,
  CustomHandler,
} from "../types";
import { contains } from "../utils/positions";
import { stringAtPosition } from "../utils/stringAtPosition";
import { ensureSupportsCustomHandlers } from "./ensureSupportsCustomHandlers";

const requiredCustomHandlers = [CustomHandler.getInput];

const extractString: CodeActionAnalyzer = async (
  args: CodeActionAnalyzerArgs
) => {
  const { clientContext, document, params, log } = args;

  log("CodeActions", { extractString: document.uri });

  if (!clientContext.capabilities.workspace?.applyEdit) {
    log("CodeActions", "Client does not support workspace/applyEdit");
    return [];
  }

  if (
    !ensureSupportsCustomHandlers(requiredCustomHandlers, clientContext, log)
  ) {
    return [];
  }

  if (!document.sdk.configGet) {
    return [];
  }

  if (
    document.methodLocations.some((location) =>
      contains({ container: location.range, comparable: params.range })
    )
  ) {
    return [];
  }

  const identifiedString = stringAtPosition(
    document.textDocument.getText(),
    params.range.start
  );

  if (identifiedString) {
    return [
      {
        title: `Extract to config: ${identifiedString.value}`,
        kind: CodeActionKind.RefactorExtract,
        command: {
          title: `Extract to config: ${identifiedString.value}`,
          command: "prefab.extractConfig",
          arguments: [
            document.uri,
            identifiedString.value,
            identifiedString.range,
          ],
        },
      },
    ];
  }

  return [];
};

export default extractString;
