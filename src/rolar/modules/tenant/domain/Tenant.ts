import { createTenantId, type TenantId } from "../../../lib/brand";
import type { PricingPlan } from "../../pricing/domain/PricingPlan";
import type { TenantPlan } from "./TenantPlan";

export type TenantProps<T extends TenantPlan> = Readonly<{
	id: TenantId;
	name: string;
	slug: string;
	pricingPlan: PricingPlan<T>;
	createdAt?: Date;
	updatedAt?: Date;
}>;

export class Tenant {
	readonly id: TenantId;
	readonly name: string;
	readonly slug: string;
	readonly createdAt: Date;
	private _updatedAt: Date;
	private _pricingPlan: PricingPlan<TenantPlan>;

	constructor(props: TenantProps<TenantPlan>) {
		this.id = props.id;
		this.name = props.name;
		this.slug = props.slug;
		this.createdAt = props.createdAt ?? new Date();
		this._updatedAt = props.updatedAt ?? new Date();
		this._pricingPlan = props.pricingPlan;
	}

	static create(
		name: string,
		slug: string,
		pricingPlan: PricingPlan<TenantPlan>,
		id?: TenantId
	): Tenant {
		const tenantId = id ?? createTenantId(`${Date.now()}`);
		return new Tenant({ id: tenantId, name, slug, pricingPlan });
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	get pricingPlan(): PricingPlan<TenantPlan> {
		return this._pricingPlan;
	}

	changePlan(newPlan: PricingPlan<TenantPlan>): void {
		if (newPlan.id === this._pricingPlan.id) {
			throw new Error("Tenant already uses this pricing plan.");
		}

		this._pricingPlan = newPlan;
		this._updatedAt = new Date();
	}
}