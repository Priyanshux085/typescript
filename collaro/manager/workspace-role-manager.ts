import { ID } from "@collaro/utils";
import * as WorkspaceRole from "@collaro/workspace/role";
import { IWorkspaceDTO, IWorkspaceStore, MemoryWorkspaceStore } from "@collaro/workspace";
import { TSubscriptionPlan } from "@collaro/subscription";
import { IMemberDTO } from "@collaro/workspace/member"; 

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
] as const satisfies readonly WorkspaceRole.TPredefinedRoleKey[];

// Track seeding in progress to prevent duplicate seeding for the same workspace
const seedingInProgress = new Set<string>();

export class WorkspaceRoleManager implements WorkspaceRole.IWorkspaceRoleManager {
	private readonly workspaceStore: IWorkspaceStore =
		MemoryWorkspaceStore.getInstance();
	private readonly store: WorkspaceRole.IRoleStore = WorkspaceRole.MemoryRoleStore.getInstance();
	public slug: IWorkspaceDTO["slug"] = "";

	public workspaceRoleMap: WorkspaceRole.TWorkspaceRoleMap = new Map<
		string,
		WorkspaceRole.IRoleDTO["name"]
	>();

	private async fetchSlug(workspaceId: IWorkspaceDTO["id"]): Promise<string> {
		await this.workspaceStore
			.findById(workspaceId)
			.then((workspace) => {
				if (!workspace) {
					throw new Error(
						`Workspace with ID ${String(workspaceId)} not found.`
					);
				}

				// Store the slug for role ID generation
				this.slug = workspace.slug;
			})
			.catch((error) => {
				console.error("Error initializing RoleManager:", error);
				throw error;
			});

		return this.slug;
	}

	constructor(
		readonly workspaceId: IWorkspaceDTO["id"],
		private readonly subscriptionPlan: TSubscriptionPlan
	) {
		this.fetchSlug(workspaceId).catch((error) => {
			console.error("Failed to initialize RoleManager:", error);
		});
		this.seedDefaultWorkspaceRoles(workspaceId).catch((error) => {
			console.error("Failed to seed default roles:", error);
		});
	}

	async seedDefaultWorkspaceRoles(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<WorkspaceRole.IRoleDTO[]> {
		// Prevent concurrent seeding for the same workspace
		const workspaceKey = String(workspaceId);
		if (seedingInProgress.has(workspaceKey)) {
			return [];
		}

		try {
			// Seed predefined roles - check if they already exist to avoid duplicates
			for (const roleKey of DEFAULT_WORKSPACE_ROLES) {
				const existingRole = await this.store.findByName(workspaceId, roleKey);
				if (existingRole) {
					console.warn(`Role with name '${roleKey}' already exists in workspace '${workspaceId}'. Skipping creation.`);
					continue;
				}

				const roleId = ID.roleId(this.slug);
				this.workspaceRoleMap.set(String(roleId), roleKey);

				const seededRole: WorkspaceRole.IRoleDTO = {
					id: roleId,
					workspaceId,
					name: roleKey,
					description: `${roleKey} role for the workspace`,
					permissions: WorkspaceRole.PREDEFINED_ROLE_PERMISSIONS[roleKey],
					parentRoleId: null,
					isCustom: false,
					createdAt: new Date(),
					updatedAt: null,
				};

				await this.store.save(seededRole);
			}
		} finally {
			seedingInProgress.delete(workspaceKey);
		}

		return this.getRolesForWorkspace();
	}

	async createCustomRole(
		approvedBy: IMemberDTO["id"],
		name: string,
		permissions: readonly WorkspaceRole.TPermission[],
		options?: { description?: string; parentRoleId?: WorkspaceRole.TRoleId },
		// workspaceId?: IWorkspaceDTO["id"]
	): Promise<WorkspaceRole.IRoleValidationResult> {
		// 1. Check subscription limits and check the approver's permissions validation
		const workspaceRoles = await this.getRolesForWorkspace();

		const approverRole = await this.getMemberRole(approvedBy);
		console.log("Approver Role: ", approverRole);

		if (!approverRole || (!approverRole.permissions.some((perm) => perm === "assign_role:workspace" && approverRole.isCustom))) {
			return {
				success: false,
				code: WorkspaceRole.ROLE_ERROR_CODES.INVALID_PERMISSION,
				message: "Approver's role not found or lacks permission to assign roles.",
			};

			// !approverRole.permissions.some((perm) => perm === "assign_role:workspace") 
		}

		// 2. Validate role name and generate key
		const currentCustomRoleCount = workspaceRoles.filter(
			(role) => role.isCustom
		).length;
		const planValidation = WorkspaceRole.RoleValidator.canCreateCustomRole(
			this.subscriptionPlan,
			currentCustomRoleCount
		);

		if (!planValidation.success) {
			return planValidation;
		}

		// 3. Generate a role key by slugifying the name
		const roleKey = slugifyRoleKey(name);
		if (!roleKey) {
			return {
				success: false,
				code: WorkspaceRole.ROLE_ERROR_CODES.INVALID_PERMISSION,
				message: "Role name cannot be empty.",
			};
		}

		// 4. Check for duplicate role key within the workspace
		const existingRole = await this.store.findByName(
			this.workspaceId,
			roleKey
		);
		if (existingRole) {
			return {
				success: false,
				code: WorkspaceRole.ROLE_ERROR_CODES.ROLE_ALREADY_EXISTS,
				message: `Role '${name}' already exists in this workspace.`,
			};
		}

		// 5. Validate permissions against subscription plan limits
		const filteredPermissions = WorkspaceRole.RoleValidator.filterPermissionsForPlan(
			this.subscriptionPlan,
			permissions
		);
		if (filteredPermissions.length !== permissions.length) {
			return {
				success: false,
				code: WorkspaceRole.ROLE_ERROR_CODES.INVALID_PERMISSION,
				message:
					"One or more permissions are not allowed on this subscription plan.",
			};
		}

		// 6. Validate inheritance if parentRoleId is provided
		const roleId = ID.roleId(this.slug);
		const parentRoleId = options?.parentRoleId ?? null;
		if (parentRoleId) {
			const inheritanceValidation = WorkspaceRole.RoleValidator.validateInheritance(
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

		// 7. Create and save the new role
		const role: WorkspaceRole.IRoleDTO = {
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

		// 8. Cache the role in the manager's map for quick access
		this.workspaceRoleMap.set(String(role.id), role.name);
		return { success: true, role };
	}

	async updateCustomRole(
		roleId: WorkspaceRole.TRoleId,
		updates: Partial<
			Pick<WorkspaceRole.IRoleDTO, "name" | "description" | "permissions" | "parentRoleId">
		>
	): Promise<WorkspaceRole.IRoleValidationResult> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return {
				success: false,
				code: WorkspaceRole.ROLE_ERROR_CODES.ROLE_NOT_FOUND,
				message: "Role not found.",
			};
		}

		if (!role.isCustom) {
			return {
				success: false,
				code: WorkspaceRole.ROLE_ERROR_CODES.CANNOT_MODIFY_PREDEFINED,
				message: "Predefined roles cannot be modified.",
			};
		}

		const nextPermissions = updates.permissions
			? WorkspaceRole.RoleValidator.filterPermissionsForPlan(
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
				code: WorkspaceRole.ROLE_ERROR_CODES.INVALID_PERMISSION,
				message:
					"One or more permissions are not allowed on this subscription plan.",
			};
		}

		if (updates.parentRoleId) {
			const workspaceRoles = await this.getRolesForWorkspace();
			const validation = WorkspaceRole.RoleValidator.validateInheritance(
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

		const updatedRole: WorkspaceRole.IRoleDTO = {
			...role,
			...updates,
			permissions: nextPermissions,
			updatedAt: new Date(),
		};

		await this.store.update(roleId, updatedRole);
		this.workspaceRoleMap.set(String(roleId), updatedRole.name);

		return { success: true, role: updatedRole };
	}

	async deleteRole(role: WorkspaceRole.IRoleDTO["name"]): Promise<void> {
		const roleDTO = await this.store.findByName(this.workspaceId, role);
		if (!roleDTO) {
			return;
		}
		if (!roleDTO.isCustom) {
			throw new Error("Predefined roles cannot be deleted.");
		}

		const assignments = await this.store.listAssignments(roleDTO.workspaceId);
		for (const assignment of assignments) {
			if (assignment.roleId === roleDTO.id) {
				await this.store.removeMemberRole(
					assignment.memberId,
					assignment.workspaceId
				);
			}
		}

		await this.store.delete(roleDTO.id);
		this.workspaceRoleMap.delete(String(roleDTO.id));
	}

	async getRole(role: WorkspaceRole.IRoleDTO["name"]): Promise<WorkspaceRole.IRoleDTO | null> {
		try {
			const roleDTO = await this.store.findByName(this.workspaceId, role);
			return roleDTO ?? null;
		} catch (error: unknown) {
			throw new Error("Error fetching role: ", {
				cause: error
			})
		}
	}

	async getRoleByID(roleId: WorkspaceRole.TRoleId): Promise<WorkspaceRole.IRoleDTO | null> {
		try {
			const roleDTO = await this.store.findById(roleId);
			return roleDTO ?? null;
		} catch (error: unknown) {
			throw new Error("Error fetching role by ID: ", {
				cause: error
			})
		}
	}

	async getRoleByKey(
		workspaceId: IWorkspaceDTO["id"],
		key: string
	): Promise<WorkspaceRole.IRoleDTO | null> {
		return this.store.findByName(workspaceId, key);
	}

	async getRolesForWorkspace(): Promise<WorkspaceRole.IRoleDTO[]> {
		return this.store.findByWorkspace(this.workspaceId);
	}

	async getPredefinedRole(
		workspaceId: IWorkspaceDTO["id"],
		key: WorkspaceRole.TPredefinedRoleKey
	): Promise<WorkspaceRole.IRoleDTO | null> {
		await this.seedDefaultWorkspaceRoles(workspaceId);
		return this.store.findByName(workspaceId, key);
	}

	async hasPermission(
		roleId: WorkspaceRole.TRoleId,
		permission: WorkspaceRole.TPermission
	): Promise<WorkspaceRole.IPermissionValidationResult> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return {
				hasPermission: false,
				permission,
				reason: "Role not found.",
			};
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return WorkspaceRole.RoleValidator.hasPermission(role, permission, allRoles);
	}

	async hasAnyPermission(
		roleId: WorkspaceRole.TRoleId,
		permissions: readonly WorkspaceRole.TPermission[]
	): Promise<boolean> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return false;
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return WorkspaceRole.RoleValidator.hasAnyPermission(role, permissions, allRoles);
	}

	async hasAllPermissions(
		roleId: WorkspaceRole.TRoleId,
		permissions: readonly WorkspaceRole.TPermission[]
	): Promise<boolean> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return false;
		}

		const allRoles = await this.store.findByWorkspace(role.workspaceId);
		return WorkspaceRole.RoleValidator.hasAllPermissions(role, permissions, allRoles);
	}

	/**
	 * Assigns a role to a member with type-safe key lookup and caching.
	 * Overloaded to accept either TRoleId (direct) or role key (with validation).
	 */
	async assignRole(
		memberId: IMemberDTO["id"],
		role: WorkspaceRole.IRoleDTO["name"],
		assignedBy: IMemberDTO["id"]
	): Promise<void> {
		const roleDTO = await this.store.findByName(this.workspaceId, role);
		if (!roleDTO || roleDTO.workspaceId !== this.workspaceId) {
			throw new Error("Role does not belong to the target workspace.");
		}

		// Create and persist the assignment
		const assignment: WorkspaceRole.IMemberRoleAssignmentDTO = {
			memberId,
			workspaceId: this.workspaceId,
			roleId: roleDTO.id,
			assignedBy,
			assignedAt: new Date(),
		};

		await this.store.assignRole(assignment);
	}

	async getMemberRole(
		memberId: IMemberDTO["id"],
	): Promise<WorkspaceRole.IRoleDTO | null> {
		const assignment = await this.store.getMemberRoleAssignment(
			memberId,
			this.workspaceId
		);
		if (!assignment) {
			return null;
		}

		return this.store.findById(assignment.roleId);
	}

	async bulkAssignRole(
		request: WorkspaceRole.IBulkRoleAssignmentRequest
	): Promise<WorkspaceRole.IBulkRoleAssignmentResult> {
		if (
			!WorkspaceRole.ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations
		) {
			return {
				successful: [],
				failed: request.memberIds.map((memberId) => ({
					memberId,
					message:
						"Bulk operations are not available on this subscription plan.",
					code: WorkspaceRole.ROLE_ERROR_CODES.PLAN_LIMIT_EXCEEDED,
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
				await this.assignRole(
					memberId,
					"member",
					request.assignedBy
				);
				successful.push(memberId);
			} catch (error) {
				failed.push({
					memberId,
					message: error instanceof Error ? error.message : "Unknown error.",
					code: WorkspaceRole.ROLE_ERROR_CODES.BULK_OPERATION_PARTIAL_FAILURE,
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
		request: WorkspaceRole.IBulkRoleUpdateRequest
	): Promise<WorkspaceRole.IRoleValidationResult[]> {
		if (
			!WorkspaceRole.ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations
		) {
			return request.roleIds.map(() => ({
				success: false,
				code: WorkspaceRole.ROLE_ERROR_CODES.PLAN_LIMIT_EXCEEDED,
				message: "Bulk operations are not available on this subscription plan.",
			}));
		}

		const results: WorkspaceRole.IRoleValidationResult[] = [];
		for (const roleId of request.roleIds) {
			const role = await this.store.findById(roleId);
			if (!role) {
				results.push({
					success: false,
					code: WorkspaceRole.ROLE_ERROR_CODES.ROLE_NOT_FOUND,
					message: "Role not found.",
				});
				continue;
			}

			if (!role.isCustom) {
				results.push({
					success: false,
					code: WorkspaceRole.ROLE_ERROR_CODES.CANNOT_MODIFY_PREDEFINED,
					message: "Predefined roles cannot be modified.",
				});
				continue;
			}

			const updatedRole: WorkspaceRole.IRoleDTO = {
				...role,
				...request.updates,
				updatedAt: new Date(),
			};

			await this.store.update(roleId, updatedRole);
			results.push({ success: true, role: updatedRole });
		}

		return results;
	}

	async bulkDeleteRoles(request: WorkspaceRole.IBulkRoleDeleteRequest): Promise<void> {
		if (
			!WorkspaceRole.ROLE_LIMITS_BY_SUBSCRIPTION[this.subscriptionPlan].canUseBulkOperations
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
					const fallbackRole = this.workspaceRoleMap.get(
						String(request.fallbackRoleId)
					);

					await this.assignRole(
						assignment.memberId,
						fallbackRole!,
						assignment.assignedBy
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
		roleId: WorkspaceRole.TRoleId,
		parentRoleId: WorkspaceRole.TRoleId
	): Promise<WorkspaceRole.IInheritanceValidationResult> {
		const role = await this.store.findById(roleId);
		if (!role) {
			return {
				success: false,
				hasCircularDependency: false,
				chain: [roleId],
				code: WorkspaceRole.ROLE_ERROR_CODES.ROLE_NOT_FOUND,
				message: "Role not found.",
			};
		}

		const workspaceRoles = await this.store.findByWorkspace(role.workspaceId);
		return WorkspaceRole.RoleValidator.validateInheritance(
			roleId,
			parentRoleId,
			workspaceRoles
		);
	}

	async computeAllPermissions(role: WorkspaceRole.IRoleDTO): Promise<readonly WorkspaceRole.TPermission[]> {
		const workspaceRoles = await this.store.findByWorkspace(role.workspaceId);
		return WorkspaceRole.RoleValidator.computeAllPermissions(role, workspaceRoles);
	}
}
