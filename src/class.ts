/**
 * Class in TypeScript
 * - A class is a blueprint for creating objects with specific properties and methods.
 * 
 * @Question: Make a restaurant class with properties and polymorphism. The class should have properties such as
 * 
 * name - string,
 * cuisine - string, and 
 * rating - number. 
 * 
 * Include a method to display the restaurant's details.
 * 
 * @Answer:
 */

interface IRestaurant {
  name: string;
  cuisine: string;
  rating: number;  
}

class Restaurant implements IRestaurant {
  constructor (private Rname: string, private Rcuisine: string, private Rraiting: number){}

  name = this.Rname;
  cuisine= this.Rcuisine;
  rating: number = this.Rraiting
}

/**
 * Polymorphism allows us to use a single interface to represent different types of objects. In this case, we can create a subclass of Restaurant called FastFoodRestaurant that has additional properties and methods specific to fast food restaurants.
 * 
 *@Question: Create a FastFoodRestaurant class that extends the Restaurant class. 
 *The FastFoodRestaurant class should have an additional property called driveThru (boolean) and a method to display, 
 *whether the restaurant has a drive-thru service.
 *@property driveThru - boolean
 @method hasDriveThru() - returns a string indicating whether the restaurant has a drive-thru service. 
 @method should return a string indicating whether the restaurant has a drive-thru service.
 * @Answer:
 */

 interface IFastFoodRestaurant extends IRestaurant {
  driveThru: boolean;

  should(): string | void;
  hasDriveThru(): string;
}

class FastFoodRestaurant extends Restaurant implements IFastFoodRestaurant {
  // The constructor of the FastFoodRestaurant class takes in the same parameters as the Restaurant class, 
  // along with an additional parameter for driveThru. 
  // It calls the super() method to initialize the properties of the Restaurant class, 
  // and then sets the driveThru property based on the value passed in the constructor.

  // other method to imnplemen the constructed driveThru property

  constructor(Rname: string, Rcuisine: string, Rraiting: number, private driveService: boolean) {
    super(Rname, Rcuisine, Rraiting);
  }

  driveThru: boolean = this.driveService;
  
  hasDriveThru(): string {
    return this.driveThru ? `${this.name} has a drive-thru service.` : `${this.name} does not have a drive-thru service.`;
  }

  should(): string | void {
    return this.driveThru 
      ? `You should visit ${this.name} for a quick meal!` 
      : `You can visit ${this.name} for a dine-in experience.`;
  }
}

const mcdonalds = new FastFoodRestaurant("McDonald's", "Fast Food", 4.5, true);
console.log(mcdonalds.hasDriveThru());

// --------------------------

/**
 *@Topic: Crfeatig a genreic class in TypeScript and interface
 * @Question: Create a generic class called Box that can hold any type of item. \
 * The Box class should have a property called content that can be of any type, and 
 * a method to display the content of the box. 
 * It should have basic properties such as content and a method to display the content of the box.
 * 
 * @property content - any type
 * @method displayContent() - returns a string representation of the content of the box.
 * @method checlContent() - checks if the box is empty or not and returns a string indicating the status of the box.
 * 
 *@interface IBox<T> {
 * content: T;
 * displayContent(): string;
 * checkContent(): string; 
 * }
 * 
 * @Answer:
 */

interface IBox<T> {
  content: T;
  displayContent(): string;
  checkContent(): string; 
}

class Box<T> implements IBox<T> {
  constructor(private boxContent: T) {}

  content: T = this.boxContent;

  displayContent(): string {
    return `Content: ${this.content}`;
  }

  checkContent(): string {
    return this.content ? "Box is not empty." : "Box is empty.";
  }
}

type color = "red" | "green" | "blue";

interface IColor {
  color: color;
  total_colors: number;
  manufacturer: string;
  created_at: Date;
}

const createdAt = new Date();
const readColorBox = new Box<IColor>({
  color: "red",
  total_colors: 3,
  manufacturer: "Color Inc.",
  created_at: createdAt
});

console.log(readColorBox.displayContent());
console.log(readColorBox.checkContent());

// --------------------------

