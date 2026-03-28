import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./src/setup.vitest.ts"],
    coverage: {
      provider: "v8",
      reporter: ["json-summary", "text"],
      reportsDirectory: "artifacts/coverage",
      include: ["src/**/*.ts"],
      exclude: [
        "src/lib/errors.ts",
        "src/**/*.{d,types}.ts",
        "src/**/types.ts",
        "src/**/index.ts",
      ],
    },
    environment: "node",
  },
});
