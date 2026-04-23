import { TSubscriptionPlan } from "@collaro/subscription";
import { IWorkspaceDTO, IWorkspaceStore } from "../interface";
import {
	IBulkRoleAssignmentRequest,
	IBulkRoleAssignmentResult,
	IBulkRoleDeleteRequest,
	IBulkRoleUpdateRequest,
	IInheritanceValidationResult,
	IPermissionValidationResult,
	IRoleDTO,
	IRoleStore,
	IRoleValidationResult,
	IMemberRoleAssignmentDTO,
	PREDEFINED_ROLE_PERMISSIONS,
	ROLE_ERROR_CODES,
	ROLE_LIMITS_BY_SUBSCRIPTION,
	TPermission,
	TPredefinedRoleKey,
	TRoleId,
	IWorkspaceRoleManager,
	IRoleAssignmentStore,
	TCreateCustomRoleParams,
} from "./interface";
import { RoleValidator } from "./validator";
import { ID } from "@collaro/utils";
import { MemoryRoleStore } from "./store";
import { IMemberDTO, RoleAssignmentStore } from "./member";
import { MemoryWorkspaceStore } from "../stores/memory-workspace-store";

function slugifyRoleKey(name: string): string {
	return name
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "_")
		.replace(/^_+|_+$/g, "");
}

const DEFAULT_WORKSPACE_ROLES = [
	"owner",
	"admin",
	"member",
	"guest",
] as const satisfies readonly TPredefinedRoleKey[];

/**
 * Manages roles and permissions for a workspace.
 *
 * ## Key Responsibilities:
 * - Creating, updating, and deleting custom roles within subscription limits
 * - Validating role inheritance and permissions against subscription plans
 * - Seeding predefined roles (owner, admin, member, guest)
 * - Assigning roles to members
 * - Managing bulk role operations
 *
 * ## Lazy Initialization:
 * The workspace slug is lazily initialized on first use to avoid antipattern
 * of async operations in constructors. Use `ensureSlugInitialized()` before
 * methods that need the slug.
 *
 * ## Singleton Dependencies:
 * - MemoryRoleStore: Shared across all RoleManager instances for a workspace
 * - RoleAssignmentStore: Shared tracking of member-to-role assignments
 */
export class RoleManager implements IWorkspaceRoleManager {
	private readonly WorkspaceRoleMap: Record<string, IRoleDTO["name"]> = {};
	private readonly workspaceStore: IWorkspaceStore =
		MemoryWorkspaceStore.getInstance();
	public store: IRoleStore = MemoryRoleStore.getInstance();
	public slug: IWorkspaceDTO["slug"] = "";
	public roleAssignmentStore: IRoleAssignmentStore =
		RoleAssignmentStore.getInstance();
	private slugInitialized = false;
	private slugInitPromise: Promise<string> | null = null;

	private async ensureSlugInitialized(): Promise<string> {
		if (this.slugInitialized) {
			return this.slug;
		}

		if (this.slugInitPromise) {
			return this.slugInitPromise;
		}

		this.slugInitPromise = this.fetchSlug(this.workspaceId);
		this.slug = await this.slugInitPromise;
		this.slugInitialized = true;
		return this.slug;
	}

	private async fetchSlug(workspaceId: IWorkspaceDTO["id"]): Promise<string> {
		try {
			const workspace = await this.workspaceStore.findById(workspaceId);
			if (!workspace) {
				throw new Error(`Workspace with ID ${String(workspaceId)} not found.`);
			}
			this.slug = workspace.slug;
			return workspace.slug;
		} catch (error) {
			console.error("Error initializing RoleManager:", error);
			throw new Error(
				`Failed to initialize RoleManager for workspace ${String(workspaceId)}`,
				{ cause: error }
			);
		}
	}

	constructor(
		readonly workspaceId: IWorkspaceDTO["id"],
		private readonly subscriptionPlan: TSubscriptionPlan
	) {
		// Lazy initialization of slug - will be initialized on first use
		// This prevents antipattern of async operations in constructor
	}

	async seedDefaultWorkspaceRoles(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IRoleDTO[]> {
		await this.ensureSlugInitialized();

		// Seed predefined roles - check if they already exist to avoid duplicates
		const seededRoles: IRoleDTO[] = [];

		for (const roleKey of DEFAULT_WORKSPACE_ROLES) {
			const existingRole = await this.store.findByName(workspaceId, roleKey);
			if (existingRole) {
				this.WorkspaceRoleMap[String(existingRole.id)] = existingRole.name;
				continue;
			}

			const seededRole: IRoleDTO = {
				id: ID.roleId(this.slug),
				workspaceId,
				name: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
				description: `${roleKey} role for the workspace`,
				permissions: PREDEFINED_ROLE_PERMISSIONS[roleKey],
				parentRoleId: null,
				isCustom: false,
				createdAt: new Date(),
				updatedAt: null,
			};

			await this.store.save(seededRole);
			this.WorkspaceRoleMap[String(seededRole.id)] = seededRole.name;
			seededRoles.push(seededRole);
		}

		return seededRoles;
	}

	async getRole(role: IRoleDTO["name"]): Promise<IRoleDTO | null> {
		try {
			return await this.store.findByName(this.workspaceId, role);
		} catch (error) {
			throw new Error(`Failed to fetch role "${role}"`, { cause: error });
		}
	}

	async createCustomRole({
		name,
		permissions,
		options,
	}: TCreateCustomRoleParams): Promise<IRoleValidationResult> {
		await this.ensureSlugInitialized();

		const workspaceRoles = await this.store.findByWorkspace(this.workspaceId);
		const currentCustomRoleCount = workspaceRoles.filter(
			(role) => role.isCustom
		).length;

		const planValidation = RoleValidator.canCreateCustomRole(
			this.subscriptionPlan,
			currentCustomRoleCount
		);

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

		const existingRole = await this.store.findByName(this.workspaceId, roleKey);

		if (existingRole) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
				message: `Role '${name}' already exists in this workspace.`,
			};
		}

		const filteredPermissions = RoleValidator.filterPermissionsForPlan(
			this.subscriptionPlan,
			permissions
		);
		if (filteredPermissions.length !== permissions.length) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.INVALID_PERMISSION,
				message:
					"One or more permissions are not allowed on this subscription plan.",
			};
		}

		const roleId = ID.roleId(this.slug);
		const parentRoleId = options?.parentRoleId ?? null;
		if (parentRoleId) {
			const inheritanceValidation = RoleValidator.validateInheritance(
				roleId,
				parentRoleId,
				workspaceRoles
			);
			if (!inheritanceValidation.success) {
				return {
					success: false,
					code: inheritanceValidation.code,
					message: inheritanceValidation.message,
					errors: [
						{
							field: "parentRoleId",
							message: inheritanceValidation.message || "Invalid inheritance.",
						},
					],
				};
			}
		}

		const role: IRoleDTO = {
			id: roleId,
			workspaceId: this.workspaceId,
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
		updates: Partial<
			Pick<IRoleDTO, "name" | "description" | "permissions" | "parentRoleId">
		>
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
			? RoleValidator.filterPermissionsForPlan(
					this.subscriptionPlan,
					updates.permissions
				)
			: role.permissions;

		if (
			updates.permissions &&
			nextPermissions.length !== updates.permissions.length
		) {
			return {
				success: false,
				code: ROLE_ERROR_CODES.INVALID_PERMISSION,
				message:
					"One or more permissions are not allowed on this subscription plan.",
			};
		}

		if (updates.parentRoleId) {
			const workspaceRoles = await this.store.findByWorkspace(role.workspaceId);
			const validation = RoleValidator.validateInheritance(
				role.id,
				updates.parentRoleId,
				workspaceRoles
			);
			if (!validation.success) {
				return {
					success: false,
					code: validation.code,
					message: validation.message,
					errors: [
						{
							field: "parentRoleId",
							message: validation.message || "Invalid inheritance.",
						},
					],
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

	async deleteRole(role: IRoleDTO["name"]): Promise<void> {
		const roleDto = await this.store.findByName(this.workspaceId, role);
		if (!roleDto) {
			throw new Error(`Role "${role}" not found in workspace.`);
		}

		if (!roleDto.isCustom) {
			throw new Error("Predefined roles cannot be deleted.");
		}

		const assignments = await this.store.listAssignments(roleDto.workspaceId);
		for (const assignment of assignments) {
			if (assignment.roleId === roleDto.id) {
				await this.store.removeMemberRole(
					assignment.memberId,
					assignment.workspaceId
				);
			}
		}

		await this.store.delete(roleDto.id);
	}

	async assignRole(
		memberId: IMemberDTO["id"],
		role: IRoleDTO["name"],
		assignedBy: IMemberDTO["id"]
	): Promise<void> {
		const roleEntity = await this.store.findByName(this.workspaceId, role);
		if (!roleEntity) {
			throw new Error(`Role "${role}" not found in workspace.`);
		}

		try {
			await this.store.assignRole({
				memberId,
				workspaceId: this.workspaceId,
				roleId: roleEntity.id,
				assignedBy,
				assignedAt: new Date(),
			});
		} catch (error) {
			throw new Error(
				`Failed to assign role "${role}" to member ${String(memberId)}`,
				{ cause: error }
			);
		}
	}

	async getRoleByKey(
		workspaceId: IWorkspaceDTO["id"],
		key: string
	): Promise<IRoleDTO | null> {
		return this.store.findByName(workspaceId, key);
	}

	async getRoleByID(roleId: TRoleId): Promise<IRoleDTO | null> {
		try {
			return await this.store.findById(roleId);
		} catch (error) {
			throw new Error(`Failed to fetch role with ID ${String(roleId)}`, {
				cause: error,
			});
		}
	}

	async getRolesForWorkspace(): Promise<IRoleDTO[]> {
		try {
			return await this.store.findByWorkspace(this.workspaceId);
		} catch (error) {
			throw new Error(
				`Failed to fetch roles for workspace ${String(this.workspaceId)}`,
				{ cause: error }
			);
		}
	}

	async listAssignments(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO[]> {
		return this.store.listAssignments(workspaceId);
	}

	async getPredefinedRole(
		workspaceId: IWorkspaceDTO["id"],
		key: TPredefinedRoleKey
	): Promise<IRoleDTO | null> {
		await this.seedDefaultWorkspaceRoles(workspaceId);
		return this.store.findByName(workspaceId, key);
	}

	async hasPermission(
		roleId: TRoleId,
		permission: TPermission
	): Promise<IPermissionValidationResult> {
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

	async hasAnyPermission(
		roleId: TRoleId,
		permissions: readonly TPermission[]
	): Promise<boolean> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return false;
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.hasAnyPermission(role, permissions, allRoles);
	}

	async hasAllPermissions(
		roleId: TRoleId,
		permissions: readonly TPermission[]
	): Promise<boolean> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return false;
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.hasAllPermissions(role, permissions, allRoles);
	}

	async assignRoleToMember(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"],
		roleId: TRoleId,
		assignedBy: IMemberDTO["id"]
	): Promise<void> {
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

	async getMemberRole(memberId: IMemberDTO["id"]): Promise<IRoleDTO | null> {
		const assignment = await this.roleAssignmentStore.getAssignment(
			memberId,
			this.workspaceId
		);
		if (!assignment) {
			return null;
		}

		return this.store.findById(assignment.roleId);
	}

	async bulkAssignRole(
		request: IBulkRoleAssignmentRequest
	): Promise<IBulkRoleAssignmentResult> {
		if (
			!ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations
		) {
			return {
				successful: [],
				failed: request.memberIds.map((memberId) => ({
					memberId,
					message:
						"Bulk operations are not available on this subscription plan.",
					code: ROLE_ERROR_CODES.PLAN_LIMIT_EXCEEDED,
				})),
				totalCount: request.memberIds.length,
				successCount: 0,
				failureCount: request.memberIds.length,
			};
		}

		const successful: IMemberDTO["id"][] = [];
		const failed: {
			memberId: IMemberDTO["id"];
			message: string;
			code: string;
		}[] = [];

		for (const memberId of request.memberIds) {
			try {
				await this.assignRoleToMember(
					memberId,
					request.workspaceId,
					request.roleId,
					request.assignedBy
				);
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

	async bulkUpdateRoles(
		request: IBulkRoleUpdateRequest
	): Promise<IRoleValidationResult[]> {
		if (
			!ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations
		) {
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
				results.push({
					success: false,
					code: ROLE_ERROR_CODES.ROLE_NOT_FOUND,
					message: "Role not found.",
				});
				continue;
			}

			if (!role.isCustom) {
				results.push({
					success: false,
					code: ROLE_ERROR_CODES.CANNOT_MODIFY_PREDEFINED,
					message: "Predefined roles cannot be modified.",
				});
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
		if (
			!ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations
		) {
			throw new Error(
				"Bulk operations are not available on this subscription plan."
			);
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
					await this.assignRoleToMember(
						assignment.memberId,
						request.workspaceId,
						request.fallbackRoleId,
						request.approvedBy
					);
				} else {
					await this.store.removeMemberRole(
						assignment.memberId,
						request.workspaceId
					);
				}
			}

			await this.store.delete(roleId);
		}
	}

	async validateInheritance(
		roleId: TRoleId,
		parentRoleId: TRoleId
	): Promise<IInheritanceValidationResult> {
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
		return RoleValidator.validateInheritance(
			roleId,
			parentRoleId,
			workspaceRoles
		);
	}

	async computeAllPermissions(role: IRoleDTO): Promise<readonly TPermission[]> {
		const workspaceRoles = await this.store.findByWorkspace(role.workspaceId);
		return RoleValidator.computeAllPermissions(role, workspaceRoles);
	}
}
