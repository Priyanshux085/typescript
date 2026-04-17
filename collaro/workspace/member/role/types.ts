import { TSubscriptionPlan } from "@collaro/subscription";
import { BRAND } from "@collaro/utils/brand";
import { IWorkspaceDTO } from "../../interface";

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
	readonly memberId: string;
	readonly workspaceId: IWorkspaceDTO["id"];
	readonly roleId: TRoleId;
	readonly assignedBy: string;
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
	readonly memberIds: readonly string[];
	readonly roleId: TRoleId;
	readonly assignedBy: string;
}

export interface IBulkRoleAssignmentResult {
	readonly successful: readonly string[];
	readonly failed: readonly { memberId: string; message: string; code: string }[];
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
	findByKey(workspaceId: IWorkspaceDTO["id"], key: string): Promise<IRoleDTO | null>;
	findByName(workspaceId: IWorkspaceDTO["id"], name: string): Promise<IRoleDTO | null>;
	findByWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]>;
	update(id: TRoleId, role: Partial<IRoleDTO>): Promise<void>;
	delete(id: TRoleId): Promise<void>;
	assignRole(assignment: IMemberRoleAssignmentDTO): Promise<void>;
	getMemberRoleAssignment(memberId: string, workspaceId: IWorkspaceDTO["id"]): Promise<IMemberRoleAssignmentDTO | null>;
	removeMemberRole(memberId: string, workspaceId: IWorkspaceDTO["id"]): Promise<void>;
	listAssignments(workspaceId: IWorkspaceDTO["id"]): Promise<IMemberRoleAssignmentDTO[]>;
}

export interface IRoleManager {
	seedWorkspaceRoles(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]>;
	createCustomRole(
		workspaceId: IWorkspaceDTO["id"],
		name: string,
		permissions: readonly TPermission[],
		options?: { description?: string; parentRoleId?: TRoleId }
	): Promise<IRoleValidationResult>;
	updateCustomRole(
		roleId: TRoleId,
		updates: Partial<Pick<IRoleDTO, "name" | "description" | "permissions" | "parentRoleId">>
	): Promise<IRoleValidationResult>;
	deleteRole(roleId: TRoleId): Promise<void>;
	getRole(roleId: TRoleId): Promise<IRoleDTO | null>;
	getRoleByKey(workspaceId: IWorkspaceDTO["id"], key: string): Promise<IRoleDTO | null>;
	getRolesForWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]>;
	getPredefinedRole(workspaceId: IWorkspaceDTO["id"], key: TPredefinedRoleKey): Promise<IRoleDTO | null>;
	hasPermission(roleId: TRoleId, permission: TPermission): Promise<IPermissionValidationResult>;
	hasAnyPermission(roleId: TRoleId, permissions: readonly TPermission[]): Promise<boolean>;
	hasAllPermissions(roleId: TRoleId, permissions: readonly TPermission[]): Promise<boolean>;
	assignRoleToMember(memberId: string, workspaceId: IWorkspaceDTO["id"], roleId: TRoleId, assignedBy: string): Promise<void>;
	getMemberRole(memberId: string, workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO | null>;
	bulkAssignRole(request: IBulkRoleAssignmentRequest): Promise<IBulkRoleAssignmentResult>;
	bulkUpdateRoles(request: IBulkRoleUpdateRequest): Promise<IRoleValidationResult[]>;
	bulkDeleteRoles(request: IBulkRoleDeleteRequest): Promise<void>;
	validateInheritance(roleId: TRoleId, parentRoleId: TRoleId): Promise<IInheritanceValidationResult>;
	computeAllPermissions(role: IRoleDTO): Promise<readonly TPermission[]>;
}
