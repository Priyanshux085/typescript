import { ISubscriptionPlanConfig, ISubscriptionValidationContext, IValidationResult, TSubscriptionPlan } from "./interface";

export const SUBSCRIPTION_PLANS: Record<TSubscriptionPlan, ISubscriptionPlanConfig> = {
  free: { 
    name: "Free", 
    price: 0, 
    features: ["Feature A"]
  },
  pro: { 
    name: "Pro", 
    price: 19.99, 
    features: ["Feature A", "Feature B", "Feature C"] 
  },
  enterprise: { 
    name: "Enterprise", 
    price: 49.99, 
    features: ["Feature A", "Feature B", "Feature C", "Feature D"] 
  },
};

export class SubscriptionValidator {
  private plans: Record<TSubscriptionPlan, ISubscriptionPlanConfig>;

  constructor() {
    this.plans = SUBSCRIPTION_PLANS;
  }

  async validate(context: ISubscriptionValidationContext): Promise<IValidationResult> {
    const planConfig = this.plans[context.plan];
    if (!planConfig) {
      return Promise.resolve({ isValid: false, message: "Subscription plan does not exist." });
    }

    return Promise.resolve({ isValid: true, message: "Subscription plan is valid." });
  }

  async getPlanConfig(plan: TSubscriptionPlan): Promise<ISubscriptionPlanConfig | null> {
    return this.plans[plan] || null;
  }

  async validatePlanUpgrade(currentPlan: TSubscriptionPlan, newPlan: TSubscriptionPlan): Promise<IValidationResult> {
    const planOrder: TSubscriptionPlan[] = ["free", "pro", "enterprise"];
    const currentIndex = planOrder.indexOf(currentPlan);
    const newIndex = planOrder.indexOf(newPlan);

    if (newIndex === -1) {
      return Promise.resolve({ isValid: false, message: "New subscription plan does not exist." });
    }

    if (newIndex <= currentIndex) {
      return Promise.resolve({ isValid: false, message: "Downgrades are not allowed." });
    }

    return Promise.resolve({ isValid: true, message: "Plan upgrade is valid." });
  }
}