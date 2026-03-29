interface IAnalyticsStrategy<T> {
  generate(): Promise<T>;
}

export type TUser = {
  id: string,
  name: string,
  address: {
    line1: string,
    line2: string,
    state: string,
    country: string
  }
}

export class UserBehaviorStrategy implements IAnalyticsStrategy<TUser[]> {
  generate(): Promise<TUser[]> {
    throw new Error("Method Not Implemented.")
  }
}

export type TSales = {
  productId: string,
  quantity: number,
  revenue: number
}

export class SalesTrendStrategy implements IAnalyticsStrategy<TSales[]> {
  generate(): Promise<TSales[]> {
    throw new Error("Method Not Implemented.")
  }
}

export type TForecast = {
  productId: string,
  forecastedRevenue: number,
  confidence: number,
  forecastDate: Date,
  updateFrequency: 'daily' | 'weekly' | 'monthly'
}

export class RevenueForecastStrategy implements IAnalyticsStrategy<TForecast[]> {
  generate(): Promise<TForecast[]> {
    throw new Error("Method Not Implemented.")
  }
}

export class AnalyticsStrategy<T> {
  private strategy: IAnalyticsStrategy<T>;

  constructor(strategy: IAnalyticsStrategy<T>) {
    this.strategy = strategy;
  }

  setStrategy(strategy: IAnalyticsStrategy<T>) {
    this.strategy = strategy;
  }

  async execute(): Promise<T> {
    return await this.strategy.generate();
  }
}

const userBehaviorStrategy = new UserBehaviorStrategy();
const strategy = new AnalyticsStrategy<TUser[]>(userBehaviorStrategy);
console.log(strategy.execute());