// type CurrencyOpts = 'INR' | 'USD' | 'EUR' | 'JPY' | 'AUD';

export enum Currency {
  INR = 'INR', // Indian Rupee
  USD = 'USD', // United States Dollar
  EUR = 'EUR', // Euro
  JPY = 'JPY', // Japanese Yen
  AUD = 'AUD', // Australian Dollar
}

type CurrencyUnit = Record<Currency, string>;

export const CurrencyUnit: CurrencyUnit = {
  [Currency.INR]: 'paise', // 1 INR = 100 paise
  [Currency.USD]: 'cents', // 1 USD = 100 cents
  [Currency.EUR]: 'cents', // 1 EUR = 100 cents
  [Currency.JPY]: 'yen', // No minor unit in use
  [Currency.AUD]: 'cents', // 1 AUD = 100 cents
};

export const CurrencyDecimalPlaces: Record<Currency, number> = {
  [Currency.INR]: 2, // 1 INR = 100 paise
  [Currency.USD]: 2, // 1 USD = 100 cents
  [Currency.EUR]: 2, // 1 EUR = 100 cents
  [Currency.JPY]: 0, // JPY does not have a smaller unit
  [Currency.AUD]: 2, // 1 AUD = 100 cents
};

export type Money = Readonly<{
  currency: keyof typeof Currency;
  amount: number;
  add: (other: Money) => Money;
  subtract: (other: Money) => Money;
  compare: (other: Money) => number;
}>;

const assertIntegerAmount = (amount: number): void => {
  if (!Number.isInteger(amount)) {
    throw new Error('Amount must be an integer in minor units.');
  }
};

const assertSameCurrency = (
  left: keyof typeof Currency,
  right: keyof typeof Currency,
  operation: 'add' | 'subtract' | 'compare'
): void => {
  if (left !== right) {
    throw new Error(`Currency mismatch for ${operation}: ${left} vs ${right}`);
  }
};

export const createMoney = (currency: keyof typeof Currency, amount: number): Money => {
  assertIntegerAmount(amount);

  const add = (other: Money): Money => {
    assertSameCurrency(currency, other.currency, 'add');
    return createMoney(currency, amount + other.amount);
  };

  const subtract = (other: Money): Money => {
    assertSameCurrency(currency, other.currency, 'subtract');
    return createMoney(currency, amount - other.amount);
  };

  const compare = (other: Money): number => {
    assertSameCurrency(currency, other.currency, 'compare');
    if (amount === other.amount) {
      return 0;
    }
    return amount < other.amount ? -1 : 1;
  };

  return Object.freeze({ currency, amount, add, subtract, compare });
};