import { INJECTION_CFG_PATH } from "./metadata";

/**
 * Constructor parameter or property decorator to skip the current injector when resolving the dependency.
 *
 * @example
 * ```ts
 * @ReflectInjectable()
 * class MyService {
 *   constructor(
 *     @SkipSelf() private parentService: Service
 *   ) {}
 * }
 * ```
 */
export function SkipSelf(): ParameterDecorator & PropertyDecorator {
  return (
    target: any,
    propertyKey: string | symbol | undefined,
    parameterIndex?: number,
  ) => {
    const Ctor = typeof target === "function" ? target : target.constructor;
    const isProperty =
      typeof propertyKey !== "undefined" && typeof parameterIndex === "undefined";
    const isConstructorParam =
      typeof propertyKey === "undefined" && typeof parameterIndex !== "undefined";

    if (!isProperty && !isConstructorParam) {
      return target;
    }

    const metaKey = isProperty ? propertyKey : `param_${parameterIndex}`;
    const currentConfig = Reflect.getMetadata(INJECTION_CFG_PATH, Ctor, metaKey) || {};

    Reflect.defineMetadata(
      INJECTION_CFG_PATH,
      {
        ...currentConfig,
        skipSelf: true,
      },
      Ctor,
      metaKey,
    );

    return target;
  };
}
