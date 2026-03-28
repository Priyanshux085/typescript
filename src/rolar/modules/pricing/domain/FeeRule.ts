import type * as Currency from "../../../lib/currency";
import type { TenantPlan } from "../../tenant/domain/TenantPlan";

type Plan = TenantPlan;
type CurrencyEnum = keyof typeof Currency.Currency;

// FeeRule.ts -- Represents a single fee rule with conditions and fee calculation logic.
export type FeeRule = Readonly<{
  id: string;
  name: string;
  description?: string;
  plan: Plan;
  condition: (transactionAmount: number, currency: CurrencyEnum) => boolean;
  calculateFee: (transactionAmount: number, currency: CurrencyEnum) => number;
}>;

export type RouteRule = Readonly<{
  id: string;
  name: string;
  description?: string;
  plan: Plan;
  condition: (transactionAmount: number, currency: CurrencyEnum) => boolean;
  getRoutes: () => readonly string[];
}>;
