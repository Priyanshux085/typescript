import { IColor } from "../color/interface";

export interface IShape {
  /**
   * The draw method is responsible for rendering the shape on the screen. 
   * It can be implemented to display the shape's properties, such as its dimensions and color.
   */
  draw(): void;

  /**
   * The color property is used to hold the color code from the IColor interface, which can be used to fill the shape with the specified color.
   */
  color?: IColor;

  /**
   * The fill method is used to fill the shape with the specified color.
   * @param color The Color Code from the IColor interface, 
   * this method is used to fill the shape with the specified color. 
   */
  fill(color?: IColor): void;
}