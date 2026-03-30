import type { TenantPlan } from "../../tenant/domain/TenantPlan";
import type { FeeRule, RouteRule } from "./FeeRule";

type Plan = TenantPlan;

const FreeTierRoutes: readonly string[] = ["/"];
const ProTierRoutes: readonly string[] = ["/bank", "/card"];
const EnterpriseTierRoutes: readonly string[] = ["/bank", "/card", "orgid/*"];

const toMinorUnits = (amount: number): number => Math.round(amount);

interface IPricingPlan {
  id: string;
  plan: Plan;
  feeRules: readonly FeeRule[];
  routeRules: readonly RouteRule[];
  getFeeRules: () => readonly FeeRule[];
  getRouteRules: () => readonly RouteRule[];
}

export abstract class PricingPlan<TPlan extends Plan> implements IPricingPlan {
  readonly id: string;
  readonly plan: TPlan;
  readonly feeRules: readonly FeeRule[] = [];
  readonly routeRules: readonly RouteRule[] = [];

  constructor(id: string, plan: TPlan) {
    this.id = id;
    this.plan = plan;
  }

  getFeeRules(): readonly FeeRule[] {
    return this.feeRules;
  }

  getRouteRules(): readonly RouteRule[] {
    return this.routeRules;
  }
}

export class FreePlan extends PricingPlan<"free"> {
  constructor() {
    super("plan-free", "free");
  }

  override readonly feeRules: readonly FeeRule[] = [
    {
      id: "free-tier-fee",
      name: "Free Tier Fee",
      plan: "free",
      condition: (transactionAmount) => transactionAmount <= 10_000,
      calculateFee: (transactionAmount, currency) => {
        switch (currency) {
          case "INR":
            return toMinorUnits(transactionAmount * 0.02); // 2% fee for INR
          case "USD":
            return toMinorUnits(transactionAmount * 0.025); // 2.5% fee for USD
          case "EUR":
            return toMinorUnits(transactionAmount * 0.022); // 2.2% fee for EUR
          default:
            return toMinorUnits(transactionAmount * 0.03); // 3% fee for other currencies
        }
      },
    },
    {
      id: "free-tier-fee-excess",
      name: "Free Tier Excess Fee",
      plan: "free",
      condition: (transactionAmount) => transactionAmount > 10_000,
      calculateFee: (transactionAmount, currency) => {
        switch (currency) {
          case "INR":
            return toMinorUnits(200 + (transactionAmount - 10_000) * 0.01); // Flat + 1% for INR
          case "USD":
            return toMinorUnits(250 + (transactionAmount - 10_000) * 0.015); // Flat + 1.5% for USD
          case "EUR":
            return toMinorUnits(220 + (transactionAmount - 10_000) * 0.012); // Flat + 1.2% for EUR
          default:
            return toMinorUnits(300 + (transactionAmount - 10_000) * 0.02); // Flat + 2% for others
        }
      },
    },
  ];

  override readonly routeRules: readonly RouteRule[] = [
    {
      id: "free-tier-routes",
      name: "Free Tier Routes",
      plan: "free",
      condition: () => true,
      getRoutes: () => FreeTierRoutes,
    },
  ];
}

export class ProPlan extends PricingPlan<"pro"> {
  constructor() {
    super("plan-pro", "pro");
  }

  override readonly feeRules: readonly FeeRule[] = [
    {
      id: "pro-tier-fee",
      name: "Pro Tier Fee",
      plan: "pro",
      condition: (transactionAmount, currency) => {
        switch (currency) {
          case "INR":
            return transactionAmount <= 250_000; // Pro tier limit for INR
          case "USD":
            return transactionAmount <= 123; // Pro tier limit for USD
          case "EUR":
            return transactionAmount <= 250_000; // Pro tier limit for EUR
          default:
            return transactionAmount <= 250_000; // Pro tier limit for other currencies
        }
      },
      calculateFee: (transactionAmount, currency) => {
        switch (currency) {
          case "INR":
            return toMinorUnits(transactionAmount * 0.01); // 1% fee for INR
          case "USD":
            return toMinorUnits(transactionAmount * 0.012); // 1.2% fee for USD
          case "EUR":
            return toMinorUnits(transactionAmount * 0.011); // 1.1% fee for EUR
          default:
            return toMinorUnits(transactionAmount * 0.015); // 1.5% fee for others
        }
      },
    },
  ];

  override readonly routeRules: readonly RouteRule[] = [
    {
      id: "pro-tier-routes",
      name: "Pro Tier Routes",
      plan: "pro",
      condition: () => true,
      getRoutes: () => ProTierRoutes,
    },
  ];
}

export class EnterprisePlan extends PricingPlan<"enterprise"> {
  constructor() {
    super("plan-enterprise", "enterprise");
  }

  override readonly feeRules: readonly FeeRule[] = [
    {
      id: "enterprise-tier-fee",
      name: "Enterprise Tier Fee",
      plan: "enterprise",
      condition: (transactionAmount, currency) => {
        switch (currency) {
          case "INR":
            return transactionAmount <= 10_000_000; // Enterprise tier limit for INR
          case "USD":
            return transactionAmount <= 123_456; // Enterprise tier limit for USD
          case "EUR":
            return transactionAmount <= 10_000_000; // Enterprise tier limit for EUR
          default:
            return transactionAmount <= 10_000_000; // Enterprise tier limit for others
        }
      },
      calculateFee: (transactionAmount, currency) => {
        switch (currency) {
          case "INR":
            return toMinorUnits(transactionAmount * 0.005); // 0.5% fee for INR
          case "USD":
            return toMinorUnits(transactionAmount * 0.007); // 0.7% fee for USD
          case "EUR":
            return toMinorUnits(transactionAmount * 0.006); // 0.6% fee for EUR
          default:
            return toMinorUnits(transactionAmount * 0.01); // 1% fee for others
        }
      },
    },
  ];

  override readonly routeRules: readonly RouteRule[] = [
    {
      id: "enterprise-tier-routes",
      name: "Enterprise Tier Routes",
      plan: "enterprise",
      condition: () => true,
      getRoutes: () => EnterpriseTierRoutes,
    },
  ];
}
