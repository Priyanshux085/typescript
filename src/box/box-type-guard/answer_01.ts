import { Box } from "@box";
import ColorBox from "@/color-box";
import { FoodBox } from "@/food-box";

// ============================================================================
// CONDITIONAL TYPES & TYPE GUARDS (ADVANCED)
// ============================================================================
// 
// Conditional Types: T extends U ? X : Y (type-level if/else)
// - Allows runtime value checks to narrow types within scope
// - Example: type FirstElement<T> = T extends [infer U, ...any[]] ? U : never
// 
// Type Guards: Functions that perform runtime checks (value is Type)
// - Returns boolean and narrows type in conditional blocks
// - Examples: typeof x === 'string', instanceof Date, custom predicates
// 
// Challenge: Type-level safety ≠ Runtime safety. Conditional types guide
// the optimizer, but instanceof/typeof checks validate at runtime.
// ============================================================================

// Step 3: Transformation type that shows what each type becomes after serialization
type Serialized<T> = 
  T extends Date
    ? string
    : T extends Array<infer U>
      ? Serialized<U>[]
      : T extends Record<string, unknown>
        ? { [K in keyof T]: Serialized<T[K]> }
        : T; 

/**
 * SerializableBox: Extends Box<T> with safe JSON serialization
 * 
 * Uses the Serialized<T> conditional type to:
 * 1. Transform types at compile-time (Date -> string)
 * 2. Validate serializable types recursively
 * 3. Provide runtime type guards for safety
 * 
 * Type Safety Contract:
 * - IsSerializable<T> helps understand what's serializable at type-level
 * - Runtime guards (instanceof, typeof) validate actual values
 * - Recursive serialization handles nested objects and arrays
 */
class SerializableBox<T> extends Box<T> {

  /**
   * Safely serializes the box content to JSON-compatible format
   * 
   * @returns Serialized<T> - Transformed content (dates become ISO strings, recursively serializes nested objects/arrays)
   * @throws Error if content contains non-serializable types (functions, symbols, Map, Set)
   * 
   * Type-level guarantees: Return type reflects compile-time serialization
   * Runtime safety: Type guards validate actual content before serialization
   */
  safeSerialize(): Serialized<T> {
    const content = this.content;

  // use IsSerializable<T> to understand what should be serializable at type-level
  // but we must validate at runtime with type guards.

  if (content instanceof Date) {
    return content.toISOString() as Serialized<T>;
  }

  // ❌ NOT serializable: Map, Set
  if (content instanceof Map || content instanceof Set) {
    throw new Error(`${content.constructor.name} is not serializable.`);
  }

  // ✅ Serializable: Arrays
  if (Array.isArray(content)) {
    return content.map(item => 
      new SerializableBox(item).safeSerialize()
    ) as Serialized<T>;
  }

  // ✅ Serializable: Plain objects
  if (typeof content === 'object' && content !== null) {
    const serialized: Record<string, unknown> = {};
    for (const key in content) {
      if (Object.hasOwn(content, key)) {
        serialized[key] = new SerializableBox(
          (content as Record<string, unknown>)[key]
        ).safeSerialize();
      }
    }
    return serialized as Serialized<T>;
  }

  // ❌ NOT serializable: functions, symbols
  if (typeof content === 'function' || typeof content === 'symbol') {
    throw new Error(`${typeof content} is not serializable.`);
  }

  // ✅ Serializable: Primitives pass through
  return content as Serialized<T>;
  }
}

// ============================================================================
// TEST CASES: Demonstrating type-level vs runtime safety
// ============================================================================

// Test 1: FoodBox contains a Date (created at instance level)
// Serialized<FoodBox> = { content: string, expirationDate: string }
// Runtime: safeSerialize() converts Date to ISO string recursively
const foodBox = new FoodBox("Pizza", new Date("2024-12-31"));
const serializableFoodBox = new SerializableBox(foodBox);
console.log("FoodBox serialized:", serializableFoodBox.safeSerialize());
// Output: { content: 'Pizza', expirationDate: '2024-12-31T00:00:00.000Z' }

// Test 2: ColorBox contains a Date and color string
// Serialized<ColorBox> transforms nested Date to string at compile-time
const colorBox = new ColorBox("red", 6, "Color Inc.", new Date());
console.log("ColorBox (before serialization):", colorBox);
const serializableColorBox = new SerializableBox(colorBox);
console.log("ColorBox serialized:", serializableColorBox.safeSerialize());
// Output: { content: 'red', total_colors: 6, manufacturer: 'Color Inc.', created_at: '2026-03-21T...' }

// Test 3: Complex nested structure with arrays and objects
const complexBox = new SerializableBox({
  items: [new Date(), "text", 42],
  metadata: {
    created: new Date(),
    tags: ["ts", "advanced"]
  }
});
console.log("Complex nested structure serialized:", complexBox.safeSerialize());
// Output: Recursively serializes all Dates to ISO strings