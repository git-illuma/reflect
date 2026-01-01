# @illuma/core-reflect – Reflect Metadata Plugin for Illuma

![NPM Version](https://img.shields.io/npm/v/%40illuma%2Freflect)
![NPM Downloads](https://img.shields.io/npm/dw/%40illuma%2Freflect)
![npm bundle size](https://img.shields.io/bundlephobia/min/%40illuma%2Freflect)
![Test coverage](./badges/coverage.svg)

[Illuma](https://github.com/git-illuma/core) plugin for reflect-metadata based dependency injection to declare dependencies via constructor parameters and decorators.

> [!NOTE]
> This package is in early development. Expect API changes in minor versions.

## Features
- Leverages `reflect-metadata` to automatically resolve constructor dependencies by type.
- Provides `@Inject` decorator for token-based injection on properties and constructor parameters.
- Supports optional dependencies via `@Optional` decorator.

## Installation

Assuming you have `@illuma/core` installed, you can add this plugin and `reflect-metadata` via Yarn or NPM:

```bash
yarn add @illuma/core-reflect reflect-metadata
# or
npm install @illuma/core-reflect reflect-metadata
```

## Usage

This plugin provides decorators to enable reflection-based dependency injection with `@illuma/core`.

```typescript
import "reflect-metadata"; // Import this once at the entry point
import { NodeContainer, NodeInjectable, NodeToken, nodeInject } from "@illuma/core";
import { ReflectInjectable, Inject, Optional } from "@illuma/core-reflect";

// Define tokens
const API_KEY = new NodeToken<string>("API_KEY");

// Standard Illuma service
@NodeInjectable()
class Logger {
  public log(message: string) {
    console.log(message);
  }
}

// Service using ReflectInjectable
@ReflectInjectable()
class UserService {
  // Compatible with nodeInject property injection
  private readonly config = nodeInject(CONFIG_TOKEN);

  constructor(
    // Automatically resolved by type
    private readonly logger: Logger,

    // Optional dependency
    @Optional() private readonly tracer?: TracerService,

    // Token injection
    @Inject(API_KEY) private readonly key: string,
  ) {}

  public greet() {
    this.logger.log(`Hello! Key: ${this.apiKey}`);
  }
}

// Setup container
const container = new NodeContainer();

container.provide({ provide: API_KEY, value: "secret-123" });
container.provide(Logger);
container.provide(UserService);

container.bootstrap();

// Resolve
const user = container.get(UserService);
user.greet();
```

## Compatibility

`@illuma/core-reflect` is fully compatible with standard `@illuma/core` decorators and injection methods. You can mix and match `@NodeInjectable`, `nodeInject`, and `@ReflectInjectable`, `@Inject` as needed.

## Features

- `@ReflectInjectable()`: Marks a class as injectable (similarly to `@NodeInjectable()`) and resolves constructor dependencies automatically.
- `@Inject(token)`: Property or parameter decorator for token injection, alternative to `nodeInject`.
- `@Optional()`: Marks a constructor dependency as optional.

## License

MIT
