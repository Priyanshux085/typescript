import { Box, type IBox } from "@box";

/**
 *@todo: Extend the Box class to create a specialized class called FoodBox that can only hold food items. 
  * The FoodBox class should have an additional property called expirationDate (Date) and a method to check if the food is still fresh based on the current date and the expiration date.
  * @property expirationDate - Date
  * @method isFresh() - checks if the food is still fresh based on the current date and the expiration date, and returns a string indicating the freshness status of the food.
 * 
 * @Answer: 
 */
interface IFoodBox extends IBox<string> {
  expirationDate: Date;
  isFresh(): string;
}

class FoodBox extends Box<string> implements IFoodBox {
  expirationDate: Date;

  constructor(boxContent: string, expDate: Date) {
    super(boxContent);
    this.expirationDate = expDate;
  }

  isFresh(): string {
    const currentDate = new Date();
    return currentDate < this.expirationDate ? "The food is fresh." : "The food has expired.";
  }
}

export { FoodBox };

const foodBox = new FoodBox("Pizza", new Date("2024-12-31"));
console.log(foodBox.isFresh());

