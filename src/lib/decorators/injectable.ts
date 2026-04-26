import type { iInjectionNode, MultiNodeToken } from "@illuma/core";
import {
  extractToken,
  isInjectable,
  NodeToken,
  nodeInject,
  registerClassAsInjectable,
} from "@illuma/core";
import { ReflectInjectionError } from "../errors";
import { INJECTED_PATH, INJECTION_CFG_PATH, PROPS_PATH } from "./metadata";

/**
 * Class decorator that makes a class injectable via reflection (using `reflect-metadata`).
 * Automatically resolves dependencies from constructor parameters and properties decorated with `@Inject`.
 *
 * @example
 * ```ts
 * @ReflectInjectable()
 * class MyService {
 *   @Inject(CONFIG_TOKEN)
 *   private readonly config!: iConfig;
 *
 *   constructor(private otherService: OtherService) {}
 * }
 * ```
 */
export function ReflectInjectable<T>(): ClassDecorator {
  return (ctor: any) => {
    const paramTypes = Reflect.getMetadata("design:paramtypes", ctor) || [];
    const injections: iInjectionNode<any>[] = [];
    for (let i = 0; i < paramTypes.length; i++) {
      const paramType = paramTypes[i];
      if (paramType == null) {
        throw ReflectInjectionError.unknownCtorType(i, ctor.name);
      }

      const token = Reflect.getMetadata(INJECTED_PATH, ctor, `param_${i}`);
      const options = Reflect.getMetadata(INJECTION_CFG_PATH, ctor, `param_${i}`);
      if (token) {
        injections.push({
          token,
          optional: options?.optional || false,
          self: options?.self || false,
          skipSelf: options?.skipSelf || false,
        });
        continue;
      }

      // Check if NodeInjectable or ReflectInjectable
      if (isInjectable(paramType)) {
        const token = extractToken(paramType);
        injections.push({
          token,
          optional: options?.optional || false,
          self: options?.self || false,
          skipSelf: options?.skipSelf || false,
        });
        continue;
      }

      throw ReflectInjectionError.nonInjectableParam(i, ctor.name);
    }

    const props = Reflect.getMetadata(PROPS_PATH, ctor) || [];
    const propInjections: {
      prop: string | symbol;
      token: NodeToken<any> | MultiNodeToken<any>;
      optional: boolean;
      self: boolean;
      skipSelf: boolean;
    }[] = [];

    for (const prop of props) {
      const token = Reflect.getMetadata(INJECTED_PATH, ctor, prop);
      const options = Reflect.getMetadata(INJECTION_CFG_PATH, ctor, prop);
      if (token)
        propInjections.push({
          prop,
          token,
          optional: options?.optional || false,
          self: options?.self || false,
          skipSelf: options?.skipSelf || false,
        });
    }

    const nodeToken = new NodeToken<T>(`_${ctor.name}`, {
      factory: () => {
        const deps = injections.map((d) =>
          nodeInject(d.token, {
            optional: d.optional,
            self: d.self,
            skipSelf: d.skipSelf,
          }),
        );

        const instance = new ctor(...deps);
        for (const { prop, token, optional, self, skipSelf } of propInjections) {
          Object.defineProperty(instance, prop, {
            value: nodeInject(token, { optional, self, skipSelf }),
            configurable: true,
            enumerable: true,
            writable: true,
          });
        }

        return instance;
      },
    });

    registerClassAsInjectable(ctor, nodeToken);
    return ctor;
  };
}
