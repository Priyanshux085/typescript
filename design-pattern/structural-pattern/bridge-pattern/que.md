## Assignment: Implement the Bridge Pattern

### Objective:
The objective of this assignment is to implement the **Bridge Pattern** in a real-world scenario. 
The **Bridge Pattern** is a structural design pattern that decouples an abstraction from its implementation, allowing the two to vary independently.

### Assignment 01 in JAVASCRIPT: 
  #### Question:
  Say you have a geometric Shape class with a pair of subclasses: **Circle** and **Square**. You want to extend this class hierarchy to incorporate colors. So you plan to create **Red** and **Blue** shape subclasses. However, since you already have two subclasses, you need to create 4 class combinations such as BlueCircle and RedSquare.

  #### Goal: Implement the Bridge Pattern to decouple the shape abstraction from its color implementation.
  #### Core Problem: The core problem is that if you want to add more shapes or colors, you would need to create a new class for each combination, which can lead to a large number of classes and maintenance issues.

  ##### Tasks:
  1. Implement the **Bridge Pattern** to decouple the shape abstraction from its color implementation.
  2. Create a `Shape` class that has a reference to a `Color` class.
  3. Implement the `Circle` and `Square` classes that extend the `Shape` class.
  4. Implement the `Red` and `Blue` classes that implement the `Color` interface.
  5. Demonstrate how to create different combinations of shapes and colors without creating a new class for each combination.