import {
  isUnretryableError,
  type RetryableError,
  retryableError,
  type UnRetryableError,
  unretryableError,
} from "../types";
import { type ConfigValue, type PrefabConfig } from "./client";

type ConfigValueType = "string" | "stringList" | "int" | "bool" | "double";

const configValueType = (
  config: PrefabConfig
): ConfigValueType | UnRetryableError => {
  const value = config.rows.find((row) => row.values.length > 0)?.values[0]
    ?.value;

  if (!value) {
    return unretryableError(`No value found for config ${config.key}`);
  }

  return Object.keys(value)[0] as ConfigValueType;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER
//
// I'm using the raw value lest we are bitten from weird behavior in some runtime
//
// Note that the line here is somewhat arbitrary because in JavaScript land we
// shouldn't really be coercing numbers at all (but preserving them as
// strings). But we need some sort of line to determine when we swap from
// treating a numeric value as a `string` instead of an `int` and this feels
// like a decent place to draw that line.
const BIG_NUMBER = 2 ** 53;

const tooLargeToBeAnInt = (value: string) => {
  const number = Number(value);
  return number <= -BIG_NUMBER || number >= BIG_NUMBER;
};

const looksLikeAnInt = (value: string) => {
  return /^-?\d+$/.test(value);
};

const looksLikeADouble = (value: string) => {
  return /^-?\d+(\.\d+)?$/.test(value);
};

const coerce = (
  valueType: ConfigValueType,
  rawValue: string
): ConfigValue | RetryableError => {
  switch (valueType) {
    case "bool":
      if (
        rawValue.toLowerCase() !== "true" &&
        rawValue.toLowerCase() !== "false"
      ) {
        return retryableError(`Invalid boolean value: ${rawValue}`);
      }

      return { bool: rawValue.toLowerCase() === "true" };
    case "double":
      if (!looksLikeADouble(rawValue)) {
        return retryableError(`Invalid double value: ${rawValue}`);
      }

      return { double: Number(rawValue) };
    case "int":
      if (tooLargeToBeAnInt(rawValue)) {
        return retryableError(`Integer value too large: ${rawValue}`);
      }

      if (!looksLikeAnInt(rawValue)) {
        return retryableError(`Invalid integer value: ${rawValue}`);
      }

      return { int: parseInt(rawValue) };
    case "string":
      return { string: rawValue };
    case "stringList":
      return {
        stringList: {
          values: rawValue.trim().split(/\s*,\s*/),
        },
      };
  }
};

export const valueToConfigValue = (
  rawValue: string,
  config: PrefabConfig
): ConfigValue | UnRetryableError | RetryableError => {
  const valueType = configValueType(config);

  if (isUnretryableError(valueType)) {
    return valueType;
  }

  return coerce(valueType, rawValue);
};
