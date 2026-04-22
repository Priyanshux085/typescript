import { IWorkspaceDTO } from "@collaro/workspace";
import { IMember, IMemberDTO, IMemberStore, TMemberId } from "./interface";

export class Member implements IMember {
  member: IMemberDTO = {} as IMemberDTO;
  store: IMemberStore = new MemberStore();

  addMemberToWorkspace(member: IMemberDTO, workspaceId: IWorkspaceDTO["id"]): void {
    // Implementation to add a member to a workspace.
    console.log(`Adding member with ID: ${member.id} to workspace ID: ${workspaceId}`);
  }

  getMember(id: TMemberId): IMemberDTO | null {
    // Implementation to get a member by ID
    console.log(`Fetching member with ID: ${id} from workspace ID: ${this.member.id}`);
    return null;
  }

  updateMember(id: TMemberId, member: Partial<IMemberDTO>): void {
    // Implementation to update a member's information
    console.log(`Updating member with ID: ${id} in workspace ID: ${this.member.id}`);
    console.log(`Updated member data: ${JSON.stringify(member)}`);
  }

  removeMember(id: TMemberId): void {
    // Implementation to remove a member by ID
    console.log(`Removing member with ID: ${id} from workspace ID: ${this.member.id}`);
  }

  get listMembers(): IMemberDTO[] {
    // Implementation to return a list of members
    console.log(`Fetching list of members from workspace ID: ${this.member.id}`);
    return [];
  }

  addToWorkspace(workspaceId: IWorkspaceDTO["id"], member: IMemberDTO): void {
    // Implementation to add a member to a workspace.
    console.log(`Adding member with ID: ${member.id} to workspace ID: ${workspaceId}`);
  }

  removeFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): void {
    // Implementation to remove a member from a workspace.
    console.log(`Removing member with ID: ${memberId} from workspace ID: ${workspaceId}`);
  }

  private fetchWorkspace(id: IWorkspaceDTO["id"]): IWorkspaceDTO {
    // Implementation to fetch workspace details by ID
    console.log(`Fetching workspace with ID: ${id}`);
    return {
			createdAt: new Date(),
			slug: "mock-workspace",
			description: "Mock workspace description",
			id,
			subscription: "free",
			name: "Mock Workspace",
			ownerId: "user-123" as unknown as IWorkspaceDTO["ownerId"],
			updatedAt: new Date(),
		};
  }
}

const localStorage: IMemberDTO[] = [];

export class MemberStore implements IMemberStore {
	async save(member: IMemberDTO): Promise<void> {
		localStorage.push(member);
		return Promise.resolve();
	}

	async findById(id: TMemberId): Promise<IMemberDTO | null> {
		const member = localStorage.find((member) => member.id === id);

		return Promise.resolve(member ?? null);
	}

	async delete(id: TMemberId): Promise<void> {
		const index = localStorage.findIndex((member) => member.id === id);
		if (index !== -1) {
			localStorage.splice(index, 1);
		}
		return Promise.resolve();
	}

	async list(workspaceId: IWorkspaceDTO["id"]): Promise<IMemberDTO[]> {
		return Promise.resolve(
			localStorage.filter((member) => member.workspaceId === workspaceId)
		);
	}

	async update(id: TMemberId, member: Partial<IMemberDTO>): Promise<void> {
		const memberToUpdate = await this.findById(id);

		if (!memberToUpdate)
			throw new Error(`Member with ID: ${id} not found. Cannot update.`);

		if (member.role && member.role === "owner") {
			throw new Error("Cannot change role to 'owner'. This role is reserved.");
		}

		memberToUpdate.name = member.name || memberToUpdate.name;
		memberToUpdate.role = member.role || memberToUpdate.role;
		memberToUpdate.role = member.role || memberToUpdate.role;
		memberToUpdate.updatedAt = new Date();
		return Promise.resolve();
	}

	async checkMemberExists(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId
	): Promise<boolean> {
		const memberExists = localStorage.some(
			(member) => member.id === memberId && member.workspaceId === workspaceId
		);
		return Promise.resolve(memberExists);
	}
}