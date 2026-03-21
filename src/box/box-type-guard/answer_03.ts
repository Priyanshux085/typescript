import { Box, type IBox } from "@box";

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
interface basic {
  id: string;
  metadata: Record<string, unknown>
}

export interface IStrictBox<T extends basic> extends IBox<T> {
  validate(): string | undefined;
  merge<U extends Partial<T>>(updates: U): IStrictBox<T>;
}

export class StrictBox<T extends basic> extends Box<T> implements IStrictBox<T> {

  constructor(boxContent: T) {
    super(boxContent);
    Object.freeze(this.content); // Make content immutable
  }

// Test immutability (should fail at compile time):
// strictBox.content.id = "new_id";  // ❌ Cannot assign to readonly property
// strictBox.content.metadata.age = 50;  // ❌ Cannot mutate readonly object
  validate(): string | undefined {
    const content = this.content as basic;
    
    console.log("Validating content:", content);

    if (typeof content !== 'object' || content === null) {
      throw new Error("Content must be a non-null object.");
    }

    if (typeof content.id !== 'string') {
      throw new Error("Content must have an 'id' property of type string.");
    }

    if (typeof content.metadata !== 'object' || content.metadata === null) {
      throw new Error("Content must have a 'metadata' property of type object.");
    }

    return `Content with id ${content.id} is valid.`;
  }
  
  merge<U extends Partial<T>>(updates: U): IStrictBox<T> {
    // throw new Error("Method not implemented.");
    updates as Partial<T>;
    const mergedContent = { ...this.content, ...updates } as T;
    return new StrictBox<T>(mergedContent);
  }
}

type ValidContent = 
  | { type: 'user'; id: string; metadata: Record<string, unknown> }
  | { type: 'product'; id: string; metadata: Record<string, unknown> }
  | { type: 'order'; id: string; metadata: Record<string, unknown> };

const validUserContent = {
  type: 'user',
  id: "user_123",
  metadata: { name: "Alice", age: 25 }
} satisfies ValidContent;

const validProductContent = {
  type: 'product',
  id: "product_456",
  metadata: { name: "Laptop", price: 999 }
} satisfies ValidContent;

const validOrderContent = {
  type: 'order',
  id: "order_789",
  metadata: { orderId: "order_789", total: 1999 }
} satisfies ValidContent;

const user = new StrictBox(validUserContent);
const product = new StrictBox(validProductContent);
const order = new StrictBox(validOrderContent);

console.log("\n Validated Contents: \n", 
  "User:", user.content,
  "Product:", product.content,
  "Order:", order.content
);