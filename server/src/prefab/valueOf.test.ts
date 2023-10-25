import { describe,expect, it } from "bun:test";

import { valueOf } from "./valueOf";

describe("valueOf", () => {
  it("works for strings", () => {
    const value = {
      string: "string 1",
    };

    expect(valueOf(value)).toEqual("string 1");
  });

  it("works for weightedValues", () => {
    const value = {
      weightedValues: {
        weightedValues: [
          {
            weight: 25,
            value: {
              string: "string 2",
            },
          },
          {
            weight: 75,
            value: {
              string: "string 1",
            },
          },
        ],
        hashByPropertyName: "user.key",
      },
    };

    expect(valueOf(value)).toEqual("string 1: 75%, string 2: 25%");
  });
});
