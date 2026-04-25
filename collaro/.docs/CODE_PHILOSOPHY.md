# Code Philosophy of this project.

## Tech Stack 
- **Language**: TypeScript
- **Runtime**: Bun
- **SDK**: Stream, Vapi SDK, 
- **Testing**: Vitest

## Code Style
- Use `camelCase` for variable and function names.
- Use `PascalCase` for class and interface names.
- Use `UPPER_SNAKE_CASE` for constants.
- Use `kebab-case` for file and directory names.
- Use `//` for single-line comments and `/* */` for multi-line comments.

### Code Structure
- Organize code into modules based on functionality.
- Each module should have a clear and single responsibility.
- Share common utilities and types in a separate `utils` directory.
- Use a common `utils/types.ts` file for TypeScript type definitions.
- For a branding types, use or enhance the `ID` function from the `utils/generate.ts` file.

### Module Implementation
- Each module should have teh following structure in their `moduleName` directory (user CamelCase for module names):
  - `index.ts`: Main entry point for the module.
  - `interface.ts`: Define interfaces to the module.
  - `class.ts`: Implement the main class or functions for the module.
  - `store.ts`: If the module has data management needs, implement a store for state management.
  - `validator.ts`: If the module has validation logic, implement it in a separate file.
  - `moduleName-utils.ts`: For any private helper functions that are only used within the module, define them in this file and do not export them directly.
- Example:
  ```
  /src
    /user
      index.ts
      interface.ts
      class.ts
      store.ts (if needed)
      validator.ts (if needed)
      user-utils.ts (if needed)
  ```

- Each module should export its main functionality through the `index.ts` file, which serves as the public API for that module.
- For a shared utility function, such as `ID`, it should be defined in the `utils/generate.ts` file and exported from there.
- For a shared type definition, such as `User`, it should be defined in the `utils/types.ts` file and exported from there.
- For a private helper function that is only used within a module, it should be defined in the `moduleName-utils.ts` file within the same module directory and not exported directly.
- For example, if there is a helper function `formatUserName` that is only used within the `UserModule`, it should be defined in `UserModule/UserModule-utils.ts` and not exported from `index.ts`.