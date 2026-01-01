/** biome-ignore-all lint/complexity/noBannedTypes: For decorators to work */
import { MultiNodeToken, NodeToken } from "@illuma/core";
import { ReflectInjectionError } from "../errors";
import { INJECTED_PATH, OPTIONAL_PATH, PROPS_PATH } from "./metadata";

export interface iInjectOptions {
  /** Whether the dependency is optional (default: false) */
  optional?: boolean;
}

/**
 * Parameter and Property decorator to manually inject a dependency using a token.
 * Useful when the type cannot be inferred or when using more abstract interfaces or types without inheritance from tokens via `nodeInject`.
 *
 * @param token - The injection token to resolve
 * @param options - Additional injection options, like marking the dependency as optional
 *
 * @example
 * ```ts
 * @ReflectInjectable()
 * class MyService {
 *   @Inject(CONFIG_TOKEN)
 *   private config: Config;
 *
 *   constructor(
 *     @Inject(LOGGER_TOKEN) private logger: Logger
 *   ) {}
 * }
 * ```
 */
export function Inject<T>(
  token: NodeToken<T> | MultiNodeToken<T>,
  opts?: iInjectOptions,
): (
  target: Object,
  propertyKey: string | symbol | undefined,
  parameterIndex?: number,
) => void;
export function Inject<T>(
  token: NodeToken<T> | MultiNodeToken<T>,
  opts?: iInjectOptions,
) {
  return (
    target: any,
    propKey: string | symbol | undefined,
    parameterIndex?: number,
  ): any => {
    const Ctor = typeof target === "function" ? target : target.constructor;

    // Property Injection
    if (typeof propKey !== "undefined" && typeof parameterIndex === "undefined") {
      Reflect.defineMetadata(INJECTED_PATH, token, Ctor, propKey);
      if (opts?.optional) {
        Reflect.defineMetadata(OPTIONAL_PATH, true, Ctor, propKey);
      }

      const props = Reflect.getMetadata(PROPS_PATH, Ctor) || [];
      props.push(propKey);
      Reflect.defineMetadata(PROPS_PATH, props, Ctor);

      return;
    }

    // Constructor Parameter Injection
    if (typeof propKey === "undefined" && typeof parameterIndex !== "undefined") {
      if (!(token instanceof NodeToken) && !(token instanceof MultiNodeToken)) {
        throw ReflectInjectionError.notToken();
      }

      Reflect.defineMetadata(INJECTED_PATH, token, Ctor, `param_${parameterIndex}`);

      if (opts?.optional) {
        Reflect.defineMetadata(OPTIONAL_PATH, true, Ctor, `param_${parameterIndex}`);
      }
    }

    return target;
  };
}
