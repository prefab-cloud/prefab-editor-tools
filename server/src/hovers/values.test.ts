import { describe, expect, it } from "bun:test";

import { type PrefabConfig } from "../prefab";
import { log } from "../testHelpers";
import { type ClientContext, MethodType, type Settings } from "../types";
import values from "./values";

const defaultOnly = {
  id: "16980840357367558",
  projectId: 3,
  key: "basic.value",
  rows: [{ values: [{ value: { string: "this-is-default" } }] }],
  configType: "CONFIG",
} as unknown as PrefabConfig;

const flagWithWeights = {
  id: "16970304993831529",
  projectId: "2",
  key: "ex2.homepage-h1",
  rows: [
    {
      projectEnvId: "2",
      values: [
        {
          criteria: [
            {
              propertyName: "user.key",
              operator: "PROP_IS_ONE_OF",
              valueToMatch: {
                stringList: {
                  values: ["6af65bec-cebd-4bb3-a019-fae552d0ab0a"],
                },
              },
            },
          ],
          value: { string: "string 1" },
        },
        { value: { string: "string 2" } },
      ],
    },
    {
      projectEnvId: "3",
      values: [
        {
          value: {
            weightedValues: {
              weightedValues: [
                {
                  weight: 75,
                  value: {
                    string: "string 1",
                  },
                },
                {
                  weight: 25,
                  value: {
                    string: "string 2",
                  },
                },
              ],
              hashByPropertyName: "user.key",
            },
          },
        },
      ],
    },
    {
      projectEnvId: "4",
      values: [
        {
          criteria: [
            {
              propertyName: "user.key",
              operator: "PROP_IS_ONE_OF",
              valueToMatch: { stringList: { values: ["5"] } },
            },
          ],
          value: {
            string: "string 1",
          },
        },
        {
          value: {
            string: "string 2",
          },
        },
      ],
    },
  ],
  allowableValues: [{ string: "string 1" }, { string: "string 2" }],
  configType: "FEATURE_FLAG",
} as unknown as PrefabConfig;

const providedConfig = {
  id: "16983418120119478",
  projectId: "103",
  key: "favorite.shrek.movie",
  rows: [
    {
      values: [
        {
          value: {
            provided: { source: "ENV_VAR", lookup: "FAVORITE_SHREK_MOVIE" },
          },
        },
      ],
    },
  ],
  configType: "CONFIG",
  draftid: "118",
} as unknown as PrefabConfig;

const settings = {} as Settings;
const clientContext = {} as ClientContext;

const keyRange = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const range = {
  start: { line: 3, character: 20 },
  end: { line: 3, character: 40 },
};

const method = (config: PrefabConfig) => {
  return {
    key: config.key,
    type: MethodType.GET,
    range,
    keyRange,
  };
};

const environments = [
  {
    id: "2",
    name: "Production",
  },
  {
    id: "3",
    name: "Staging",
  },
  {
    id: "4",
    name: "Development",
  },
];

describe("values", () => {
  it("renders values for defaultOnly config", async () => {
    const result = await values({
      log,
      method: method(defaultOnly),
      settings,
      clientContext,
      providedGetConfigFromApi: () => Promise.resolve(defaultOnly),
      providedGetEnvironmentsFromApi: () => Promise.resolve(environments),
    });

    expect(result?.contents).toBe(
      "- Default: `this-is-default`\n- Development: `[inherit]`\n- Production: `[inherit]`\n- Staging: `[inherit]`"
    );
  });

  it("renders values for a feature flag", async () => {
    const result = await values({
      log,
      method: method(flagWithWeights),
      settings,
      clientContext,
      providedGetConfigFromApi: () => Promise.resolve(flagWithWeights),
      providedGetEnvironmentsFromApi: () => Promise.resolve(environments),
    });

    expect(result?.contents).toBe(
      "- Development: [see rules](https://api.prefab.cloud/account/projects/2/flags/ex2.homepage-h1?environment=4)\n- Production: [see rules](https://api.prefab.cloud/account/projects/2/flags/ex2.homepage-h1?environment=2)\n- Staging: 75% `string 1`, 25% `string 2`"
    );
  });

  it("can parse a provided config", async () => {
    const result = await values({
      log,
      method: method(providedConfig),
      settings,
      clientContext,
      providedGetConfigFromApi: () => Promise.resolve(providedConfig),
      providedGetEnvironmentsFromApi: () => Promise.resolve(environments),
    });

    expect(result?.contents).toBe(
      "- Default: `FAVORITE_SHREK_MOVIE` via ENV\n- Development: `[inherit]`\n- Production: `[inherit]`\n- Staging: `[inherit]`"
    );
  });
});
