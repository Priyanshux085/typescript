import type { ReportStrategy } from "../strategies/report-strategy";

export class ReportContext<T> {
  private strategy!: ReportStrategy<T>;

  setStrategy(strategy: ReportStrategy<T>): void {
    this.strategy = strategy;
  }

  async generateReport(): Promise<T> {
    if (!this.strategy) {
      throw new Error("Report strategy not set");
    }

    return this.strategy.generate();
  }
}