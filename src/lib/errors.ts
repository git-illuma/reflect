import { InjectionError } from "@illuma/core";

export class ReflectInjectionError extends InjectionError {
  constructor(code: number, message: string) {
    super(code, message);
    this.name = "ReflectInjectionError";
    this.message = `[ri${code}]: ${message}`;
  }

  public static unknownCtorType(i: number, ctorName: string): ReflectInjectionError {
    return new ReflectInjectionError(
      100,
      `Cannot apply @ReflectInjectable() to ${ctorName}: constructor parameter at index ${i} is of unknown type.`,
    );
  }

  public static nonInjectableParam(i: number, ctorName: string): ReflectInjectionError {
    return new ReflectInjectionError(
      101,
      `Cannot apply @ReflectInjectable() to ${ctorName}: constructor parameter at index ${i} is not injectable.`,
    );
  }

  public static notToken(): ReflectInjectionError {
    return new ReflectInjectionError(
      200,
      `Inject decorator can only be used with NodeToken or MultiNodeToken.`,
    );
  }
}
