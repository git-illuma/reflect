import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { Optional } from "./optional";

describe("@Optional", () => {
  it("should work when used on property", () => {
    class TestClass {
      @Optional() public prop: any;
    }

    const { optional } = Reflect.getMetadata("illuma:optional", TestClass, "prop");
    expect(optional).toBe(true);
  });
});
