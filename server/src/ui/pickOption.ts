import { type Connection } from "vscode-languageserver/node";

import { type ClientContext, CustomHandler } from "../types";

const HANDLER = CustomHandler.pickOption;

export type Option<T> = {
  title: string;
} & T;

export const pickOption = async <T>({
  connection,
  clientContext,
  options,
  title,
}: {
  connection: Connection;
  clientContext: ClientContext;
  options: Option<T>[];
  title: string;
}): Promise<undefined | Option<T>> => {
  let chosenTitle: string;

  if (clientContext.customHandlers.includes(HANDLER)) {
    chosenTitle = await connection.sendRequest(HANDLER, {
      title,
      options: options.map((option) => option.title),
    });
  } else {
    const choice = await connection.window.showInformationMessage(
      title,
      ...options.map((option) => {
        return { title: option.title };
      }),
    );

    if (!choice) {
      return;
    }

    chosenTitle = choice.title;
  }

  if (chosenTitle) {
    return options.find((option) => option.title === chosenTitle);
  }
};

export const deprecatedPickOption = async ({
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
    }),
  );

  if (chosen) {
    return chosen.title;
  }
};

// This is either supported natively or through a custom handler
deprecatedPickOption.supported = () => true;
