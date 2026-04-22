import { IWorkspaceDTO } from "../interface";
import { IMemberDTO } from "./member";
import {
	IRoleDTO,
	IRoleStore,
	IMemberRoleAssignmentDTO,
	TRoleId,
	IRoleAssignmentStore,
} from "./interface";

function getAssignmentKey(
	workspaceId: IWorkspaceDTO["id"],
	memberId: IMemberDTO["id"]
): string {
	return `${String(workspaceId)}:${String(memberId)}`;
}

/**
 * Efficient in-memory role store with indexed lookups.
 *
 * ## Performance Characteristics:
 * - Role lookups by ID: O(1) via rolesById map
 * - Role lookups by name per workspace: O(1) via nameIndex
 * - Workspace role lookups: O(1) set access, O(k) iteration (k=num roles)
 * - All other operations: O(1) amortized
 *
 * ## Indexes Maintained:
 * 1. **rolesById**: Primary index for ID-based lookups
 * 2. **rolesByNamePerWorkspace**: Secondary index for name-based lookups per workspace (case-insensitive)
 * 3. **roleIdsByWorkspace**: Tertiary index for fast workspace queries
 *
 * ## Immutability Guarantees:
 * - All returned collections are defensive copies (new arrays/values)
 * - Mutations to returned data do not affect internal state
 *
 * ## Singleton Pattern:
 * Single instance shared across all RoleManager instances ensures consistent
 * role state across the application.
 */
export class MemoryRoleStore implements IRoleStore {
	private static instance: MemoryRoleStore;

	// Primary index: roleId -> role
	private rolesById = new Map<string, IRoleDTO>();

	// Secondary index: workspaceId:roleName -> role (case-insensitive)
	private rolesByNamePerWorkspace = new Map<string, IRoleDTO>();

	// Tertiary index: workspaceId -> [roleIds]
	private roleIdsByWorkspace = new Map<string, Set<string>>();

	// Assignment index: workspaceId:memberId -> assignment
	private assignmentsByKey = new Map<string, IMemberRoleAssignmentDTO>();

	private constructor() {}

	static getInstance(): MemoryRoleStore {
		if (!MemoryRoleStore.instance) {
			MemoryRoleStore.instance = new MemoryRoleStore();
		}
		return MemoryRoleStore.instance;
	}

	private getNameKey(workspaceId: IWorkspaceDTO["id"], name: string): string {
		return `${String(workspaceId)}:${name.toLowerCase()}`;
	}

	private getWorkspaceKey(workspaceId: IWorkspaceDTO["id"]): string {
		return String(workspaceId);
	}

	async save(role: IRoleDTO): Promise<void> {
		const roleId = String(role.id);
		const workspaceKey = this.getWorkspaceKey(role.workspaceId);
		const nameKey = this.getNameKey(role.workspaceId, role.name);

		// Add to primary index
		this.rolesById.set(roleId, role);

		// Add to secondary index
		this.rolesByNamePerWorkspace.set(nameKey, role);

		// Add to tertiary index
		if (!this.roleIdsByWorkspace.has(workspaceKey)) {
			this.roleIdsByWorkspace.set(workspaceKey, new Set());
		}
		this.roleIdsByWorkspace.get(workspaceKey)!.add(roleId);
	}

	async findById(id: TRoleId): Promise<IRoleDTO | null> {
		return this.rolesById.get(String(id)) ?? null;
	}

	async findByName(
		workspaceId: IWorkspaceDTO["id"],
		name: IRoleDTO["name"]
	): Promise<IRoleDTO | null> {
		const nameKey = this.getNameKey(workspaceId, name);
		return this.rolesByNamePerWorkspace.get(nameKey) ?? null;
	}

	async findByWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]> {
		const workspaceKey = this.getWorkspaceKey(workspaceId);
		const roleIds = this.roleIdsByWorkspace.get(workspaceKey) ?? new Set();
		return Array.from(roleIds)
			.map((roleId) => this.rolesById.get(roleId))
			.filter((role): role is IRoleDTO => role !== undefined);
	}

	async update(id: TRoleId, updates: Partial<IRoleDTO>): Promise<void> {
		const roleId = String(id);
		const existingRole = this.rolesById.get(roleId);

		if (!existingRole) {
			throw new Error(`Role with ID ${roleId} not found.`);
		}

		// If name is being updated, update secondary index
		if (updates.name && updates.name !== existingRole.name) {
			const oldNameKey = this.getNameKey(
				existingRole.workspaceId,
				existingRole.name
			);
			this.rolesByNamePerWorkspace.delete(oldNameKey);

			const newNameKey = this.getNameKey(existingRole.workspaceId, updates.name);
			const updatedRole = {
				...existingRole,
				...updates,
				id: existingRole.id,
				workspaceId: existingRole.workspaceId,
			} as IRoleDTO;
			this.rolesByNamePerWorkspace.set(newNameKey, updatedRole);
			this.rolesById.set(roleId, updatedRole);
		} else {
			const updatedRole = {
				...existingRole,
				...updates,
				id: existingRole.id,
				workspaceId: existingRole.workspaceId,
			} as IRoleDTO;
			this.rolesById.set(roleId, updatedRole);

			if (updates.name === undefined) {
				const nameKey = this.getNameKey(existingRole.workspaceId, existingRole.name);
				this.rolesByNamePerWorkspace.set(nameKey, updatedRole);
			}
		}
	}

	async delete(id: TRoleId): Promise<void> {
		const roleId = String(id);
		const role = this.rolesById.get(roleId);

		if (!role) {
			throw new Error(`Role with ID ${roleId} not found.`);
		}

		// Remove from primary index
		this.rolesById.delete(roleId);

		// Remove from secondary index
		const nameKey = this.getNameKey(role.workspaceId, role.name);
		this.rolesByNamePerWorkspace.delete(nameKey);

		// Remove from tertiary index
		const workspaceKey = this.getWorkspaceKey(role.workspaceId);
		this.roleIdsByWorkspace.get(workspaceKey)?.delete(roleId);
	}

	async assignRole(assignment: IMemberRoleAssignmentDTO): Promise<void> {
		const role = await this.findById(assignment.roleId);

		if (!role) {
			throw new Error(
				`Role with ID ${String(assignment.roleId)} not found.`
			);
		}

		if (role.workspaceId !== assignment.workspaceId) {
			throw new Error("Role does not belong to the target workspace.");
		}

		const key = getAssignmentKey(assignment.workspaceId, assignment.memberId);
		this.assignmentsByKey.set(key, assignment);
	}

	async getMemberRoleAssignment(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO | null> {
		const key = getAssignmentKey(workspaceId, memberId);
		return this.assignmentsByKey.get(key) ?? null;
	}

	async removeMemberRole(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<void> {
		const key = getAssignmentKey(workspaceId, memberId);
		this.assignmentsByKey.delete(key);
	}

	async listAssignments(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO[]> {
		return Array.from(this.assignmentsByKey.values()).filter(
			(assignment) => assignment.workspaceId === workspaceId
		);
	}
}

/**
 * Dedicated in-memory store for role-member assignments.
 *
 * ## Performance Characteristics:
 * - Assignment lookups by member & workspace: O(1) via assignmentsByKey map
 * - Workspace assignment listings: O(1) set access, O(k) iteration (k=num assignments)
 * - All mutations: O(1) amortized
 *
 * ## Indexes Maintained:
 * 1. **assignmentsByKey**: Primary index for member-workspace lookups
 * 2. **assignmentIdsByWorkspace**: Secondary index for efficient workspace queries
 *
 * ## Singleton Pattern:
 * Single instance shared across all RoleManager instances ensures consistent
 * assignment state. Multiple role managers can safely coordinate via this store.
 */
export class RoleAssignmentStore implements IRoleAssignmentStore {
	private static instance: RoleAssignmentStore;

	// Primary index: workspaceId:memberId -> assignment
	private assignmentsByKey = new Map<string, IMemberRoleAssignmentDTO>();

	// Secondary index: workspaceId -> Set of assignmentKeys
	private assignmentIdsByWorkspace = new Map<string, Set<string>>();

	private constructor() {}

	static getInstance(): RoleAssignmentStore {
		if (!RoleAssignmentStore.instance) {
			RoleAssignmentStore.instance = new RoleAssignmentStore();
		}
		return RoleAssignmentStore.instance;
	}

	private getAssignmentKey(
		workspaceId: IWorkspaceDTO["id"],
		memberId: IMemberDTO["id"]
	): string {
		return `${String(workspaceId)}:${String(memberId)}`;
	}

	private getWorkspaceKey(workspaceId: IWorkspaceDTO["id"]): string {
		return String(workspaceId);
	}

	async saveAssignment(assignment: IMemberRoleAssignmentDTO): Promise<void> {
		const key = this.getAssignmentKey(assignment.workspaceId, assignment.memberId);
		const workspaceKey = this.getWorkspaceKey(assignment.workspaceId);

		// Add to primary index
		this.assignmentsByKey.set(key, assignment);

		// Add to secondary index
		if (!this.assignmentIdsByWorkspace.has(workspaceKey)) {
			this.assignmentIdsByWorkspace.set(workspaceKey, new Set());
		}
		this.assignmentIdsByWorkspace.get(workspaceKey)!.add(key);
	}

	async listAssignments(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO[]> {
		const workspaceKey = this.getWorkspaceKey(workspaceId);
		const assignmentKeys = this.assignmentIdsByWorkspace.get(workspaceKey) ?? new Set();
		return Array.from(assignmentKeys)
			.map((key) => this.assignmentsByKey.get(key))
			.filter((assignment): assignment is IMemberRoleAssignmentDTO => assignment !== undefined);
	}

	async getAssignment(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO | null> {
		const key = this.getAssignmentKey(workspaceId, memberId);
		return this.assignmentsByKey.get(key) ?? null;
	}

	async removeAssignment(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<void> {
		const key = this.getAssignmentKey(workspaceId, memberId);
		const workspaceKey = this.getWorkspaceKey(workspaceId);

		this.assignmentsByKey.delete(key);
		this.assignmentIdsByWorkspace.get(workspaceKey)?.delete(key);
	}
}