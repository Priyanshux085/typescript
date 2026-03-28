import { createTenantId, type TenantId } from "../../../lib/brand";
import { createTenantPlan, type TenantPlan, type TenantPlanConfig } from "./TenantPlan";

interface ITenant<T extends TenantPlan = TenantPlan> {
  name: string;
  plan: T;
  createdAt: Date;
  updatedAt: Date;
  planConfig: TenantPlanConfig<T>;
}

export class Tenant<T extends TenantPlan> implements ITenant<T> {
  readonly createdAt: Date = new Date();
  updatedAt: Date = new Date();
  plan: T;
  planConfig: TenantPlanConfig<T>;

  static id: TenantId = createTenantId(`${Date.now()}`);
  
  constructor(
    public name: string,
    plan: T
  ) {
    this.plan = plan;
    this.planConfig = createTenantPlan(plan);
  }
}
// const tenant = new Tenant("Acme Corp", "pro");