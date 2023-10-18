import { describe,expect, it } from "bun:test";

import { retryableError } from "../types";
import { type ConfigValue,type PrefabConfig } from "./client";
import { valueToConfigValue } from "./valueToConfigValue";

const changedBy = {
  userId: 0,
  email: "jeffrey.chupp@prefab.cloud",
  apiKeyId: "",
};

const mkConfig = (value: ConfigValue): PrefabConfig => {
  return {
    id: "16980840357367558",
    projectId: 3,
    key: "basic.value",
    changedBy,
    rows: [{ values: [{ value }] }],
    configType: "CONFIG",
    draftid: 509,
  } as unknown as PrefabConfig;
};

describe("valueToConfigValue", () => {
  it("can handle a boolean config", () => {
    const config = mkConfig({ bool: true });

    ["true", "TrUe"].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual({
        bool: true,
      });
    });

    ["false", "FaLsE"].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual({
        bool: false,
      });
    });

    ["foo", "1", "hello,baz"].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual(
        retryableError(`Invalid boolean value: ${value}`)
      );
    });
  });

  it("can handle an int config", () => {
    const config = mkConfig({ int: 1 });

    [0, 1, -1, 99999999999999].forEach((value) => {
      expect(valueToConfigValue(value.toString(), config)).toEqual({
        int: value,
      });
    });

    ["02", "0000001"].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual({
        int: parseInt(value),
      });
    });

    ["99999999999999999999999"].forEach((value) => {
      expect(valueToConfigValue(value.toString(), config)).toEqual(
        retryableError(`Integer value too large: ${value}`)
      );
    });

    ["2.3", "hat", ""].forEach((value) => {
      expect(valueToConfigValue(value.toString(), config)).toEqual(
        retryableError(`Invalid integer value: ${value}`)
      );
    });
  });

  it("can handle an double config", () => {
    const config = mkConfig({ double: 1.0 });

    [0, 1, -1, 99999999999999, 2.3, 0.99].forEach((value) => {
      expect(valueToConfigValue(value.toString(), config)).toEqual({
        double: value,
      });
    });

    ["02", "0000001"].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual({
        double: parseInt(value),
      });
    });

    ["99999999999999"].forEach((value) => {
      expect(valueToConfigValue(value.toString(), config)).toEqual({
        double: Number("99999999999999"),
      });
    });

    // This rounds at higher bounds. I'm documenting this behavior, not condoning it.
    ["99999999999999999999999"].forEach((value) => {
      expect(valueToConfigValue(value.toString(), config)).toEqual({
        double: Number("100000000000000000000000"),
      });
    });

    ["hat", ""].forEach((value) => {
      expect(valueToConfigValue(value.toString(), config)).toEqual(
        retryableError(`Invalid double value: ${value}`)
      );
    });
  });

  it("can handle an string config", () => {
    const config = mkConfig({ string: "hi" });

    ["hi", "hello", "99", ""].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual({
        string: value,
      });
    });
  });

  it("can handle an string list config", () => {
    const config = mkConfig({
      stringList: {
        values: ["hi", "there"],
      },
    });

    ["hi", "hello", "99"].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual({
        stringList: { values: [value] },
      });
    });

    ["hi,there", "hi, there", "hi , there "].forEach((value) => {
      expect(valueToConfigValue(value, config)).toEqual({
        stringList: { values: ["hi", "there"] },
      });
    });

    // We keep a trailing blank value
    expect(valueToConfigValue("hi, there,", config)).toEqual({
      stringList: { values: ["hi", "there", ""] },
    });
  });
});
