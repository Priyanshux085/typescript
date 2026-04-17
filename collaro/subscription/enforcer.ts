/**
 * Subscription Enforcer
 * 
 * Applies subscription validation rules to actual operations
 * Converts validation results into errors or allows operations to proceed
 */

import {
	TSubscriptionPlan,
	IValidationResult,
	IMemberValidationContext,
	IPlanUpgradeContext,
} from "./types";
import { SubscriptionValidator } from "./validator";

/**
 * Custom error for subscription violations
 */
export class SubscriptionError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = "SubscriptionError";
	}
}

/**
 * SubscriptionEnforcer applies validation rules to operations
 * Uses SubscriptionValidator for validation logic
 */
export class SubscriptionEnforcer {
	/**
	 * Enforce member addition constraints
	 * Throws error if adding member would exceed plan limit
	 *
	 * @param context - Member validation context
	 * @throws SubscriptionError if validation fails
	 *
	 * @example
	 * try {
	 *   SubscriptionEnforcer.enforceMemberAddition({
	 *     currentPlan: "free",
	 *     currentMemberCount: 5
	 *   });
	 * } catch (error) {
	 *   if (error instanceof SubscriptionError) {
	 *     console.log(`${error.code}: ${error.message}`);
	 *   }
	 * }
	 */
	static enforceMemberAddition(context: IMemberValidationContext): void {
		const validation = SubscriptionValidator.canAddMember(context);
		this.throwIfInvalid(validation);
	}

	/**
	 * Enforce plan upgrade constraints
	 * Throws error if upgrade is not allowed (e.g., downgrade attempt)
	 *
	 * @param context - Plan upgrade context
	 * @throws SubscriptionError if validation fails
	 *
	 * @example
	 * try {
	 *   SubscriptionEnforcer.enforcePlanUpgrade({
	 *     fromPlan: "pro",
	 *     toPlan: "free"
	 *   });
	 * } catch (error) {
	 *   // "Downgrades are not permitted..."
	 * }
	 */
	static enforcePlanUpgrade(context: IPlanUpgradeContext): void {
		const validation = SubscriptionValidator.canUpgradePlan(context);
		this.throwIfInvalid(validation);
	}

	/**
	 * Enforce that members fit within a plan's limits
	 * Throws error if current members exceed plan's maximum
	 *
	 * @param memberCount - Current number of members
	 * @param plan - Plan to validate against
	 * @throws SubscriptionError if validation fails
	 */
	static enforceMembersForPlan(memberCount: number, plan: TSubscriptionPlan): void {
		const validation = SubscriptionValidator.membersCanFitInPlan(memberCount, plan);
		this.throwIfInvalid(validation);
	}

	/**
	 * Internal: Convert validation result to thrown error
	 *
	 * @param validation - Validation result
	 * @throws SubscriptionError if validation failed
	 */
	private static throwIfInvalid(validation: IValidationResult): void {
		if (!validation.success) {
			throw new SubscriptionError(
				validation.message || "Subscription validation failed",
				validation.code || "SUBSCRIPTION_ERROR",
			);
		}
	}

	/**
	 * Validate operation without throwing
	 * Returns validation result for caller to handle
	 *
	 * @param context - Member validation context
	 * @returns Validation result
	 */
	static validateMemberAddition(context: IMemberValidationContext): IValidationResult {
		return SubscriptionValidator.canAddMember(context);
	}

	/**
	 * Validate upgrade without throwing
	 * Returns validation result for caller to handle
	 *
	 * @param context - Plan upgrade context
	 * @returns Validation result
	 */
	static validatePlanUpgrade(context: IPlanUpgradeContext): IValidationResult {
		return SubscriptionValidator.canUpgradePlan(context);
	}
}
