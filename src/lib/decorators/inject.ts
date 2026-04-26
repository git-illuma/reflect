/** biome-ignore-all lint/complexity/noBannedTypes: For decorators to work */
import { MultiNodeToken, NodeToken } from "@illuma/core";
import { ReflectInjectionError } from "../errors";
import { INJECTED_PATH, INJECTION_CFG_PATH, PROPS_PATH } from "./metadata";

/** Options for the `@Inject` decorator */
export interface iInjectOptions {
  /** Whether the dependency is optional (default: false) */
  optional?: boolean;
  /** Whether to only look for the dependency in the current injector (default: false) */
  self?: boolean;
  /** Whether to skip the current injector and look in parent injectors (default: false) */
  skipSelf?: boolean;
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
    const isProperty =
      typeof propKey !== "undefined" && typeof parameterIndex === "undefined";
    const isConstructorParam =
      typeof propKey === "undefined" && typeof parameterIndex !== "undefined";

    // Ignore method parameters
    if (!isProperty && !isConstructorParam) {
      return target;
    }

    const metaKey = isProperty ? propKey : `param_${parameterIndex}`;

    // Property Injection
    if (isProperty) {
      Reflect.defineMetadata(INJECTED_PATH, token, Ctor, metaKey as string | symbol);
      const props = Reflect.getMetadata(PROPS_PATH, Ctor) || [];
      if (!props.includes(metaKey)) {
        props.push(metaKey);
        Reflect.defineMetadata(PROPS_PATH, props, Ctor);
      }
    } else if (isConstructorParam) {
      if (!(token instanceof NodeToken) && !(token instanceof MultiNodeToken)) {
        throw ReflectInjectionError.notToken();
      }

      Reflect.defineMetadata(INJECTED_PATH, token, Ctor, metaKey as string);
    }

    const currentConfig =
      Reflect.getMetadata(INJECTION_CFG_PATH, Ctor, metaKey as string | symbol) || {};
    Reflect.defineMetadata(
      INJECTION_CFG_PATH,
      {
        ...currentConfig,
        optional: opts?.optional ?? currentConfig.optional ?? false,
        self: opts?.self ?? currentConfig.self ?? false,
        skipSelf: opts?.skipSelf ?? currentConfig.skipSelf ?? false,
      },
      Ctor,
      metaKey as string | symbol,
    );

    return target;
  };
}
