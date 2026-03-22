/**
 * @question1:
 * You are building a grocery app. Create a base class `ReceiptItem<IdType>` with `id: IdType` and `price: number`.
 * Then create `GroceryItem` that extends `ReceiptItem<number>` with `category: string` and a `label()` method
 * that returns a short string like "Milk - Dairy".
 */

export * from "./answer_01";

/**
 * @question2:
 * You are modeling bank accounts. Create a base class `Account<IdType>` with `id: IdType`, `balance: number`,
 * and methods `deposit(amount: number)` and `withdraw(amount: number)`.
 * Then create `SavingsAccount` that extends `Account<string>` with `interestRate: number` and `applyInterest()`.
 */

export * from "./answer_02";

/**
 * @question3:
 * You are tracking appointments. Create a base class `Appointment<IdType>` with `id: IdType`, `date: Date`,
 * and `location: string`. Then create `DoctorVisit` that extends `Appointment<string>` with `doctorName: string`
 * and a `details()` method that returns a readable summary.
 */

export * from "./answer_03";