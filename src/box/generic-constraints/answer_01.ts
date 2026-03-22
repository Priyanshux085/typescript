import { Box, type IBox } from "@box";

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
 * const animalConsumer: BoxConsumer<Animal> = dogConsumer; // This is valid due to contravariance
 */



// ============================================================================
// PRACTICAL EXAMPLES
// ============================================================================

// WHat is contravariance generics in typescript in HINGLISH?
// Contravariance generics in TypeScript ka matlab hai ki agar aapke paas ek generic type hai, jaise Box<T>, 
// toh aap usko aise design kar sakte hain ki wo T ke subtypes ko accept kare. 
// Iska matlab hai ki agar aapke paas Box<Animal> hai, toh aap usme Box<Dog> ko assign kar sakte hain, kyunki Dog ek subtype hai Animal ka. 
// Isse aap apne code ko zyada flexible bana sakte hain, kyunki aap different types ke boxes ko interchangeably use kar sakte hain, 
// jab tak wo ek common base type share karte hain.

interface IBoxConsumer<T> {
  consume(box: IBox<T>): void;
}

export class BoxConsumer<T> implements IBoxConsumer<T> {
  
  consume(box: Box<T>): void {
    // Implementation of consuming the box
    console.log(`Consuming box with content: `, box.content);
    
    return;
  }
}

class Animal {
  constructor(public name: string) {}
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name);
  }
}

const dogConsumer: BoxConsumer<Dog> = new BoxConsumer<Dog>();
const animalConsumer: BoxConsumer<Animal> = dogConsumer; 

const box = new Box<Dog>(new Dog("Buddy", "Golden Retriever"));
dogConsumer.consume(box); // This works fine
animalConsumer.consume(box); // This also works due to contravariance

// ============================================================================
// VARIANT BOX: COVARIANCE EXAMPLE
// ============================================================================

/**
 * ```
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
 */ 
interface IVariantBox<out T> {
  content: T;
  readBox<T>(box: IVariantBox<T>): T
  writeBox<T>(box: Box<T>, item: T): void;
}

// ============================================================================
// READONLY BOX IMPLEMENTATION
// ============================================================================

/**
 * Readonly<T> utility type that makes all properties readonly recursively
 * This ensures immutability at the type level
 */
// type DeepReadonly<T> = {
//   readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
// };

/**
 * ReadonlyBox<T>: A covariant, immutable box wrapper
 * - Implements IVariantBox with readonly semantics
 * - Cannot modify content after creation
 * - Safe for covariant use (can pass VariantBox<Dog> where VariantBox<Animal> expected)
 */
class ReadonlyBox<out T> implements IVariantBox<T> {
  readonly content: Readonly<T>;

  constructor(initialContent: T) {
    // Deep freeze to prevent runtime mutations
    this.content = Object.freeze(initialContent) as Readonly<T>;
  }

  /**
   * Read the content from a readonly box
   * Returns the content as-is (already readonly)
   */
  readBox<U>(box: IVariantBox<U>): U {
    return box.content;
  }

  /**
   * Write operation is disabled for readonly boxes
   * The implementation prevents any writes at compile-time
   */
  writeBox<U>(box: Box<U>, item: U): void {
    throw new Error(
      "Cannot write to a readonly box. Use a regular Box instead."
    );
  }
}

/**
 * VariantBox<T>: Regular (mutable) variant box
 * - Implements IVariantBox with read/write capabilities
 */
class VariantBox<T> implements IVariantBox<T> {
  content: T;

  constructor(initialContent: T) {
    this.content = initialContent;
  }

  /**
   * Read content from any box
   */
  readBox<U>(box: IVariantBox<U>): U {
    return box.content;
  }

  /**
   * Write content to a box (only for mutable boxes)
   */
  writeBox<U>(box: Box<U>, item: U): void {
    box.content = item;
  }
}

// ============================================================================
// PRACTICAL EXAMPLES WITH READONLY BOXES
// ============================================================================

// Example 1: Create a readonly dog box
const readonlyDogContent = Object.freeze({
  name: "Buddy",
  breed: "Golden Retriever",
});
const readonlyDogBox = new ReadonlyBox(readonlyDogContent);
console.log("Readonly dog box content:", readonlyDogBox.content);

// Example 2: Readonly covariance - can use ReadonlyBox<Dog> where ReadonlyBox<Animal> expected
const readonlyAnimalBox: ReadonlyBox<Animal> = readonlyDogBox as ReadonlyBox<
  Dog & Animal
>;
const animalContent = readonlyAnimalBox.readBox(readonlyAnimalBox);
console.log("Animal from readonly box:", animalContent);

// Example 4: Mutable box for comparison
const mutableBox = new VariantBox({ name: "Buddy", breed: "Golden Retriever" });
console.log("Mutable box content:", mutableBox.content);

// Example 5: Type safety - trying to mutate readonly throws error
try {
  const dogBox = new Box(new Dog("Buddy", "Golden Retriever"));
  readonlyDogBox.writeBox(dogBox, { name: "Max", breed: "Labrador" });
} catch (e) {
  console.log("Expected error:", (e as Error).message);
}

/**
 * Deep dive questions:
 * - When is contravariance useful in real APIs?
 * - Why can't Box<T> be covariant over T?
 * - How do method signatures interact with variance?
 * explain in HINGLISH: 
 * @description In APIs me contravariance useful hota hai jab aapko ek function ya method chahiye jo ek specific type ke objects ko consume kare, 
 * lekin aap chahte hain ki wo function ya method us type ke subtypes ko bhi accept kare. 
 * Iska fayda ye hai ki aap apne code ko zyada flexible bana sakte hain, kyunki aap different types ke objects ko interchangeably use kar sakte hain, 
 * 
 * @example Agar aapke paas ek function hai jo Animal objects ko consume karta hai, toh aap us function ko Dog objects ke saath bhi use kar sakte hain,
 * kyunki Dog ek subtype hai Animal ka - isse aap apne code ko zyada reusable bana sakte hain.
 * 
 * @example Box<T> covariant nahi ho sakta kyunki agar Box<T> covariant hota, toh aap Box<Dog> ko Box<Animal> ke jagah use kar sakte the,
 * lekin Box<Animal> me aap Dog ke alawa kisi bhi Animal ko daal sakte the, jo type safety ko compromise kar deta. 
 * 
 */

