import { TSubscriptionPlan } from "@collaro/subscription";
import {
	IRoleDTO,
	IInheritanceValidationResult,
	IPermissionValidationResult,
	IRoleValidationResult,
	PREDEFINED_ROLE_PERMISSIONS,
	ROLE_ERROR_CODES,
	ROLE_LIMITS_BY_SUBSCRIPTION,
	ROLE_PERMISSION_GROUPS,
	TPermission,
	TPredefinedRoleKey,
	TRoleId,
} from "./types";

export class RoleValidator {
	static canCreateCustomRole(subscription: TSubscriptionPlan, currentCustomRoleCount: number): IRoleValidationResult {
		const limits = ROLE_LIMITS_BY_SUBSCRIPTION[subscription];

		if (!limits.canCreateCustomRoles) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.CUSTOM_ROLES_NOT_ALLOWED,
				message: `${subscription} plan does not support custom roles.`,
			};
		}

		if (currentCustomRoleCount >= limits.maxCustomRoles) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.PLAN_LIMIT_EXCEEDED,
				message: `${subscription} plan allows up to ${limits.maxCustomRoles} custom roles.`,
			};
		}

		return { success: true };
	}

	static isPermissionAllowedOnPlan(subscription: TSubscriptionPlan, permission: TPermission): boolean {
		return ROLE_LIMITS_BY_SUBSCRIPTION[subscription].allowedPermissions.includes(permission);
	}

	static filterPermissionsForPlan(subscription: TSubscriptionPlan, permissions: readonly TPermission[]): readonly TPermission[] {
		const allowed = ROLE_LIMITS_BY_SUBSCRIPTION[subscription].allowedPermissions;
		return permissions.filter((permission) => allowed.includes(permission));
	}

	static getPermissionGroup(group: keyof typeof ROLE_PERMISSION_GROUPS): readonly TPermission[] {
		return ROLE_PERMISSION_GROUPS[group];
	}

	static computeAllPermissions(role: IRoleDTO, allRoles: readonly IRoleDTO[] = []): readonly TPermission[] {
		const permissions = new Set<TPermission>(role.permissions);
		const visited = new Set<TRoleId>([role.id]);
		let currentParentId = role.parentRoleId;

		while (currentParentId) {
			if (visited.has(currentParentId)) {
				break;
			}

			visited.add(currentParentId);
			const parentRole = allRoles.find((candidate) => candidate.id === currentParentId);
			if (!parentRole) {
				break;
			}

			for (const permission of parentRole.permissions) {
				permissions.add(permission);
			}

			currentParentId = parentRole.parentRoleId;
		}

		return [...permissions];
	}

	static validateInheritance(roleId: TRoleId, parentRoleId: TRoleId, allRoles: readonly IRoleDTO[]): IInheritanceValidationResult {
		const visited = new Set<TRoleId>();
		const chain: TRoleId[] = [roleId];
		let currentParentId: TRoleId | null = parentRoleId;

		while (currentParentId) {
			if (currentParentId === roleId || visited.has(currentParentId)) {
				return {
					success: false,
					hasCircularDependency: true,
					chain,
					code: ROLE_ERROR_CODES.CIRCULAR_DEPENDENCY,
					message: "Circular role inheritance detected.",
				};
			}

			visited.add(currentParentId);
			chain.push(currentParentId);
			const parentRole = allRoles.find((candidate) => candidate.id === currentParentId);
			if (!parentRole) {
				return {
					success: false,
					hasCircularDependency: false,
					chain,
					code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
					message: "Parent role not found.",
				};
			}

			currentParentId = parentRole.parentRoleId;
		}

		return {
			success: true,
			hasCircularDependency: false,
			chain,
		};
	}

	static hasPermission(role: IRoleDTO, permission: TPermission, allRoles: readonly IRoleDTO[] = []): IPermissionValidationResult {
		const permissions = this.computeAllPermissions(role, allRoles);

		if (permissions.includes(permission)) {
			return {
				hasPermission: true,
				permission,
			};
		}

		return {
			hasPermission: false,
			permission,
			reason: `Role ${role.key} does not include permission ${permission}.`,
		};
	}

	static hasAnyPermission(role: IRoleDTO, permissions: readonly TPermission[], allRoles: readonly IRoleDTO[] = []): boolean {
		const resolved = this.computeAllPermissions(role, allRoles);
		return permissions.some((permission) => resolved.includes(permission));
	}

	static hasAllPermissions(role: IRoleDTO, permissions: readonly TPermission[], allRoles: readonly IRoleDTO[] = []): boolean {
		const resolved = this.computeAllPermissions(role, allRoles);
		return permissions.every((permission) => resolved.includes(permission));
	}

	static isPredefinedRoleKey(key: string): key is TPredefinedRoleKey {
		return key === "owner" || key === "admin" || key === "member" || key === "guest";
	}

	static getPredefinedPermissions(roleKey: TPredefinedRoleKey): readonly TPermission[] {
		return PREDEFINED_ROLE_PERMISSIONS[roleKey];
	}
}
