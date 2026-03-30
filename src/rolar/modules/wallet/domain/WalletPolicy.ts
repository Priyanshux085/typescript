import z from "zod";

export interface IWalletPolicy extends Readonly<{
  allowOverdraft: boolean;
  currency: string;
  dailyLimit: number;
}> {}

export class WalletPolicy implements IWalletPolicy {
  constructor(
    public readonly allowOverdraft: boolean,
    public readonly currency: string,
    public readonly dailyLimit: number
  ) {

    dailyLimit = z.number().nonnegative().parse(dailyLimit);
  }

  canTransact(amount: number): boolean {
    amount = z.number().positive().parse(amount);

    if (amount === 0) {
      return true; // No transaction, so it's always allowed
    }

    if (amount < 0 && !this.allowOverdraft) {
      return false; // Overdraft not allowed
    }

    return Math.abs(amount) <= this.dailyLimit;
  }
}