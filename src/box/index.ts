/**
 * A generic box class that can hold any type of item.
 * @template T The type of item the box can hold.
 * 
 * @property content - any type
 * @method displayContent() - returns a string representation of the content of the box.
 * @method checkContent() - checks if the box is empty or not and returns a string indicating the status of the box.
 */
export interface IBox<T> {
  content: T;
  displayContent(): string;
  checkContent(): string; 
}

export class Box<T> implements IBox<T> {
  content!: T;

  constructor(public boxContent: T) {
    this.content = boxContent;
  }

  displayContent(): string {
    return `Content: ${this.content}`;
  }
  
  checkContent(): string {
    return this.content ? "Box is not empty." : "Box is empty.";
  }
}