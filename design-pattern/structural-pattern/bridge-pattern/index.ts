import * as Color from "./color";

import * as Shape from "./shape";

const whiteColor = new Color.White();

const red = new Color.Red();

const hexagon = new Shape.Hexagon(5)
hexagon.fill();

const blackHexagon = new Shape.Hexagon(5, whiteColor);
blackHexagon.fill();

const circle = new Shape.Circle(10, whiteColor);
circle.fill(red);

const triangle = new Shape.Triangle(10, 5, whiteColor);
triangle.fill(red);

const rectangle = new Shape.Rectangle(10, 5, whiteColor);
rectangle.fill(red);