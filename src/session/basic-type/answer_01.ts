/**
 * @question1:
 * You are building a grocery app. Create a base class `ReceiptItem<IdType>` with `id: IdType` and `price: number`.
 * Then create `GroceryItem` that extends `ReceiptItem<number>` with `category: string` and a `label()` method
 * that returns a short string like "Milk - Dairy".
 */

interface IReceiptItem<T> {
  id: T,
  price: number
}

export class ReceiptItem<IdType> implements IReceiptItem<IdType> {
  constructor (public id: IdType, public price: number) {}
}

const form = new ReceiptItem("asdf", 100);
console.log(form); 
// ReceiptItem { id: 'asdf', price: 100 }

interface IGroceryItem extends IReceiptItem<number> {
  category: string,
  label(): string
}

class GroceryItem extends ReceiptItem<number> implements IGroceryItem {
  constructor (public category: string, id: number, price: number) {
    super(id, price)
  }

  label(): string {
    if (this.category === "")
      throw new Error("Category not provided")

    return `${this.id} - ${this.category}`
  }
}

const groceryItem = new GroceryItem("fast-food", 12345, 3124343)
console.log(groceryItem);

/**
 * @question1.2: Real-life extension with more fields.
 * You are building a grocery inventory system. Create a base class `Form<IdType>` with:
 * - `id: IdType`
 * - `price: number`
 * - `manufacturer: string`
 * - `createdAt: Date`
 *
 * Then create `GroceryItem` that extends `Form<number>` and adds:
 * - `category: string`
 * - `name: string`
 * - `label()` that returns a string like "Milk - Dairy" (use `name` + `category`).
 * 
 */