import { IWorkspaceDTO } from "../../interface";
import { IMemberDTO } from "../interface";
import { IRoleDTO, IRoleStore, IMemberRoleAssignmentDTO, TRoleId } from "./types";

const rolesById = new Map<string, IRoleDTO>();
const assignmentsByKey = new Map<string, IMemberRoleAssignmentDTO>();

function getAssignmentKey(
	workspaceId: IWorkspaceDTO["id"],
	memberId: IMemberDTO["id"]
): string {
	return `${String(workspaceId)}:${String(memberId)}`;
}

// Todo: Implement a more robust in-memory store with indexing for better performance in lookups by workspaceId, key, and name.
let dummyDB: IRoleDTO[] = [];

export class MemoryRoleStore implements IRoleStore {
	async save(role: IRoleDTO): Promise<void> {
		dummyDB.push(role);
		rolesById.set(String(role.id), role);
	}

	async findById(id: TRoleId): Promise<IRoleDTO | null> {
		return rolesById.get(String(id)) ?? null;
	}

	async findByKey(
		workspaceId: IWorkspaceDTO["id"],
		key: string
	): Promise<IRoleDTO | null> {
		const roles = dummyDB.filter(
			(role) => role.workspaceId === workspaceId && role.key === key
		);
		return roles[0] ?? null;
	}

	async findByName(
		workspaceId: IWorkspaceDTO["id"],
		name: string
	): Promise<IRoleDTO | null> {
		const roles = dummyDB.filter(
			(role) => role.workspaceId === workspaceId && role.name === name
		);
		return roles[0] ?? null;
	}

	async findByWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IRoleDTO[]> {
		return [...rolesById.values()].filter(
			(role) => role.workspaceId === workspaceId
		);
	}

	async update(id: TRoleId, role: Partial<IRoleDTO>): Promise<void> {
		dummyDB = dummyDB.map((existingRole) => {
			if (existingRole.id !== id) {
				return existingRole;
			}

			const updatedRole = {
				...existingRole,
				...role,
				id: existingRole.id, // Ensure ID is not overwritten
				workspaceId: existingRole.workspaceId, // Ensure workspaceId is not overwritten
			} as IRoleDTO;
			rolesById.set(String(id), updatedRole);
			return updatedRole;
		});
	}

	async delete(id: TRoleId): Promise<void> {
		rolesById.delete(String(id));
		dummyDB = dummyDB.filter((role) => role.id !== id);
	}

	async assignRole(assignment: IMemberRoleAssignmentDTO): Promise<void> {
		// assignmentsByKey.set(getAssignmentKey(assignment.workspaceId, assignment.memberId), assignment);

		const role = await this.findById(assignment.roleId);

		if (!role) {
			throw new Error(`Role with ID ${assignment.roleId} not found.`);
		}

		// TODO: Remove it later
		dummyDB.push({
			...role,
		});
	}

	async getMemberRoleAssignment(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO | null> {
		dummyDB =
			dummyDB
				.filter((role) => role.workspaceId === workspaceId)
				.forEach((role) => {
					assignmentsByKey.set(getAssignmentKey(workspaceId, memberId), {
						memberId: memberId as unknown as IMemberDTO["id"],
						workspaceId,
						roleId: role.id,
						assignedBy: "system",
						assignedAt: new Date(),
					});
				}) ?? [];

		return (
			assignmentsByKey.get(getAssignmentKey(workspaceId, memberId)) ?? null
		);
	}

	async removeMemberRole(
		memberId: IMemberDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<void> {
		dummyDB = dummyDB.filter((role) => role.workspaceId !== workspaceId);
		assignmentsByKey.delete(getAssignmentKey(workspaceId, memberId));
	}

	async listAssignments(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberRoleAssignmentDTO[]> {
		dummyDB = dummyDB.filter((role) => role.workspaceId === workspaceId) ?? [];

		return [...assignmentsByKey.values()].filter(
			(assignment) => assignment.workspaceId === workspaceId
		);
	}
}
