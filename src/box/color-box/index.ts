import { Box, type IBox } from "../index";

type color_otions = "red" | "green" | "blue" | "yellow" | "purple" | "orange";

interface IColorBox extends IBox<color_otions> {
  total_colors: number;
  manufacturer: string;
  created_at: Date;
}

export default class ColorBox extends Box<color_otions> implements IColorBox {
  constructor(
    boxContent: color_otions,
    public total_colors: number,
    public manufacturer: string,
    public created_at: Date
  ) {
    super(boxContent);
  }
}
