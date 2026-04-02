import { IColor } from "../color/interface";
import { IShape } from "./interface";

const defaultColor: IColor = { colorCode: "#000000" };

abstract class Shape implements IShape {
  color: IColor;

  constructor(color?: IColor) {
    this.color = color ?? defaultColor;
  }

  abstract draw(): void;

  fill(colorCode?: IColor): void {
    const color = colorCode?.colorCode ?? this.color.colorCode;
    console.log(`Filling the shape with color ${color}`);
  }
}

export class Square extends Shape {
  constructor(private side: number, color?: IColor) {
    super(color);
  }

  private calculateArea(): number {
    return this.side * this.side;
  }

  draw(): void {
    console.log(`Drawing a square with side ${this.side} with area ${this.calculateArea()} `);
  }
}

export class Circle extends Shape {
  constructor(private radius: number, color?: IColor) {
    super(color);
  }

  private calculateArea(): number {
    return Math.PI * this.radius * this.radius;
  }

  draw(): void {
    console.log(`Drawing a circle with radius ${this.radius} with area ${this.calculateArea()} `);
  }

  fill(color?: IColor): void {
    const colorCode = color?.colorCode ?? this.color?.colorCode;
    console.log(`Filling the circle with color ${colorCode}`);
  }
}

export class Triangle extends Shape {
  constructor(private base: number, private height: number, color?: IColor) {
    super(color);
  }

  private calculateArea(): number {
    return (this.base * this.height) / 2;
  }

  draw(): void {
    console.log(`Drawing a triangle with base ${this.base} and height ${this.height} with area ${this.calculateArea()} `);
  }
}

export class Rectangle extends Shape {
  constructor(private width: number, private height: number, color?: IColor) {
    super(color);
  }

  private calculateArea(): number {
    return this.width * this.height;
  }

  draw(): void {
    console.log(`Drawing a rectangle with width ${this.width} and height ${this.height} with area ${this.calculateArea()} `);
  }
}

export class Pentagon extends Shape {
  constructor(private side: number, color?: IColor) {
    super(color);
  }

  private calculateArea(): number {
    return (Math.sqrt(5 * (5 + 2 * Math.sqrt(5))) * this.side * this.side) / 4;
  }

  draw(): void {
    console.log(`Drawing a pentagon with side ${this.side} with area ${this.calculateArea()} `);
  }
}

export class Hexagon extends Shape {
  constructor(private side: number, color?: IColor) {
    super(color);
  }

  private calculateArea(): number {
    return (3 * Math.sqrt(3) * this.side * this.side) / 2;
  }

  draw(): void {
    console.log(`Drawing a hexagon with side ${this.side} with area ${this.calculateArea()} `);
  }
}