/**
 * @question2: Medium level, real-life banking flow.
 * You are modeling bank accounts. Create a base class `Account<IdType extends string | number>` with:
 * - `id: IdType`
 * - `balance: number`
 * - `ownerName: string`
 * - `deposit(amount: number)` that rejects non-positive amounts
 * - `withdraw(amount: number)` that prevents overdraft and returns a boolean
 * - `getSummary()` that returns a readable summary string
 * - `Account` should be `abstract` and expose a `readonly createdAt: Date`
 *
 * Add TypeScript constraints:
 * - Define an interface `ITransferable<T extends Account<string | number>>` with `transferTo(target: T, amount: number): boolean`
 * - Use a type alias `Currency = "USD" | "EUR" | "GBP"` and add `currency: Currency`
 * - Add a generic method `mergeMeta<T extends Record<string, string>>(meta: T): void`
 *
 * Then create `SavingsAccount` that extends `Account<string>` with:
 * - `interestRate: number`
 * - `applyInterest()` that increases the balance
 * - `minBalance: number` and `withdraw()` should fail if it would go below it
 * - Implements `ITransferable<Account<string | number>>`
 *
 * Provide a short example that creates an account, deposits, withdraws, and applies interest.
 */
interface IAccount<T extends string | number> {
  id: T,
  balance: number, // Initial balance should be 0.00 in decimal
  ownerName: string,
  deposit(ammount: number): number,
  withdraw(amount: number): number,
  getSummary(): readonly string[]
}

abstract class Account<T extends string | number> implements IAccount<T> {
  constructor(public id: T, public ownerName: string) {}

  currency: "USD" | "EUR" | "GBP" | "INR" = "INR";
  
  balance: number = 0.00;

  readonly createdAt: Date = new Date();

  deposit(ammount: number): number {

    if (typeof ammount !== "number" || Number.isNaN(ammount)) {
      throw new Error("Deposit amount must be a number");
    }

    if (ammount <= 0) {
      throw new Error("Deposit amount must be positive");
    }
    // Amount should alaways be in decimal
    ammount = Number(ammount.toFixed(2));
    this.balance += (ammount); 

    return this.balance;
  }

  withdraw(amount: number): number {
    const potentialBalance = this.balance - amount;

    if (potentialBalance < 0) {
      throw new Error("Insufficient funds");
    }

    this.balance = potentialBalance;

    return this.balance;
  }

  getSummary(): readonly string[] {
    return [
      `Account ID: ${this.id}`,
      `Owner: ${this.ownerName}`,
      `Balance: ${Number(this.balance).toFixed(2)} ${this.currency}`,
      `Created At: ${this.createdAt.toISOString()}`
    ];
  }
}

/**
 * Add TypeScript constraints:
 * - Define an interface `ITransferable<T extends Account<string | number>>` with 
 * `transferTo(target: T, amount: number): boolean`
 * - Use a type alias `Currency = "USD" | "EUR" | "GBP"` and add `currency: Currency`
 * - Add a generic method `mergeMeta<T extends Record<string, string>>(meta: T): void`
 *
 * Then create `SavingsAccount` that extends `Account<string>` with:
 * - `interestRate: number`
 * - `applyInterest()` that increases the balance
 * - `minBalance: number` and `withdraw()` should fail if it would go below it
 * - Implements `ITransferable<Account<string | number>>`
 *
 * Provide a short example that creates an account, deposits, withdraws, and applies interest.
*/

interface ITransferable<T extends Account<string | number>> {
  transferTo(target: T, amount: number): boolean;
  mergMeta<T extends Record<string, string>>(meta: T): void;
}

interface ISavingAccount extends Account<string>, ITransferable<Account<string | number>> {
  interestRate: number,
  applyInterest(): number,
  minBalance: number,
}

class SavingAccount extends Account<string> implements ISavingAccount {
  minBalance: number = 500.00;
  
  constructor(id: string, ownerName: string, private depositAmount: number) {
    super(id, ownerName);

    if (depositAmount <= 0) {
      throw new Error("Initial deposit must be positive");
    }

    if (depositAmount < this.minBalance) throw new Error(`Initial deposit must be at least ${this.minBalance}`);

    this.depositAmount = Number(depositAmount.toFixed(2));

    this.balance = this.depositAmount;
  }

  mergMeta<T extends Record<string, string>>(meta: T): void {
    console.log("Merging meta:", meta);
  }

  interestRate: number = 0.05;


  applyInterest(): number {
    const interest = this.balance * this.interestRate;
    this.balance += interest;
    return this.balance;
  }

  transferTo(target: Account<string | number>, amount: number): boolean {
    try {
      this.withdraw(amount);
      target.deposit(amount);
      return true;
    } catch (error) {
      console.error("Transfer failed:", error);
      return false;
    }
  }
}

const myAccount = new SavingAccount("acc123", "John Doe", 1000);

myAccount.deposit(500);
myAccount.withdraw(200);
myAccount.applyInterest();

const targetAccount = new SavingAccount("acc456", "Jane Doe", 500.83);
myAccount.transferTo(targetAccount, 300);
// console.log(myAccount.getSummary());
// console.log(targetAccount.getSummary());

/**
 * @question2.2: Real-life extension with more fields.
 * Create a new class `CurrentAccount` that extends `Account<number>` with:
 * - `overdraftLimit: number`
 * - `withdraw()` should allow overdraft up to the limit
 * - Implements `ITransferable<Account<string | number>>`
 * 
 * Provide a short example that creates a current account, deposits, withdraws (including overdraft), and transfers.
 */
interface ICurrentAccount extends IAccount<number> {
  overdraftLimit: number,
  withdraw(amount: number): number
}

class CurrentAccount extends Account<number> implements ICurrentAccount {
  constructor (id: number, ownerName: string, public initialAmount: number) {
    super(id, ownerName);

    if (initialAmount < 0) {
      throw new Error("Initial amount cannot be negative");
    }
    
    this.balance = Number(initialAmount.toFixed(2));
  }

  overdraftLimit: number = 5000; // Allow overdraft up to 5000 means balance can go down to -5000

  override withdraw(amount: number): number {
    if(amount === this.overdraftLimit) {
      throw new Error("Cannot withdraw the exact overdraft limit");
    }

    if (amount <= 0) {
      throw new Error("Withdrawal amount must be positive");
    }
     
    if (this.balance - amount < -this.overdraftLimit) {
      throw new Error("Overdraft limit exceeded");
    }

    this.balance -= amount;
    return this.balance;
  }
}

const currentAccount = new CurrentAccount(12345, "Alice Smith", 1000);
currentAccount.deposit(2000);
currentAccount.withdraw(2500);
currentAccount.withdraw(4000);

/**
 * @question2.3: Advanced TypeScript features.
 * Enhance the `Account` class and its subclasses with the following features:
 * TypeScript constraints:
 * - Add a generic method `mergeMeta<T extends Record<string, string>>(meta: T): void`
 * - Ensure all amounts are handled in decimal format (e.g., 100.00 instead of 100) and validate inputs to prevent invalid states.
 * - Add error handling for invalid operations (e.g., withdrawing more than the overdraft limit).
 * - Ensure that the `getSummary()` method provides a clear and concise overview of the account status, including any overdraft usage.
 * 
 * - Implement a method `calculateOverdraftUsage()` that returns how much of the overdraft limit is currently being used.
 * 
 * Provide a short example that creates a current account, deposits, withdraws (including overdraft), and transfers.
 * 
 * Advanced TypeScript features:
 * - Use `abstract` classes and methods to enforce implementation in subclasses.
 * - Utilize `readonly` properties for immutable fields like `createdAt`.
 * - Implement interfaces to define transferable behavior across different account types.
 * - Use type guards to ensure type safety when performing operations on accounts.
 * - Leverage generics to create flexible and reusable components while maintaining type safety.
 */
abstract class EnhancedAccount<T extends string | number> extends Account<T> {
  mergMeta<T extends Record<string, string>>(meta: T): void {
    console.log("Merging meta:", meta);
  }

  override withdraw(amount: number): number {
    if (this instanceof CurrentAccount) {
      if (amount <= 0) {
        throw new Error("Withdrawal amount must be positive");
      }
      
      if (this.balance - amount < -this.overdraftLimit) {
        throw new Error("Overdraft limit exceeded");
      }
    } else if (this instanceof SavingAccount) {
      const potentialBalance = this.balance - amount;

      if (potentialBalance < this.minBalance) {
        throw new Error("Cannot withdraw below minimum balance");
      }
    }

    this.balance -= amount;
    return this.balance;
  }

  calculateOverdraftUsage(): number {
    if (this instanceof CurrentAccount) {
      const overdraftUsed = Math.max(0, -this.balance);
      return overdraftUsed;
    }
    return 0;
  }
}

class EnhancedCurrentAccount extends EnhancedAccount<number> implements ITransferable<Account<string | number>> {
  transferTo(target: Account<string | number>, amount: number): boolean {
    try {
      this.withdraw(amount);
      target.deposit(amount);
      return true;
    } catch (error) {
      console.error("Transfer failed:", error);
      return false;
    }
  }
}

const enhancedCurrentAccount = new EnhancedCurrentAccount(67890, "Bob Johnson");
enhancedCurrentAccount.deposit(300);
enhancedCurrentAccount.withdraw(3500);
console.log(
  "Overdraft Usage:", 
  enhancedCurrentAccount.calculateOverdraftUsage()
);

/**
 * @question2.4: Real-life extension with database integration.
 * Extend the banking system to include database integration using an ORM (e.g., TypeORM or Prisma).
 * - Define entities for accounts and transactions, including necessary fields and relationships.
 * - Implement repository classes to handle database operations for accounts and transactions.
 * - Ensure that all account operations (deposits, withdrawals, transfers) are persisted in the database with proper transaction management.
 * - Implement error handling for database operations and ensure data integrity.
 * Other implementation details:
 * - Create a Postgres database schema for accounts, including fields - 
 * `id`, `ownerName`, `balance`, `currency`, `createdAt`, `accountType` (savings or current), `interestRate` (for savings), `overdraftLimit` (for current).
 * - Implement a simple in-memory repository to manage accounts, allowing for creation, retrieval, updating, and deletion of accounts.
 * - Ensure that all operations on accounts are logged for audit purposes, including deposits, withdrawals, transfers, and interest applications.
 * 
 * Provide a short example that creates a current account, deposits, withdraws (including overdraft), and transfers.
 */
class InMemoryAccountRepository {
  private accounts: Account<string | number>[] = [];

  createAccount(account: Account<string | number>): void {
    this.accounts.push(account);
    console.log("Account created:", account.getSummary());
  }
  
  getAccountById<T extends string | number>(id: T): Account<T> | undefined {
    return this.accounts.find(account => account.id === id) as Account<T> | undefined;
  }
  
  updateAccount<T extends string | number>(updatedAccount: Account<T>): void {
    const index = this.accounts.findIndex(account => account.id === updatedAccount.id);
    if (index !== -1) {
      this.accounts[index] = updatedAccount;
      console.log("Account updated:", updatedAccount.getSummary());
    }
  }

  deleteAccount<T extends string | number>(id: T): void {
    this.accounts = this.accounts.filter(account => account.id !== id);
    console.log(`Account with ID ${id} deleted.`);
  }
}

const accountRepo = new InMemoryAccountRepository();
const newCurrentAccount = new CurrentAccount(54321, "Charlie Brown", 1500);
accountRepo.createAccount(newCurrentAccount);
const retrievedAccount = accountRepo.getAccountById(54321);
if (retrievedAccount) {
  retrievedAccount.deposit(500);
  retrievedAccount.withdraw(2500);
  accountRepo.updateAccount(retrievedAccount);
}
console.log("Final Account Summary: \n", retrievedAccount?.getSummary());