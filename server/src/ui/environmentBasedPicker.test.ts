import { describe,expect, it } from "bun:test";

import { type PrefabConfig } from "../prefab";
import { log } from "../testHelpers";
import { getOptions } from "./environmentBasedPicker";

const localFormatter = (projectEnvName: string, value: string) =>
  `Edit ${projectEnvName} ${value}`;
const remoteFormatter = (projectEnvName: string) =>
  `Edit ${projectEnvName} on prefab.cloud`;

const environments = [
  { id: "7", name: "Production" },
  { id: "6", name: "Staging" },
  { id: "5", name: "Development" },
];

const changedBy = {
  userId: 0,
  email: "jeffrey.chupp@prefab.cloud",
  apiKeyId: "",
};

const defaultOnly = {
  id: "16980840357367558",
  projectId: 3,
  key: "basic.value",
  changedBy,
  rows: [{ values: [{ value: { string: "this-is-default" } }] }],
  configType: "CONFIG",
  draftid: 509,
} as unknown as PrefabConfig;

const numericDefaultOnly = {
  id: "16980840357367557",
  projectId: 3,
  key: "basic.value",
  changedBy,
  rows: [{ values: [{ value: { int: 33 } }] }],
  configType: "CONFIG",
  draftid: 509,
} as unknown as PrefabConfig;

const basicValueForMultipleEnvs = {
  id: "16980840357367556",
  projectId: 3,
  key: "basic.value.in.multiple.envs",
  changedBy,
  rows: [
    { values: [{ value: { string: "this-is-default" } }] },
    { projectEnvId: 6, values: [{ value: { string: "this-is-staging" } }] },
    {
      projectEnvId: 5,
      values: [
        {
          criteria: [
            {
              propertyName: "user.key",
              operator: "PROP_IS_ONE_OF",
              valueToMatch: { stringList: { values: ["1234"] } },
            },
          ],
          value: { string: "test" },
        },
        { value: { string: "default-development" } },
      ],
    },
  ],
  configType: "CONFIG",
  draftid: 509,
} as unknown as PrefabConfig;

describe("getOptions", () => {
  it("shows per env options for defaultOnly", () => {
    const expected = [
      {
        canEditLocally: true,
        title: 'Edit Default "this-is-default"',
        currentValue: "this-is-default",
        projectEnvId: undefined,
        projectEnvName: "Default",
      },
      {
        canEditLocally: true,
        title: "Edit Production [inherit]",
        projectEnvId: "7",
        projectEnvName: "Production",
      },
      {
        canEditLocally: true,
        title: "Edit Staging [inherit]",
        projectEnvId: "6",
        projectEnvName: "Staging",
      },
      {
        canEditLocally: true,
        title: "Edit Development [inherit]",
        projectEnvId: "5",
        projectEnvName: "Development",
      },
    ];

    const actual = getOptions({
      config: defaultOnly,
      environments,
      localFormatter,
      remoteFormatter,
      log,
    });

    expect(actual).toEqual(expected);
  });

  it("shows per env options for numericDefaultOnly", () => {
    const expected = [
      {
        canEditLocally: true,
        title: "Edit Default 33",
        currentValue: 33,
        projectEnvId: undefined,
        projectEnvName: "Default",
      },
      {
        canEditLocally: true,
        title: "Edit Production [inherit]",
        projectEnvId: "7",
        projectEnvName: "Production",
      },
      {
        canEditLocally: true,
        title: "Edit Staging [inherit]",
        projectEnvId: "6",
        projectEnvName: "Staging",
      },
      {
        canEditLocally: true,
        title: "Edit Development [inherit]",
        projectEnvId: "5",
        projectEnvName: "Development",
      },
    ];

    const actual = getOptions({
      config: numericDefaultOnly,
      environments,
      localFormatter,
      remoteFormatter,
      log,
    });

    expect(actual).toEqual(expected);
  });

  it("shows per env options for basicValueForMultipleEnvs", () => {
    const expected = [
      {
        canEditLocally: true,
        title: 'Edit Default "this-is-default"',
        currentValue: "this-is-default",
        projectEnvId: undefined,
        projectEnvName: "Default",
      },
      {
        canEditLocally: true,
        title: 'Edit Staging "this-is-staging"',
        currentValue: "this-is-staging",
        projectEnvId: "6",
        projectEnvName: "Staging",
      },
      {
        canEditLocally: false,
        title: "Edit Development on prefab.cloud",
        projectEnvId: "5",
        projectEnvName: "Development",
      },
      {
        canEditLocally: true,
        title: "Edit Production [inherit]",
        projectEnvId: "7",
        projectEnvName: "Production",
      },
    ];

    const actual = getOptions({
      config: basicValueForMultipleEnvs,
      environments,
      localFormatter,
      remoteFormatter,
      log,
    });

    expect(actual).toEqual(expected);
  });
});
