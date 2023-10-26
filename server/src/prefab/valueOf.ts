import { type ConfigValue, prefab } from "./client";

// TODO: remove this when the proto includes `provided`
export type Provided = {
  provided: {
    lookup: string;
  };
};

export const valueOf = (value: ConfigValue): ReturnType<typeof prefab.get> => {
  switch (Object.keys(value)[0]) {
    case "string":
      return value.string;
    case "stringList":
      return value.stringList?.values;
    case "int":
      return Number(value.int);
    case "bool":
      return value.bool;
    case "double":
      return Number(value.double);
    case "logLevel":
      return value.logLevel;
    case "weightedValues":
      return value.weightedValues?.weightedValues
        .sort((a, b) => b.weight - a.weight)
        .map((weightedValue) => {
          const value = weightedValue.value ? valueOf(weightedValue.value) : "";
          return `${value}: ${weightedValue.weight}%`;
        })
        .join(", ");
    case "provided":
      return (value as Provided).provided.lookup;
    default:
      throw new Error(`Unexpected value ${JSON.stringify(value)}`);
  }
};

export const valueOfToString = (value: ConfigValue): string => {
  const v = valueOf(value);

  if (typeof v === "string") {
    return v;
  }

  if (Array.isArray(v)) {
    return v.join(", ");
  }

  return JSON.stringify(v);
};
