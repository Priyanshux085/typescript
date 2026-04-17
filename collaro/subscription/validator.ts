/**
 * Subscription Validator
 * 
 * Pure validation logic for subscription constraints
 * No side effects - returns results for flexible error handling
 * All methods are pure functions (same input → same output)
 */

import {
	TSubscriptionPlan,
	SUBSCRIPTION_PLANS,
	IValidationResult,
	IMemberValidationContext,
	IPlanUpgradeContext,
	SUBSCRIPTION_ERROR_CODES,
} from "./types";

/**
 * SubscriptionValidator provides pure validation functions for subscription operations
 * 
 * All methods:
 * - Return IValidationResult instead of throwing
 * - Are pure (no side effects)
 * - Are static (no state)
 * - Can be composed and tested easily
 */
export class SubscriptionValidator {
	/**
	 * Validates that adding a new member doesn't exceed plan limits
	 *
	 * @param context - Current subscription context
	 * @returns Validation result
	 *
	 * @example
	 * const result = SubscriptionValidator.canAddMember({
	 *   currentPlan: "free",
	 *   currentMemberCount: 5  // at limit
	 * });
	 * // Returns: { success: false, code: "MEMBER_LIMIT_EXCEEDED", message: "..." }
	 */
	static canAddMember(context: IMemberValidationContext): IValidationResult {
		const planConfig = SUBSCRIPTION_PLANS[context.currentPlan];

		if (context.currentMemberCount >= planConfig.maxMembers) {
			return {
				success: false,
				code: SUBSCRIPTION_ERROR_CODES.MEMBER_LIMIT_EXCEEDED,
				message: `Cannot add member. ${context.currentPlan} plan has reached maximum of ${planConfig.maxMembers} members.`,
			};
		}

		return { success: true };
	}

	/**
	 * Validates that a plan upgrade is allowed
	 * Only upgrades permitted (free → pro → enterprise)
	 * Downgrades prevented to protect data
	 *
	 * @param context - Upgrade context
	 * @returns Validation result
	 *
	 * @example
	 * const result = SubscriptionValidator.canUpgradePlan({
	 *   fromPlan: "pro",
	 *   toPlan: "free"  // downgrade attempt
	 * });
	 * // Returns: { success: false, code: "DOWNGRADE_NOT_ALLOWED", message: "..." }
	 */
	static canUpgradePlan(context: IPlanUpgradeContext): IValidationResult {
		// Validate both plans exist
		if (!this.isPlanValid(context.fromPlan) || !this.isPlanValid(context.toPlan)) {
			return {
				success: false,
				code: SUBSCRIPTION_ERROR_CODES.INVALID_PLAN,
				message: "Invalid subscription plan specified.",
			};
		}

		// Prevent same plan "upgrade"
		if (context.fromPlan === context.toPlan) {
			return {
				success: false,
				code: SUBSCRIPTION_ERROR_CODES.SAME_PLAN,
				message: `Cannot upgrade to the same plan. Already on ${context.fromPlan} plan.`,
			};
		}

		// Get plan hierarchy
		const hierarchy = this.getPlanHierarchy();
		const fromLevel = hierarchy[context.fromPlan];
		const toLevel = hierarchy[context.toPlan];

		// Enforce upgrade-only rule
		if (toLevel <= fromLevel) {
			return {
				success: false,
				code: SUBSCRIPTION_ERROR_CODES.DOWNGRADE_NOT_ALLOWED,
				message: `Downgrades are not permitted. Cannot downgrade from ${context.fromPlan} to ${context.toPlan}.`,
			};
		}

		return { success: true };
	}

	/**
	 * Validates that current members fit within a plan's limits
	 * Useful for checking compatibility before plan changes
	 *
	 * @param memberCount - Current number of members
	 * @param plan - Target plan to check
	 * @returns Validation result
	 *
	 * @example
	 * const result = SubscriptionValidator.membersCanFitInPlan(60, "pro");
	 * // Returns: { success: false, code: "MEMBERS_EXCEED_PLAN_LIMIT", message: "..." }
	 * // (60 members > 50 member pro limit)
	 */
	static membersCanFitInPlan(memberCount: number, plan: TSubscriptionPlan): IValidationResult {
		if (!this.isPlanValid(plan)) {
			return {
				success: false,
				code: SUBSCRIPTION_ERROR_CODES.INVALID_PLAN,
				message: "Invalid subscription plan specified.",
			};
		}

		const planConfig = SUBSCRIPTION_PLANS[plan];

		if (memberCount > planConfig.maxMembers) {
			return {
				success: false,
				code: SUBSCRIPTION_ERROR_CODES.MEMBERS_EXCEED_PLAN_LIMIT,
				message: `Cannot change to ${plan} plan. Current member count (${memberCount}) exceeds plan limit (${planConfig.maxMembers}).`,
			};
		}

		return { success: true };
	}

	/**
	 * Check if a plan is valid
	 *
	 * @param plan - Plan to validate
	 * @returns true if valid, false otherwise
	 */
	static isPlanValid(plan: unknown): plan is TSubscriptionPlan {
		return plan === "free" || plan === "pro" || plan === "enterprise";
	}

	/**
	 * Get maximum members allowed for a plan
	 *
	 * @param plan - Subscription plan
	 * @returns Maximum member count
	 *
	 * @throws Error if plan is invalid
	 */
	static getMaxMembers(plan: TSubscriptionPlan): number {
		if (!this.isPlanValid(plan)) {
			throw new Error(`Invalid subscription plan: ${plan}`);
		}
		return SUBSCRIPTION_PLANS[plan].maxMembers;
	}

	/**
	 * Get full configuration for a plan
	 *
	 * @param plan - Subscription plan
	 * @returns Plan configuration
	 *
	 * @throws Error if plan is invalid
	 */
	static getPlanConfig(plan: TSubscriptionPlan) {
		if (!this.isPlanValid(plan)) {
			throw new Error(`Invalid subscription plan: ${plan}`);
		}
		return SUBSCRIPTION_PLANS[plan];
	}

	/**
	 * Get plan hierarchy for upgrade validation
	 * Higher number = higher tier
	 *
	 * @returns Mapping of plans to hierarchy level
	 */
	private static getPlanHierarchy(): Record<TSubscriptionPlan, number> {
		return {
			free: 0,
			pro: 1,
			enterprise: 2,
		};
	}

	/**
	 * Get all valid plans
	 *
	 * @returns Array of plan names
	 */
	static getAllPlans(): readonly TSubscriptionPlan[] {
		return ["free", "pro", "enterprise"];
	}

	/**
	 * Check if plan1 is lower tier than plan2
	 *
	 * @param plan1 - First plan
	 * @param plan2 - Second plan
	 * @returns true if plan1 < plan2 in hierarchy
	 */
	static isLowerTier(plan1: TSubscriptionPlan, plan2: TSubscriptionPlan): boolean {
		const hierarchy = this.getPlanHierarchy();
		return hierarchy[plan1] < hierarchy[plan2];
	}

	/**
	 * Check if plan1 is higher tier than plan2
	 *
	 * @param plan1 - First plan
	 * @param plan2 - Second plan
	 * @returns true if plan1 > plan2 in hierarchy
	 */
	static isHigherTier(plan1: TSubscriptionPlan, plan2: TSubscriptionPlan): boolean {
		const hierarchy = this.getPlanHierarchy();
		return hierarchy[plan1] > hierarchy[plan2];
	}
}
