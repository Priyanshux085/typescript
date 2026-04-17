/**
 * Subscription System Types & Configuration
 * 
 * Defines all subscription tiers and their configurations for per-workspace subscriptions.
 * Each workspace has an independent subscription controlling member capacity.
 */

/**
 * Supported subscription tiers
 * Ordered by hierarchy: free < pro < enterprise
 */
export type TSubscriptionPlan = "free" | "pro" | "enterprise";

/**
 * Configuration for a subscription plan
 * Defines limits and metadata for each tier
 */
export interface ISubscriptionPlanConfig {
	readonly maxMembers: number;
	readonly maxWorkspaces?: number;
	readonly description: string;
	readonly features: readonly string[];
}

/**
 * Plan-specific limits and configurations
 * Single source of truth for subscription rules
 */
export const SUBSCRIPTION_PLANS: Readonly<Record<TSubscriptionPlan, ISubscriptionPlanConfig>> = {
	free: {
		maxMembers: 5,
		description: "Free tier - Limited to 5 members per workspace",
		features: ["Basic workspace", "Up to 5 members", "Community support"],
	},
	pro: {
		maxMembers: 50,
		description: "Pro tier - Up to 50 members per workspace",
		features: ["Advanced workspace", "Up to 50 members", "Email support", "Custom branding"],
	},
	enterprise: {
		maxMembers: 100,
		description: "Enterprise tier - Up to 100+ members per workspace",
		features: ["Enterprise workspace", "Up to 100+ members", "Priority support", "Advanced analytics", "SSO"],
	},
};

/**
 * Result object for validation operations
 * Enables flexible error handling - caller decides what to do with failures
 */
export interface IValidationResult {
	readonly success: boolean;
	readonly message?: string;
	readonly code?: string;
}

/**
 * Context needed for member addition validation
 */
export interface IMemberValidationContext {
	readonly currentPlan: TSubscriptionPlan;
	readonly currentMemberCount: number;
}

/**
 * Context needed for plan upgrade validation
 */
export interface IPlanUpgradeContext {
	readonly fromPlan: TSubscriptionPlan;
	readonly toPlan: TSubscriptionPlan;
	readonly currentMemberCount?: number;
}

/**
 * Error codes for subscription validation failures
 */
export const SUBSCRIPTION_ERROR_CODES = {
	MEMBER_LIMIT_EXCEEDED: "MEMBER_LIMIT_EXCEEDED",
	INVALID_PLAN: "INVALID_PLAN",
	DOWNGRADE_NOT_ALLOWED: "DOWNGRADE_NOT_ALLOWED",
	MEMBERS_EXCEED_PLAN_LIMIT: "MEMBERS_EXCEED_PLAN_LIMIT",
	SAME_PLAN: "SAME_PLAN",
} as const;
