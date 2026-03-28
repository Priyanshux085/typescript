import { Currency } from "../../../lib/currency";

export type TenantPlan = "free" | "pro" | "enterprise";

export type FeeStrategyType = "flat" | "tiered";
export type RoutingStrategyType = "bank" | "card";

export type TenantPlanLimits = Readonly<{
  maxTransactionAmount: number;
}>;

export type TenantPlanFeatures = Readonly<{
  allowedCurrencies: readonly Currency[];
  feeStrategy: FeeStrategyType;
  routingStrategy: RoutingStrategyType;
}>;

export type TenantPlanConfig<T extends TenantPlan = TenantPlan> = Readonly<{
  key: T;
  limits: TenantPlanLimits;
  features: TenantPlanFeatures;
}>;

type TenantPlanMap = { readonly [K in TenantPlan]: TenantPlanConfig<K> };

const TENANT_PLAN_MAP: TenantPlanMap = {
  free: {
    key: "free",
    limits: { maxTransactionAmount: 10_000 },
    features: {
      allowedCurrencies: [Currency.INR],
      feeStrategy: "flat",
      routingStrategy: "bank",
    },
  },
  pro: {
    key: "pro",
    limits: { maxTransactionAmount: 250_000 },
    features: {
      allowedCurrencies: [Currency.INR, Currency.USD],
      feeStrategy: "tiered",
      routingStrategy: "bank",
    },
  },
  enterprise: {
    key: "enterprise",
    limits: { maxTransactionAmount: 10_000_000 },
    features: {
      allowedCurrencies: [
        Currency.INR,
        Currency.USD,
        Currency.EUR,
        Currency.JPY,
        Currency.AUD,
      ],
      feeStrategy: "tiered",
      routingStrategy: "card",
    },
  },
};

export const createTenantPlan = <T extends TenantPlan>(
  type: T
): TenantPlanConfig<T> => {
  return TENANT_PLAN_MAP[type];
};