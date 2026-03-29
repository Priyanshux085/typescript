### You are building a dynamic analytics system in TypeScript. Requirements:

- Analytics can be computed using multiple strategies:
- UserBehaviorStrategy → returns ``UserStats``
- SalesTrendStrategy → returns ``SalesReport``
- RevenueForecastStrategy → returns ``ForecastData``
- Reports are computed asynchronously.
- The system must allow runtime selection of strategies, *possibly multiple at once*.
- Strategies may require different configuration objects (API keys, endpoints, thresholds).
- Client code should be type-safe and not rely on any.
- System should be testable using dependency injection.You are building a dynamic analytics system in TypeScript. Requirements:

#### Todo- 

### 1. Define generic interfaces for strategies and their results.
- Define a common interface `AnalyticsStrategy<T>` with a method `compute(): Promise<T>`.

### 2. Implement concrete strategy classes for each analytics type.
- Create classes `UserBehaviorStrategy`, `SalesTrendStrategy`, and `RevenueForecastStrategy` that implement `AnalyticsStrategy` with their respective result types.