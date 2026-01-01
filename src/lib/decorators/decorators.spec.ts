import { NodeContainer, NodeToken } from "@illuma/core";
import { Inject } from "./inject";
import { ReflectInjectable } from "./injectable";
import { Optional } from "./optional";

describe("Decorators safety", () => {
  it("should not overwrite method with property injection when @Inject is used on method parameter", () => {
    const TOKEN = new NodeToken<string>("TOKEN", { factory: () => "injected" });

    @ReflectInjectable()
    class TestClass {
      public method(@Inject(TOKEN) param: string) {
        return param;
      }
    }

    const container = new NodeContainer();
    container.provide(TestClass);
    container.bootstrap();

    const instance = container.get(TestClass);
    expect(typeof instance.method).toBe("function");
    expect(instance.method("test")).toBe("test");
  });

  it("should not affect constructor injection when @Optional is used on method parameter", () => {
    const TOKEN = new NodeToken<string>("TOKEN", { factory: () => "injected" });

    @ReflectInjectable()
    class TestClass {
      constructor(@Inject(TOKEN) public dep: string) {}

      public method(@Optional() _param: string) {}
    }

    const container = new NodeContainer();
    container.provide({ provide: TOKEN, value: "injected" });
    container.provide(TestClass);
    container.bootstrap();

    const instance = container.get(TestClass);
    expect(instance.dep).toBe("injected");
  });

  it("should not affect constructor injection when @Inject is used on method parameter", () => {
    const TOKEN_A = new NodeToken<string>("A", { factory: () => "A" });
    const TOKEN_B = new NodeToken<string>("B", { factory: () => "B" });

    @ReflectInjectable()
    class TestClass {
      constructor(@Inject(TOKEN_A) public dep: string) {}

      public method(@Inject(TOKEN_B) _param: string) {}
    }

    const container = new NodeContainer();
    container.provide({ provide: TOKEN_A, value: "A" });
    container.provide({ provide: TOKEN_B, value: "B" });
    container.provide(TestClass);
    container.bootstrap();

    const instance = container.get(TestClass);
    expect(instance.dep).toBe("A");
  });
});
