/**
 * ADVANCED GENERIC PATTERNS WITH BOX
 * 
 * Mastering TypeScript's generic system through real-world Box implementations.
 * These exercises explore variance, distribution, and recursive type transformations.
 */

/**
 * @question1: Generic Variance & Covariance/Contravariance (Advanced)
 * 
 * Create a `BoxConsumer<T>` interface that accepts a Box<T> as input:
 * ```
 * interface BoxConsumer<T> {
 *   consume(box: Box<T>): void;
 * }
 * ```
 * 
 * Then explore type safety relationships:
 * - Is BoxConsumer<Dog> assignable to BoxConsumer<Animal>? (contravariance)
 * - Create a `VariantBox<out T>` using variance modifiers (out for covariance)
 * - Implement `readBox<T>(box: VariantBox<T>): T` (safe covariance)
 * - Implement `writeBox<T>(box: Box<T>, item: T): void` (safe contravariance)
 * 
 * Test cases:
 * - Can you assign a Consumer<Animal> where Consumer<Dog> is expected?
 * - What breaks when you remove variance modifiers?
 * - Why does VariantBox<out T> prevent write operations?
 * 
 * Challenge: Create a `BoxStore<T>` generic class that safely handles both
 * reading (covariant) and writing (contravariant) operations without
 * compromising type safety.
 * 
 * Deep dive questions:
 * - When is contravariance useful in real APIs?
 * - Why can't Box<T> be covariant over T?
 * - How do method signatures interact with variance?
 */

export * from "./answer_01";

/**
 * @question2: Recursive Generic Types & Deeply Nested Structures (Advanced)
 * 
 * Create a `DeepBox<T>` that can be infinitely nested:
 * ```typescript
 * type DeepBox<T> = Box<T | DeepBox<T>>;
 * ```
 * 
 * Implement the following utilities and methods:
 * 1. `type UnwrapDeep<T>` - Recursively unwraps all nested DeepBox layers to get the final T
 *    Example: UnwrapDeep<DeepBox<DeepBox<string>>> => string
 * 
 * 2. `type Depth<T>` - Calculates nesting depth
 *    Example: Depth<DeepBox<DeepBox<string>>> => 2
 * 
 * 3. `type DeepPick<T, K>` - Picks properties from deeply nested generics
 * 
 * 4. Create a `recursiveDisplay<T>(box: DeepBox<T>, maxDepth?: number): string[]`
 *    that returns an array of contents at each nesting level
 * 
 * Practical challenge: Implement a `LinkedBox<T>` where each Box can point to
 * another Box, creating a chain structure:
 * ```typescript
 * class LinkedBox<T> extends Box<T> {
 *   next?: LinkedBox<T> | LinkedBox<U>;
 *   link<U>(box: LinkedBox<U>): LinkedBox<T | U>;
 * }
 * ```
 * 
 * Test scenarios:
 * - Create a chain: Box<number> -> Box<string> -> Box<boolean>
 * - Ensure type safety across chain operations
 * - Implement `reduce()` method that traverses the chain
 * 
 * Questions to explore:
 * - How do recursive types affect compilation time?
 * - When does TypeScript hit recursion limits?
 * - How can you make recursive types more performant?
 */

// export * from "./answer_02";

/**
 * @question3: Distributive Conditional Types & Union Type Handling (Advanced)
 * 
 * Conditional types distribute over union types when used in type arguments.
 * Create a `UnionBox<T>` that leverages this behavior:
 * 
 * 1. Type `Distribute<T>` that applies transformations differently per union member:
 *    ```typescript
 *    type Distribute<T> = T extends string ? Box<T & { type: 'text' }> 
 *                         : T extends number ? Box<T & { type: 'numeric' }>
 *                         : Box<T>;
 *    ```
 * 
 * 2. `type ExtractBoxTypes<T>` - Given Distribute<string | number | Date>,
 *    extract individual box types into a union: 
 *    Result should be: Box<...> | Box<...> | Box<...>
 * 
 * 3. Create `BoxFactory` with overloaded generic methods:
 *    - boxOf<T extends string>(content: T): Box<T & { type: 'text' }>
 *    - boxOf<T extends number>(content: T): Box<T & { type: 'numeric' }>
 *    - boxOf<T extends Date>(content: T): Box<T & { type: 'temporal' }>
 * 
 * 4. Implement `MultiBox<T extends any[]>` that creates a tuple of boxes:
 *    ```typescript
 *    class MultiBox<T extends any[]> {
 *      boxes: { [K in keyof T]: Box<T[K]> };
 *      constructor(...contents: T)
 *    }
 *    ```
 *    Usage: new MultiBox("hello", 42, true) 
 *    Type:  MultiBox<[string, number, boolean]>
 * 
 * Advanced challenge: Create a `ConditionalChain<T extends any[]>` where:
 * - Each box type depends on previous box content
 * - When chaining Box<string> then Box<number>, enforce type constraints
 * - Use distributive conditionals to automatically select box constructor
 *
 * Test scenarios:
 * - new MultiBox("test", 123, new Date()) //inferred correctly
 * - Hover over types - verify correct inference for each position
 * - Create chains with mixed types and verify runtime safety
 * 
 * Critical questions:
 * - Why doesn't distribution happen with Box<T | U> syntax?
 * - When should you use `extends T[] ? never : T` to disable distribution?
 * - How do conditional types in constraints differ from conditional types in bodies?
 * - What's the difference: T extends U ? X : Y vs (T | U) extends T ? X : Y?
 */

// export * from "./answer_03";
