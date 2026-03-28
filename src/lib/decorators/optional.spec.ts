import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { Optional } from "./optional";

describe("@Optional", () => {
  it("should ignore when used on property", () => {
    class TestClass {
      // @ts-expect-error
      @Optional()
      public prop: any;
    }

    const isOptional = Reflect.getMetadata("illuma:optional", TestClass, "prop");
    expect(isOptional).toBeUndefined();
  });
});
