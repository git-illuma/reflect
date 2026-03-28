import type { Ctor, iInjectionNode, MultiNodeToken } from "@illuma/core";
import {
  extractToken,
  isInjectable,
  NodeToken,
  nodeInject,
  registerClassAsInjectable,
} from "@illuma/core";
import { ReflectInjectionError } from "../errors";
import { INJECTED_PATH, OPTIONAL_PATH, PROPS_PATH } from "./metadata";

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
export function ReflectInjectable<T>() {
  return (ctor: Ctor<T>): Ctor<T> => {
    const paramTypes = Reflect.getMetadata("design:paramtypes", ctor) || [];
    const injections: iInjectionNode<any>[] = [];
    for (let i = 0; i < paramTypes.length; i++) {
      const paramType = paramTypes[i];
      if (paramType == null) {
        throw ReflectInjectionError.unknownCtorType(i, ctor.name);
      }

      const token = Reflect.getMetadata(INJECTED_PATH, ctor, `param_${i}`);
      const optional = !!Reflect.getMetadata(OPTIONAL_PATH, ctor, `param_${i}`);
      if (token) {
        injections.push({ token, optional });
        continue;
      }

      // Check if NodeInjectable or ReflectInjectable
      if (isInjectable(paramType)) {
        const token = extractToken(paramType);
        injections.push({ token, optional });
        continue;
      }

      throw ReflectInjectionError.nonInjectableParam(i, ctor.name);
    }

    const props = Reflect.getMetadata(PROPS_PATH, ctor) || [];
    const propInjections: {
      prop: string | symbol;
      token: NodeToken<any> | MultiNodeToken<any>;
      optional: boolean;
    }[] = [];

    for (const prop of props) {
      const token = Reflect.getMetadata(INJECTED_PATH, ctor, prop);
      const optional = !!Reflect.getMetadata(OPTIONAL_PATH, ctor, prop);
      if (token) propInjections.push({ prop, token, optional });
    }

    const nodeToken = new NodeToken<T>(`_${ctor.name}`, {
      factory: () => {
        const deps = injections.map((d) => nodeInject(d.token, { optional: d.optional }));
        const instance = new ctor(...deps);

        for (const { prop, token, optional } of propInjections) {
          (instance as any)[prop] = nodeInject(token, { optional });
        }

        return instance;
      },
    });

    registerClassAsInjectable(ctor, nodeToken);
    return ctor;
  };
}
