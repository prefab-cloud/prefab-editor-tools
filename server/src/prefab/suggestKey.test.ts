import { describe,expect, it } from "bun:test";

import { suggestKey } from "./suggestKey";

describe("suggestKey", () => {
  it("turns a string into reasonable key", () => {
    expect(suggestKey("Hello World")).toEqual("hello.world");
    expect(suggestKey("POSTGRES_DB_NAME")).toEqual("postgres.db.name");
    expect(suggestKey("hello...there")).toEqual("hello.there");
  });
});
