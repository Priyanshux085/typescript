import { TSubscriptionPlan } from "@collaro/subscription";
import { BRAND } from "@collaro/utils/brand";
import { IWorkspaceDTO } from "../../interface";
import { IMemberDTO } from "../interface";

export type TRoleId = BRAND<"RoleId">;

export type TPermissionAction =
	| "create"
	| "read"
	| "update"
	| "delete"
	| "invite"
	| "remove"
	| "assign_role"
	| "edit_settings"
	| "manage_roles"
	| "manage_billing"
	| "view_analytics"
	| "export_data";

export type TPermissionResource =
	| "member"
	| "workspace"
	| "meeting"
	| "billing"
	| "workspace_analytics"
	| "member_data"
	| "meeting_data";

export type TPermission = `${TPermissionAction}:${TPermissionResource}`;

export type TPredefinedRoleKey = "owner" | "admin" | "member" | "guest";

export interface IRolePermissionGroupMap {
	readonly member_management: readonly TPermission[];
	readonly workspace_admin: readonly TPermission[];
	readonly meeting_management: readonly TPermission[];
	readonly analytics: readonly TPermission[];
	readonly billing: readonly TPermission[];
	readonly data_access: readonly TPermission[];
}

export const ROLE_PERMISSION_GROUPS: Readonly<IRolePermissionGroupMap> = {
	member_management: [
		"read:member",
		"update:member",
		"delete:member",
		"invite:member",
		"remove:member",
		"assign_role:member",
	] as const,
	workspace_admin: [
		"read:workspace",
		"update:workspace",
		"edit_settings:workspace",
		"manage_roles:workspace",
	] as const,
	meeting_management: [
		"create:meeting",
		"read:meeting",
		"update:meeting",
		"delete:meeting",
	] as const,
	analytics: ["view_analytics:workspace_analytics", "export_data:member_data", "export_data:meeting_data"] as const,
	billing: ["manage_billing:workspace"] as const,
	data_access: ["export_data:member_data", "export_data:meeting_data"] as const,
};

export const PREDEFINED_ROLE_PERMISSIONS: Readonly<Record<TPredefinedRoleKey, readonly TPermission[]>> = {
	owner: [
		...ROLE_PERMISSION_GROUPS.member_management,
		...ROLE_PERMISSION_GROUPS.workspace_admin,
		...ROLE_PERMISSION_GROUPS.meeting_management,
		...ROLE_PERMISSION_GROUPS.analytics,
		...ROLE_PERMISSION_GROUPS.billing,
		"delete:workspace",
	] as const,
	admin: [
		"read:member",
		"update:member",
		"invite:member",
		"remove:member",
		"assign_role:member",
		...ROLE_PERMISSION_GROUPS.workspace_admin,
		...ROLE_PERMISSION_GROUPS.meeting_management,
		...ROLE_PERMISSION_GROUPS.analytics,
	] as const,
	member: [
		"read:member",
		"read:workspace",
		"create:meeting",
		"read:meeting",
		"update:meeting",
	] as const,
	guest: ["read:member", "read:workspace", "read:meeting"] as const,
};

export interface IRoleDTO {
	readonly id: TRoleId;
	readonly workspaceId: IWorkspaceDTO["id"];
	readonly key: TPredefinedRoleKey | string;
	readonly name: string;
	readonly description?: string;
	readonly permissions: readonly TPermission[];
	readonly parentRoleId: TRoleId | null;
	readonly isCustom: boolean;
	readonly createdAt: Date;
	readonly updatedAt: Date | null;
}

export interface IMemberRoleAssignmentDTO {
	readonly memberId: IMemberDTO["id"];
	readonly workspaceId: IWorkspaceDTO["id"];
	readonly roleId: TRoleId;
	readonly assignedBy: IMemberDTO["name"];
	readonly assignedAt: Date;
}

export interface IRoleValidationError {
	readonly field: string;
	readonly message: string;
}

export interface IRoleValidationResult {
	readonly success: boolean;
	readonly role?: IRoleDTO;
	readonly message?: string;
	readonly code?: string;
	readonly errors?: readonly IRoleValidationError[];
}

export interface IPermissionValidationResult {
	readonly hasPermission: boolean;
	readonly permission: TPermission;
	readonly reason?: string;
}

export interface IInheritanceValidationResult {
	readonly success: boolean;
	readonly hasCircularDependency: boolean;
	readonly chain: readonly TRoleId[];
	readonly message?: string;
	readonly code?: string;
}

export interface IBulkRoleAssignmentRequest {
	readonly workspaceId: IWorkspaceDTO["id"];
	readonly memberIds: readonly IMemberDTO["id"][];
	readonly roleId: TRoleId;
	readonly assignedBy: string;
}

export interface IBulkRoleAssignmentResult {
	readonly successful: readonly IMemberDTO["id"][];
	readonly failed: readonly {
		memberId: IMemberDTO["id"];
		message: string;
		code: string;
	}[];
	readonly totalCount: number;
	readonly successCount: number;
	readonly failureCount: number;
}

export interface IBulkRoleUpdateRequest {
	readonly workspaceId: IWorkspaceDTO["id"];
	readonly roleIds: readonly TRoleId[];
	readonly updates: Partial<Pick<IRoleDTO, "name" | "description" | "permissions" | "parentRoleId">>;
}

export interface IBulkRoleDeleteRequest {
	readonly workspaceId: IWorkspaceDTO["id"];
	readonly roleIds: readonly TRoleId[];
	readonly fallbackRoleId?: TRoleId;
}

export interface IRoleFeatureLimits {
	readonly canCreateCustomRoles: boolean;
	readonly canUseInheritance: boolean;
	readonly canUseBulkOperations: boolean;
	readonly maxCustomRoles: number;
	readonly allowedPermissions: readonly TPermission[];
}

export const ROLE_LIMITS_BY_SUBSCRIPTION: Readonly<Record<TSubscriptionPlan, IRoleFeatureLimits>> = {
	free: {
		canCreateCustomRoles: false,
		canUseInheritance: false,
		canUseBulkOperations: false,
		maxCustomRoles: 0,
		allowedPermissions: [...PREDEFINED_ROLE_PERMISSIONS.guest] as const,
	},
	pro: {
		canCreateCustomRoles: false,
		canUseInheritance: false,
		canUseBulkOperations: false,
		maxCustomRoles: 0,
		allowedPermissions: [...PREDEFINED_ROLE_PERMISSIONS.admin] as const,
	},
	enterprise: {
		canCreateCustomRoles: true,
		canUseInheritance: true,
		canUseBulkOperations: true,
		maxCustomRoles: 100,
		allowedPermissions: [
			"create:member",
			"read:member",
			"update:member",
			"delete:member",
			"invite:member",
			"remove:member",
			"assign_role:member",
			"create:workspace",
			"read:workspace",
			"update:workspace",
			"delete:workspace",
			"edit_settings:workspace",
			"manage_roles:workspace",
			"manage_billing:workspace",
			"create:meeting",
			"read:meeting",
			"update:meeting",
			"delete:meeting",
			"view_analytics:workspace_analytics",
			"export_data:member_data",
			"export_data:meeting_data",
		] as const,
	},
};

export const ROLE_ERROR_CODES = {
	CUSTOM_ROLES_NOT_ALLOWED: "CUSTOM_ROLES_NOT_ALLOWED",
	ROLE_NOT_FOUND: "ROLE_NOT_FOUND",
	ROLE_ALREADY_EXISTS: "ROLE_ALREADY_EXISTS",
	CANNOT_MODIFY_PREDEFINED: "CANNOT_MODIFY_PREDEFINED",
	INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",
	INVALID_PERMISSION: "INVALID_PERMISSION",
	OWNER_REQUIRED: "OWNER_REQUIRED",
	CIRCULAR_DEPENDENCY: "CIRCULAR_DEPENDENCY",
	INVALID_INHERITANCE: "INVALID_INHERITANCE",
	PLAN_LIMIT_EXCEEDED: "PLAN_LIMIT_EXCEEDED",
	BULK_OPERATION_PARTIAL_FAILURE: "BULK_OPERATION_PARTIAL_FAILURE",
} as const;

export interface IRoleStore {
	save(role: IRoleDTO): Promise<void>;
	findById(id: TRoleId): Promise<IRoleDTO | null>;
	findByKey(
		workspaceId: IWorkspaceDTO["id"],
		key: string
	): Promise<IRoleDTO | null>;
	findByName(
		workspaceId: IWorkspaceDTO["id"],
		name: string
	): Promise<IRoleDTO | null>;
	findByWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]>;
	update(id: TRoleId, role: Partial<IRoleDTO>): Promise<void>;
	delete(id: TRoleId): Promise<void>;
	assignRole(assignment: IMemberRoleAssignmentDTO): Promise<void>;
	getMemberRoleAssignment(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO | null>;
	removeMemberRole(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<void>;
	listAssignments(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO[]>;
}

export interface IRoleManager {
	/**
	 * The ID of the workspace that the role manager is operating within.
	 * This is used to scope all role management operations to a specific workspace, ensuring that roles are created, updated, and assigned within the context of the correct workspace.
	 */
	workspaceId: IWorkspaceDTO["id"];

	/**
	 * Seeds the workspace with predefined roles based on the subscription plan.
	 * @param workspaceId The ID of the workspace to seed roles for.
	 * @returns A promise that resolves to an array of the seeded role DTOs.
	 */
	seedDefaultWorkspaceRoles(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IRoleDTO[]>;

	/**
	 * Creates a custom role for the specified workspace.
	 * @param workspaceId The ID of the workspace to create the role in.
	 * @param name The name of the custom role.
	 * @param permissions An array of permissions to assign to the role.
	 * @param options Optional parameters including description and parent role for inheritance.
	 * @returns A promise that resolves to the result of the role creation, including success status and role details or validation errors.
	 * @throws An error if the operation fails due to permission issues, validation errors, or subscription limits.
	 * @remarks Custom roles allow for tailored permission sets beyond predefined roles, enabling granular access control within the workspace.
	 */
	createCustomRole(
		name: string,
		permissions: readonly TPermission[],
		options?: { description?: string; parentRoleId?: TRoleId },
		workspaceId?: IWorkspaceDTO["id"]
	): Promise<IRoleValidationResult>;

	/**
	 * Updates an existing custom role with new details or permissions.
	 * @param roleId The ID of the role to update.
	 * @param updates An object containing the fields to update, such as name, description, permissions, or parent role for inheritance.
	 * @returns A promise that resolves to the result of the role update, including success status and updated role details or validation errors.
	 * @throws An error if the operation fails due to permission issues, validation errors, or if the role is not found or is a predefined role that cannot be modified.
	 * @remarks This method allows for modifying custom roles to adapt to changing workspace needs, but does not allow changes to predefined roles which are fixed based on subscription plans.
	 */
	updateCustomRole(
		roleId: TRoleId,
		updates: Partial<
			Pick<IRoleDTO, "name" | "description" | "permissions" | "parentRoleId">
		>
	): Promise<IRoleValidationResult>;

	/**
	 * Deletes a custom role from the workspace.
	 * @param roleId The ID of the role to delete.
	 * @returns A promise that resolves when the role has been deleted.
	 */
	deleteRole(roleId: TRoleId): Promise<void>;

	/**
	 * Gets a role by its ID.
	 * @param roleId The ID of the role to retrieve.
	 * @returns A promise that resolves to the role DTO if found, or null if not found.
	 */
	getRole(roleId: TRoleId): Promise<IRoleDTO | null>;

	/**
	 * Gets a role by its unique key within the workspace.
	 * @param workspaceId
	 * @param key
	 */
	getRoleByKey(
		workspaceId: IWorkspaceDTO["id"],
		key: string
	): Promise<IRoleDTO | null>;

	/**
	 * Gets all roles defined for a specific workspace, including both predefined and custom roles.
	 * @param workspaceId
	 * @returns A promise that resolves to an array of role DTOs associated with the workspace.
	 */
	getRolesForWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]>;

	/**
	 * Gets a predefined role by its key within the workspace.
	 * @param workspaceId
	 * @param key The predefined role key (e.g., "owner", "admin", "member", "guest").
	 */
	getPredefinedRole(
		workspaceId: IWorkspaceDTO["id"],
		key: TPredefinedRoleKey
	): Promise<IRoleDTO | null>;

	/**
	 * Checks if a role has a specific permission, taking into account inherited permissions from parent roles.
	 * @param roleId The ID of the role to check permissions for.
	 * @param permission The permission to check (e.g., "read:member", "update:workspace").
	 */
	hasPermission(
		roleId: TRoleId,
		permission: TPermission
	): Promise<IPermissionValidationResult>;

	/**
	 * Checks if a role has any of the specified permissions, taking into account inherited permissions from parent roles.
	 * @param roleId The ID of the role to check permissions for.
	 * @param permissions The permissions to check (e.g., ["read:member", "update:workspace"]).
	 */
	hasAnyPermission(
		roleId: TRoleId,
		permissions: readonly TPermission[]
	): Promise<boolean>;

	/**
	 * Checks if a role has all of the specified permissions, taking into account inherited permissions from parent roles.
	 * @param roleId The ID of the role to check permissions for.
	 * @param permissions The permissions to check (e.g., ["read:member", "update:workspace"]).
	 */
	hasAllPermissions(
		roleId: TRoleId,
		permissions: readonly TPermission[]
	): Promise<boolean>;

	/**
	 * Assigns a role to a member within a workspace.
	 * @param memberId The ID of the member to assign the role to.
	 * @param workspaceId The ID of the workspace where the role is assigned.
	 * @param roleId The ID of the role to assign.
	 * @param assignedBy The ID of the user who is assigning the role.
	 */
	assignRoleToMember(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"],
		roleId: TRoleId,
		assignedBy: string
	): Promise<void>;

	/**
	 * Gets the role assigned to a member within a workspace.
	 * @param memberId The ID of the member to retrieve the role for.
	 * @param workspaceId The ID of the workspace where the role is assigned.
	 */
	getMemberRole(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IRoleDTO | null>;

	/**
	 * Assigns roles to multiple members within a workspace.
	 * @param request The bulk role assignment request.
	 */
	bulkAssignRole(
		request: IBulkRoleAssignmentRequest
	): Promise<IBulkRoleAssignmentResult>;

	/**
	 * Assignment of multiple roles to multiple members within a workspace.
	 * @param request The bulk role update request.
	 */
	bulkUpdateRoles(
		request: IBulkRoleUpdateRequest
	): Promise<IRoleValidationResult[]>;

	/**
	 * Deletes multiple roles within a workspace.
	 * @param request The bulk role delete request.
	 * @returns A promise that resolves when the roles have been deleted, or rejects with an error if the operation fails due to permission issues, validation errors, or if any of the roles are not found or are predefined roles that cannot be deleted.
	 */
	bulkDeleteRoles(request: IBulkRoleDeleteRequest): Promise<void>;

	/**
	 * Validates the inheritance relationship between a role and its parent role.
	 * @param roleId The ID of the role to validate.
	 * @param parentRoleId The ID of the parent role.
	 * @returns A promise that resolves to the result of the inheritance validation, including success status, whether there is a circular dependency, the chain of roles in the inheritance hierarchy, and any relevant messages or error codes.
	 */
	validateInheritance(
		roleId: TRoleId,
		parentRoleId: TRoleId
	): Promise<IInheritanceValidationResult>;

	/**
	 * Computes the full set of permissions for a role, including inherited permissions from parent roles.
	 * @param role The role DTO to compute permissions for.
	 * @returns A promise that resolves to an array of permissions that the role has, taking into account all levels of inheritance.
	 */
	computeAllPermissions(role: IRoleDTO): Promise<readonly TPermission[]>;
}
