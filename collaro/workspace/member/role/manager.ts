import { TSubscriptionPlan } from "@collaro/subscription";
import { IWorkspaceDTO } from "../../interface";
import {
	IBulkRoleAssignmentRequest,
	IBulkRoleAssignmentResult,
	IBulkRoleDeleteRequest,
	IBulkRoleUpdateRequest,
	IInheritanceValidationResult,
	IPermissionValidationResult,
	IRoleDTO,
	IRoleManager,
	IRoleStore,
	IRoleValidationResult,
	IMemberRoleAssignmentDTO,
	PREDEFINED_ROLE_PERMISSIONS,
	ROLE_ERROR_CODES,
	ROLE_LIMITS_BY_SUBSCRIPTION,
	TPermission,
	TPredefinedRoleKey,
	TRoleId,
} from "./types";
import { RoleValidator } from "./validator";

function createRoleId(): TRoleId {
	const suffix = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
	return `role_${suffix}` as unknown as TRoleId;
}

function slugifyRoleKey(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

export class RoleManager implements IRoleManager {
	constructor(
		private readonly store: IRoleStore,
		private readonly subscriptionPlan: TSubscriptionPlan
	) {}

	async seedWorkspaceRoles(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]> {
		const seededRoles: IRoleDTO[] = [];
		for (const roleKey of ["owner", "admin", "member", "guest"] as const) {
			const existingRole = await this.store.findByKey(workspaceId, roleKey);
			if (existingRole) {
				seededRoles.push(existingRole);
				continue;
			}

			const seededRole: IRoleDTO = {
				id: createRoleId(),
				workspaceId,
				key: roleKey,
				name: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
				description: `${roleKey} role for the workspace`,
				permissions: PREDEFINED_ROLE_PERMISSIONS[roleKey],
				parentRoleId: null,
				isCustom: false,
				createdAt: new Date(),
				updatedAt: null,
			};

			await this.store.save(seededRole);
			seededRoles.push(seededRole);
		}

		return seededRoles;
	}

	async createCustomRole(
		workspaceId: IWorkspaceDTO["id"],
		name: string,
		permissions: readonly TPermission[],
		options?: { description?: string; parentRoleId?: TRoleId }
	): Promise<IRoleValidationResult> {
		const workspaceRoles = await this.getRolesForWorkspace(workspaceId);
		const currentCustomRoleCount = workspaceRoles.filter((role) => role.isCustom).length;
		const planValidation = RoleValidator.canCreateCustomRole(this.subscriptionPlan, currentCustomRoleCount);
		if (!planValidation.success) {
			return planValidation;
		}

		const roleKey = slugifyRoleKey(name);
		if (!roleKey) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.INVALID_PERMISSION,
				message: "Role name cannot be empty.",
			};
		}

		const existingRole = await this.store.findByKey(workspaceId, roleKey);
		if (existingRole) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
				message: `Role '${name}' already exists in this workspace.`,
			};
		}

		const filteredPermissions = RoleValidator.filterPermissionsForPlan(this.subscriptionPlan, permissions);
		if (filteredPermissions.length !== permissions.length) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.INVALID_PERMISSION,
				message: "One or more permissions are not allowed on this subscription plan.",
			};
		}

		const roleId = createRoleId();
		const parentRoleId = options?.parentRoleId ?? null;
		if (parentRoleId) {
			const inheritanceValidation = RoleValidator.validateInheritance(roleId, parentRoleId, workspaceRoles);
			if (!inheritanceValidation.success) {
				return {
					success: false,
					code: inheritanceValidation.code,
					message: inheritanceValidation.message,
					errors: [{ field: "parentRoleId", message: inheritanceValidation.message || "Invalid inheritance." }],
				};
			}
		}

		const role: IRoleDTO = {
			id: roleId,
			workspaceId,
			key: roleKey,
			name,
			description: options?.description,
			permissions: filteredPermissions,
			parentRoleId,
			isCustom: true,
			createdAt: new Date(),
			updatedAt: null,
		};

		await this.store.save(role);
		return { success: true, role };
	}

	async updateCustomRole(
		roleId: TRoleId,
		updates: Partial<Pick<IRoleDTO, "name" | "description" | "permissions" | "parentRoleId">>
	): Promise<IRoleValidationResult> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
				message: "Role not found.",
			};
		}

		if (!role.isCustom) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.CANNOT_MODIFY_PREDEFINED,
				message: "Predefined roles cannot be modified.",
			};
		}

		const nextPermissions = updates.permissions
			? RoleValidator.filterPermissionsForPlan(this.subscriptionPlan, updates.permissions)
			: role.permissions;

		if (updates.permissions && nextPermissions.length !== updates.permissions.length) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.INVALID_PERMISSION,
				message: "One or more permissions are not allowed on this subscription plan.",
			};
		}

		if (updates.parentRoleId) {
			const workspaceRoles = await this.getRolesForWorkspace(role.workspaceId);
			const validation = RoleValidator.validateInheritance(role.id, updates.parentRoleId, workspaceRoles);
			if (!validation.success) {
				return {
					success: false,
					code: validation.code,
					message: validation.message,
					errors: [{ field: "parentRoleId", message: validation.message || "Invalid inheritance." }],
				};
			}
		}

		const updatedRole: IRoleDTO = {
			...role,
			...updates,
			permissions: nextPermissions,
			updatedAt: new Date(),
		};

		await this.store.update(roleId, updatedRole);
		return { success: true, role: updatedRole };
	}

	async deleteRole(roleId: TRoleId): Promise<void> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return;
		}

		if (!role.isCustom) {
			throw new Error("Predefined roles cannot be deleted.");
		}

		const assignments = await this.store.listAssignments(role.workspaceId);
		for (const assignment of assignments) {
			if (assignment.roleId === roleId) {
				await this.store.removeMemberRole(assignment.memberId, assignment.workspaceId);
			}
		}

		await this.store.delete(roleId);
	}

	async getRole(roleId: TRoleId): Promise<IRoleDTO | null> {
		return this.store.findById(roleId);
	}

	async getRoleByKey(workspaceId: IWorkspaceDTO["id"], key: string): Promise<IRoleDTO | null> {
		return this.store.findByKey(workspaceId, key);
	}

	async getRolesForWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]> {
		return this.store.findByWorkspace(workspaceId);
	}

	async getPredefinedRole(workspaceId: IWorkspaceDTO["id"], key: TPredefinedRoleKey): Promise<IRoleDTO | null> {
		await this.seedWorkspaceRoles(workspaceId);
		return this.store.findByKey(workspaceId, key);
	}

	async hasPermission(roleId: TRoleId, permission: TPermission): Promise<IPermissionValidationResult> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return {
				hasPermission: false,
				permission,
				reason: "Role not found.",
			};
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.hasPermission(role, permission, allRoles);
	}

	async hasAnyPermission(roleId: TRoleId, permissions: readonly TPermission[]): Promise<boolean> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return false;
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.hasAnyPermission(role, permissions, allRoles);
	}

	async hasAllPermissions(roleId: TRoleId, permissions: readonly TPermission[]): Promise<boolean> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return false;
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.hasAllPermissions(role, permissions, allRoles);
	}

	async assignRoleToMember(memberId: string, workspaceId: IWorkspaceDTO["id"], roleId: TRoleId, assignedBy: string): Promise<void> {
		const role = await this.store.findById(roleId);
		if (!role) {
			throw new Error(`Role with ID ${String(roleId)} not found.`);
		}

		if (role.workspaceId !== workspaceId) {
			throw new Error("Role does not belong to the target workspace.");
		}

		const assignment: IMemberRoleAssignmentDTO = {
			memberId,
			workspaceId,
			roleId,
			assignedBy,
			assignedAt: new Date(),
		};

		await this.store.assignRole(assignment);
	}

	async getMemberRole(memberId: string, workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO | null> {
		const assignment = await this.store.getMemberRoleAssignment(memberId, workspaceId);
		if (!assignment) {
			return null;
		}

		return this.store.findById(assignment.roleId);
	}

	async bulkAssignRole(request: IBulkRoleAssignmentRequest): Promise<IBulkRoleAssignmentResult> {
		if (!ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations) {
			return {
				successful: [],
				failed: request.memberIds.map((memberId) => ({
					memberId,
					message: "Bulk operations are not available on this subscription plan.",
					code: ROLE_ERROR_CODES.PLAN_LIMIT_EXCEEDED,
				})),
				totalCount: request.memberIds.length,
				successCount: 0,
				failureCount: request.memberIds.length,
			};
		}

		const successful: string[] = [];
		const failed: { memberId: string; message: string; code: string }[] = [];

		for (const memberId of request.memberIds) {
			try {
				await this.assignRoleToMember(memberId, request.workspaceId, request.roleId, request.assignedBy);
				successful.push(memberId);
			} catch (error) {
				failed.push({
					memberId,
					message: error instanceof Error ? error.message : "Unknown error.",
					code: ROLE_ERROR_CODES.BULK_OPERATION_PARTIAL_FAILURE,
				});
			}
		}

		return {
			successful,
			failed,
			totalCount: request.memberIds.length,
			successCount: successful.length,
			failureCount: failed.length,
		};
	}

	async bulkUpdateRoles(request: IBulkRoleUpdateRequest): Promise<IRoleValidationResult[]> {
		if (!ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations) {
			return request.roleIds.map(() => ({
				success: false,
				code: ROLE_ERROR_CODES.PLAN_LIMIT_EXCEEDED,
				message: "Bulk operations are not available on this subscription plan.",
			}));
		}

		const results: IRoleValidationResult[] = [];
		for (const roleId of request.roleIds) {
			const role = await this.store.findById(roleId);
			if (!role) {
				results.push({ success: false, code: ROLE_ERROR_CODES.ROLE_NOT_FOUND, message: "Role not found." });
				continue;
			}

			if (!role.isCustom) {
				results.push({ success: false, code: ROLE_ERROR_CODES.CANNOT_MODIFY_PREDEFINED, message: "Predefined roles cannot be modified." });
				continue;
			}

			const updatedRole: IRoleDTO = {
				...role,
				...request.updates,
				updatedAt: new Date(),
			};

			await this.store.update(roleId, updatedRole);
			results.push({ success: true, role: updatedRole });
		}

		return results;
	}

	async bulkDeleteRoles(request: IBulkRoleDeleteRequest): Promise<void> {
		if (!ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations) {
			throw new Error("Bulk operations are not available on this subscription plan.");
		}

		for (const roleId of request.roleIds) {
			const role = await this.store.findById(roleId);
			if (!role || !role.isCustom) {
				continue;
			}

			const assignments = await this.store.listAssignments(request.workspaceId);
			for (const assignment of assignments) {
				if (assignment.roleId !== roleId) {
					continue;
				}

				if (request.fallbackRoleId) {
					await this.assignRoleToMember(assignment.memberId, request.workspaceId, request.fallbackRoleId, assignment.assignedBy);
				} else {
					await this.store.removeMemberRole(assignment.memberId, request.workspaceId);
				}
			}

			await this.store.delete(roleId);
		}
	}

	async validateInheritance(roleId: TRoleId, parentRoleId: TRoleId): Promise<IInheritanceValidationResult> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return {
				success: false,
				hasCircularDependency: false,
				chain: [roleId],
				code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
				message: "Role not found.",
			};
		}

		const workspaceRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.validateInheritance(roleId, parentRoleId, workspaceRoles);
	}

	async computeAllPermissions(role: IRoleDTO): Promise<readonly TPermission[]> {
		const workspaceRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.computeAllPermissions(role, workspaceRoles);
	}
}
