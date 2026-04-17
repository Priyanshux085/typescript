import { IWorkspaceDTO } from "../../interface";
import { IRoleDTO, IRoleStore, IMemberRoleAssignmentDTO, TRoleId } from "./types";

const rolesById = new Map<string, IRoleDTO>();
const assignmentsByKey = new Map<string, IMemberRoleAssignmentDTO>();

function getAssignmentKey(workspaceId: IWorkspaceDTO["id"], memberId: string): string {
	return `${String(workspaceId)}:${memberId}`;
}

export class MemoryRoleStore implements IRoleStore {
	async save(role: IRoleDTO): Promise<void> {
		rolesById.set(String(role.id), role);
	}

	async findById(id: TRoleId): Promise<IRoleDTO | null> {
		return rolesById.get(String(id)) ?? null;
	}

	async findByKey(workspaceId: IWorkspaceDTO["id"], key: string): Promise<IRoleDTO | null> {
		for (const role of rolesById.values()) {
			if (role.workspaceId === workspaceId && role.key === key) {
				return role;
			}
		}

		return null;
	}

	async findByName(workspaceId: IWorkspaceDTO["id"], name: string): Promise<IRoleDTO | null> {
		for (const role of rolesById.values()) {
			if (role.workspaceId === workspaceId && role.name === name) {
				return role;
			}
		}

		return null;
	}

	async findByWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]> {
		return [...rolesById.values()].filter((role) => role.workspaceId === workspaceId);
	}

	async update(id: TRoleId, role: Partial<IRoleDTO>): Promise<void> {
		const existingRole = rolesById.get(String(id));
		if (!existingRole) {
			return;
		}

		rolesById.set(String(id), { ...existingRole, ...role });
	}

	async delete(id: TRoleId): Promise<void> {
		rolesById.delete(String(id));
		for (const [key, assignment] of assignmentsByKey.entries()) {
			if (assignment.roleId === id) {
				assignmentsByKey.delete(key);
			}
		}
	}

	async assignRole(assignment: IMemberRoleAssignmentDTO): Promise<void> {
		assignmentsByKey.set(getAssignmentKey(assignment.workspaceId, assignment.memberId), assignment);
	}

	async getMemberRoleAssignment(memberId: string, workspaceId: IWorkspaceDTO["id"]): Promise<IMemberRoleAssignmentDTO | null> {
		return assignmentsByKey.get(getAssignmentKey(workspaceId, memberId)) ?? null;
	}

	async removeMemberRole(memberId: string, workspaceId: IWorkspaceDTO["id"]): Promise<void> {
		assignmentsByKey.delete(getAssignmentKey(workspaceId, memberId));
	}

	async listAssignments(workspaceId: IWorkspaceDTO["id"]): Promise<IMemberRoleAssignmentDTO[]> {
		return [...assignmentsByKey.values()].filter((assignment) => assignment.workspaceId === workspaceId);
	}
}
