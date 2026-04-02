## Structural Pattern

Structural design patterns are concerned with how classes and objects are composed to form larger structures. 
They help ensure that if one part of a system changes, the entire system doesn't need to change.
These patterns focus on creating relationships between objects to form larger structures while keeping them flexible and efficient.

## Key Points
- Structural patterns are about organizing classes and objects to form larger structures.
#### Examples of structural patterns include:
  1. **Adapter Pattern**: Allows incompatible interfaces to work together by converting the interface of one class into another interface that clients expect.
  2. **Bridge Pattern**: Decouples an abstraction from its implementation so that the two can vary independently.
  3. **Composite Pattern**: Composes objects into tree structures to represent part-whole hierarchies, allowing clients to treat individual objects and compositions of objects uniformly.
  1. **Decorator Pattern**: Allows behavior to be added to individual objects, either statically or dynamically, without affecting the behavior of other objects from the same class.
  2. **Facade Pattern**: Provides a simplified interface to a complex subsystem, making it easier to use.
  3. **Flyweight Pattern**: Reduces the cost of creating and manipulating a large number of similar objects by sharing common parts of the state between them.
  
### Benefits of Structural Patterns:
- They help to create a flexible and reusable design.
- They promote code reusability and maintainability.
- They allow for easier maintenance and scalability of the system.
- They help to reduce coupling between classes and objects, making the system more modular and easier to understand.

#### When to Use Structural Patterns:
- When you want to create a flexible and reusable design.
**Examples**: 
  1. When you want to allow incompatible interfaces to work together (Adapter Pattern).
  2. When you want to decouple an abstraction from its implementation (Bridge Pattern).
  3. When you want to compose objects into tree structures (Composite Pattern).
  4. When you want to add behavior to individual objects without affecting others (Decorator Pattern).
  5. When you want to provide a simplified interface to a complex subsystem (Facade Pattern).
  