/**
 * @todo Implement a Box class that can hold any type of content, with methods to set and get the content. --- IGNORE ---
 * @question1: Conditional Types & Type Guards (Advanced)
 * 
 * Create a conditional type `Serializable<T>` that determines if T is JSON-compatible:
 * - Returns true for: string, number, boolean, null, array of serializable types, plain objects
 * - Returns false for: Date, Map, Set, functions, symbols
 * 
 * Then implement a `safeSerialize<T>(box: Box<T>): Serializable<T>` method that:
 * - Uses type guards to validate the Box content at runtime
 * - Converts non-serializable types appropriately (e.g., Date -> ISO string)
 * - Returns the serialized content or throws an informative error
 * 
 * Test with multiple Box instances: Box<Person>, Box<Date>, Box<number[]>
 * What challenges arise with type-level vs. runtime safety?
 */

export * from "./answer_01";

/**
 * @question2: Mapped Types & Generic Type Extraction (Advanced)
 * 
 * Create a mapped type `BoxRegistry<Boxes extends Record<string, Box<any>>>` that extracts
 * the content type from each Box instance in an object.
 * 
 * Example transformation:
 * Input:  { userBox: Box<User>, countBox: Box<number> }
 * Output: { userBox: User, countBox: number }
 * 
 * Then create a `BoxFactory` class with a generic method that:
 * - Takes a BoxRegistry configuration object
 * - Returns instances with correctly typed content
 * - Validates that the registry keys match instantiated boxes
 * 
 * Bonus: Implement conditional extraction that handles Box<Box<T>> (nested generics)
 * Hint: Use Conditional Types and Mapped Types together
 */

export * from "./answer_02";

/**
 * @question3: Generic Constraints with Utility Types (Advanced)
 * 
 * Create a `StrictBox<T extends { id: string; metadata: Record<string, unknown> }>` class that:
 * - Only accepts objects with mandatory `id` and `metadata` properties
 * - Uses the Readonly<T> utility type to make content immutable after creation
 * - Implements a `validate()` method using type guards to ensure content shape at runtime
 * - Adds a `merge<U>(updates: Partial<T>): StrictBox<T>` method using generic constraints
 * 
 * Then create a discriminated union of valid content types and use `satisfies` keyword:
 * type ValidContent = { type: 'user' } | { type: 'product' } | { type: 'order' }
 * 
 * Test the type safety at compile-time and runtime behavior with:
 * - Valid objects matching the constraint
 * - Invalid objects (missing required properties)
 * - Attempting to mutate content (should fail at compile time)
 * 
 * What's the trade-off between compile-time constraints and runtime validation?
 */