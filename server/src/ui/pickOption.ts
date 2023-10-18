import { type Connection } from "vscode-languageserver/node";

import { type ClientContext, CustomHandler } from "../types";

const HANDLER = CustomHandler.pickOption;

export const pickOption = async ({
  connection,
  clientContext,
  options,
  title,
}: {
  connection: Connection;
  clientContext: ClientContext;
  options: string[];
  title: string;
}): Promise<undefined | string> => {
  if (clientContext.customHandlers.includes(HANDLER)) {
    return await connection.sendRequest(HANDLER, {
      title,
      options,
    });
  }

  const chosen = await connection.window.showInformationMessage(
    title,
    ...options.map((title) => {
      return { title };
    })
  );

  if (chosen) {
    return chosen.title;
  }
};

// This is either supported natively or through a custom handler
pickOption.supported = () => true;
