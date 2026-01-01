import {
  MultiNodeToken,
  NodeContainer,
  NodeInjectable,
  NodeToken,
  nodeInject,
} from "@illuma/core";
import { ReflectInjectionError } from "../errors";
import { Inject } from "./inject";
import { ReflectInjectable } from "./injectable";
import { PROPS_PATH } from "./metadata";
import { Optional } from "./optional";

describe("@ReflectInjectable", () => {
  describe("@ReflectInjectable and @NodeInjectable compatibility", () => {
    it("should register injection token on the constructor", () => {
      @ReflectInjectable()
      class TestClass {}

      const container = new NodeContainer();
      container.provide(TestClass);

      container.bootstrap();

      const resolved = container.get(TestClass);
      expect(resolved).toBeInstanceOf(TestClass);
    });

    it("should work fine with nodeInject", () => {
      const container = new NodeContainer();

      const token = new NodeToken<number>("DepToken");
      const multi = new MultiNodeToken<string>("MultiDepToken");
      const optional = new NodeToken<number>("OptionalDepToken");

      @ReflectInjectable()
      class DepClass {
        public readonly injection = nodeInject(token);
        public readonly multiInjection = nodeInject(multi);
        public readonly optionalInjection = nodeInject(optional, { optional: true });
      }

      container.provide({ provide: token, value: 42 });
      container.provide({ provide: multi, value: "hello" });
      container.provide({ provide: multi, value: "world" });
      container.provide(DepClass);

      container.bootstrap();

      const resolved = container.get(DepClass);
      expect(resolved.injection).toBe(42);
      expect(resolved.multiInjection).toEqual(expect.arrayContaining(["hello", "world"]));
      expect(resolved.optionalInjection).toBeFalsy();
    });
  });

  describe("should check constructor parameter types", () => {
    it("should accept constructor parameters decorated with @NodeInjectable", () => {
      const dep = new NodeToken<number>("NestedDepToken");

      @NodeInjectable()
      class ServiceA {
        public readonly value = nodeInject(dep);
      }

      @ReflectInjectable()
      class DepClass {
        constructor(public readonly service: ServiceA) {}
      }

      const container = new NodeContainer();
      container.provide(ServiceA);
      container.provide(DepClass);
      container.provide({ provide: dep, value: 42 });

      container.bootstrap();

      const resolved = container.get(DepClass);
      expect(resolved.service).toBeInstanceOf(ServiceA);
      expect(resolved.service.value).toBe(42);
    });

    it("should combine nodeInject() and constructor parameters", () => {
      const dep = new NodeToken<number>("NestedDepToken");

      @NodeInjectable()
      class ServiceA {}

      @ReflectInjectable()
      class DepClass {
        public readonly value = nodeInject(dep);
        constructor(public readonly service: ServiceA) {}
      }

      const container = new NodeContainer();
      container.provide(ServiceA);
      container.provide(DepClass);
      container.provide({ provide: dep, value: 42 });

      container.bootstrap();

      const resolved = container.get(DepClass);
      expect(resolved.service).toBeInstanceOf(ServiceA);
      expect(resolved.value).toBe(42);
    });

    it("should respect @Optional decorator on constructor parameters", () => {
      @NodeInjectable()
      class ServiceA {
        public readonly value = 42;
      }

      @ReflectInjectable()
      class DepClass {
        constructor(@Optional() public readonly service: ServiceA) {}
      }

      const container = new NodeContainer();
      container.provide(DepClass);

      container.bootstrap();
      const resolved = container.get(DepClass);
      expect(resolved.service).toBeNull();
    });

    it("should inject single tokens in constructor parameters decorated with @Inject", () => {
      const depToken = new NodeToken<number>("DepToken");

      @ReflectInjectable()
      class DepClass {
        constructor(@Inject(depToken) public readonly value: number) {}
      }

      const container = new NodeContainer();
      container.provide(DepClass);
      container.provide({ provide: depToken, value: 42 });
      container.bootstrap();

      const resolved = container.get(DepClass);
      expect(resolved.value).toBe(42);
    });

    it("should inject multi tokens in constructor parameters decorated with @Inject", () => {
      const multiDepToken = new MultiNodeToken<string>("MultiDepToken");

      @ReflectInjectable()
      class DepClass {
        constructor(@Inject(multiDepToken) public readonly values: string[]) {}
      }

      const container = new NodeContainer();
      container.provide(DepClass);
      container.provide({ provide: multiDepToken, value: "hello" });
      container.provide({ provide: multiDepToken, value: "world" });
      container.bootstrap();

      const resolved = container.get(DepClass);
      expect(resolved.values).toEqual(expect.arrayContaining(["hello", "world"]));
    });

    it("should allow optional injection in constructor parameters decorated with @Inject", () => {
      const optionalDepToken = new NodeToken<number>("OptionalDepToken");

      @ReflectInjectable()
      class DepClass {
        constructor(
          @Inject(optionalDepToken, { optional: true })
          public readonly value: number,
        ) {}
      }

      const container = new NodeContainer();
      container.provide(DepClass);
      container.bootstrap();

      const resolved = container.get(DepClass);
      expect(resolved.value).toBeNull();
    });

    it("should allow combining @Inject and @Optional decorators", () => {
      const optionalDepToken = new NodeToken<number>("OptionalDepToken");
      const otherToken = new NodeToken<number>("OtherToken");

      @ReflectInjectable()
      class DepClass {
        constructor(
          @Inject(optionalDepToken) @Optional() public readonly value: number,
          @Optional() @Inject(otherToken) public readonly otherValue: number,
        ) {}
      }

      const container = new NodeContainer();
      container.provide(DepClass);
      container.bootstrap();

      const resolved = container.get(DepClass);
      expect(resolved.value).toBeNull();
    });
  });

  describe("property injections", () => {
    it("should inject properties decorated with @Inject", () => {
      const propToken = new NodeToken<number>("PropToken");

      @ReflectInjectable()
      class DepClass {
        @Inject(propToken)
        public readonly value!: number;
      }

      const container = new NodeContainer();
      container.provide(DepClass);
      container.provide({ provide: propToken, value: 42 });
      container.bootstrap();
      const resolved = container.get(DepClass);

      expect(resolved.value).toBe(42);
    });

    it("should allow optional property injections decorated with @Inject", () => {
      const optionalPropToken = new NodeToken<number>("OptionalPropToken");

      @ReflectInjectable()
      class DepClass {
        @Inject(optionalPropToken, { optional: true })
        public readonly value!: number;
      }

      const container = new NodeContainer();
      container.provide(DepClass);
      container.bootstrap();
      const resolved = container.get(DepClass);

      expect(resolved.value).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should throw error when constructor parameter is not injectable", () => {
      expect(() => {
        @ReflectInjectable()
        class DepClass {
          constructor(public readonly value: string) {}
        }

        const container = new NodeContainer();
        container.provide(DepClass);
        container.bootstrap();
        container.get(DepClass);
      }).toThrow(ReflectInjectionError);
    });
  });

  describe("edge cases", () => {
    it("should throw unknownCtorType when param type is undefined", () => {
      const originalGetMetadata = Reflect.getMetadata;
      const spy = jest
        .spyOn(Reflect, "getMetadata")
        .mockImplementation((key, target, propertyKey) => {
          if (key === "design:paramtypes") {
            return [undefined];
          }
          return originalGetMetadata(key, target, propertyKey);
        });

      try {
        expect(() => {
          @ReflectInjectable()
          class _TestClass {
            constructor(public dep: any) {}
          }
        }).toThrow(ReflectInjectionError);
      } finally {
        spy.mockRestore();
      }
    });

    it("should handle missing design:paramtypes", () => {
      const originalGetMetadata = Reflect.getMetadata;
      const spy = jest
        .spyOn(Reflect, "getMetadata")
        .mockImplementation((key, target, propertyKey) => {
          if (key === "design:paramtypes") {
            return undefined;
          }
          return originalGetMetadata(key, target, propertyKey);
        });

      try {
        @ReflectInjectable()
        class TestClass {}

        const container = new NodeContainer();
        container.provide(TestClass);
        container.bootstrap();
        expect(container.get(TestClass)).toBeInstanceOf(TestClass);
      } finally {
        spy.mockRestore();
      }
    });

    it("should skip property injection if token is missing", () => {
      @ReflectInjectable()
      class TestClass {}

      const props = Reflect.getMetadata(PROPS_PATH, TestClass) || [];
      props.push("missingTokenProp");
      Reflect.defineMetadata(PROPS_PATH, props, TestClass);

      const container = new NodeContainer();
      container.provide(TestClass);
      container.bootstrap();

      const instance = container.get(TestClass);
      expect((instance as any).missingTokenProp).toBeUndefined();
    });
  });
});
