import { post as defaultPost } from "../apiClient";
import type { ExecutableCommand, ExecutableCommandExecuteArgs } from "../types";
import extractKey from "./extractKey";

type Dependencies = {
  post?: typeof defaultPost;
};

const createBooleanFlag = async ({
  connection,
  key,
  log,
  refresh,
  post,
}: ExecutableCommandExecuteArgs & {
  key: string;
  post: typeof defaultPost;
}) => {
  const recipePaylod = {
    key,
    defaultValue: false,
  };

  const recipeRequest = await post(
    "/api/v1/config-recipes/feature-flag/boolean",
    recipePaylod
  );

  if (recipeRequest.status !== 200) {
    const error = await recipeRequest.text();

    connection.console.error(
      `Prefab: Failed to create boolean flag recipe: ${recipeRequest.status} | ${error}`
    );
    return;
  }

  const payload = (await recipeRequest.json()) as Record<string, unknown>;

  log("Command", { payload });

  const request = await post("/api/v1/config/", payload);

  if (request.status !== 200) {
    const error = await request.text();

    connection.console.error(
      `Prefab: Failed to create boolean flag: ${request.status} | ${error}`
    );
    return;
  }

  log("Command", `Prefab: Created boolean flag ${key}`);

  refresh();
};

type Args = ExecutableCommandExecuteArgs & Dependencies;

const createFlag: ExecutableCommand<Args> = {
  command: "prefab.createFlag",
  execute: async (args: Args) => {
    const { params, settings, log } = args;

    const post = args.post ?? defaultPost;

    log("Command", { createFlag: params, settings });

    const key = extractKey(params.arguments);

    return await createBooleanFlag({
      ...args,
      post,
      key,
    });
  },
};

export default createFlag;
