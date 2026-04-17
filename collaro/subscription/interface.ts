export interface ISubscriptionPlanConfig {
  name: string;
  price: number;
  features: string[];
}

export type TSubscriptionPlan = "free" | "pro" | "enterprise" & {};

export interface ISubscriptionValidationContext {
  plan: TSubscriptionPlan;
  userId: string;
}

export interface IValidationResult {
  isValid: boolean;
  message?: string;
}
