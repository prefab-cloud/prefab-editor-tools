import { type Connection } from "vscode-languageserver/node";

import {
  type ClientContext,
  CustomHandler,
  type GetInputResponse,
} from "../types";

export const getInput = async ({
  connection,
  title,
}: {
  connection: Connection;
  title: string;
}): Promise<undefined | string> => {
  const result: GetInputResponse = await connection.sendRequest(
    CustomHandler.getInput,
    { title }
  );

  if (!result || !result.input) {
    return;
  }

  return result.input.trim();
};

getInput.supported = (clientContext: ClientContext) =>
  clientContext.customHandlers.includes(CustomHandler.getInput);
