import { INJECTION_CFG_PATH } from "./metadata";

/**
 * Constructor parameter or property decorator to mark a dependency to be resolved only in the current injector.
 *
 * @example
 * ```ts
 * @ReflectInjectable()
 * class MyService {
 *   constructor(
 *     @Self() private service: Service
 *   ) {}
 * }
 * ```
 */
export function Self(): ParameterDecorator & PropertyDecorator {
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
        self: true,
      },
      Ctor,
      metaKey,
    );

    return target;
  };
}
