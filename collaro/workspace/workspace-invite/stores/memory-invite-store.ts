import { IInviteStore, IInviteDTO, TInviteId } from "../interface";
import { TUserId } from "@collaro/user";
import { TWorkspaceId } from "@collaro/workspace/interface";

export class MemoryInviteStore implements IInviteStore {
	private store = new Map<TInviteId, IInviteDTO>();

	async save(invite: IInviteDTO): Promise<IInviteDTO> {
		this.store.set(invite.id, invite);
		return invite;
	}

	async checkExpiration(inviteId: TInviteId): Promise<boolean> {
		const now = Date.now();
		const invite = await this.findById(inviteId);
		
		if (!invite) return false;
		return now > invite.expirationDate.getTime();
	}

	async findById(id: TInviteId): Promise<IInviteDTO | null> {
		return this.store.get(id) ?? null;
	}

	async listByWorkspace(
		workspaceId: IInviteDTO["workspaceId"]
	): Promise<IInviteDTO[]> {
		const list: IInviteDTO[] = [];
		for (const invite of this.store.values()) {
			if (invite.workspaceId === workspaceId) list.push(invite);
		}
		return list;
	}

	async findByUserAndWorkspace(
		userId: TUserId,
		workspaceId: TWorkspaceId
	): Promise<IInviteDTO | null> {
		for (const invite of this.store.values()) {
			if (
				invite.workspaceId === workspaceId
			) {
				return invite;
			}
		}
		return null;
	}

	async findByEmailAndWorkspace(
		email: string,
		workspaceId: TWorkspaceId
	): Promise<IInviteDTO | null> {
		for (const invite of this.store.values()) {
			if (invite.workspaceId === workspaceId) {
				return invite;
			}
		}
		return null;
	}

	async findByWorkspaceAndStatus(
		workspaceId: TWorkspaceId,
		status: IInviteDTO["status"]
	): Promise<IInviteDTO[]> {
		const list: IInviteDTO[] = [];
		for (const invite of this.store.values()) {
			if (invite.workspaceId === workspaceId && invite.status === status) {
				list.push(invite);
			}
		}
		return list;
	}

	async update(id: TInviteId, patch: Partial<IInviteDTO>): Promise<IInviteDTO> {
		const existing = this.store.get(id);
		if (!existing) throw new Error(`Invite with ID: ${id} not found.`);
		const updated = { ...existing, ...patch, updatedAt: new Date() };
		this.store.set(id, updated);
		return updated;
	}

	async delete(id: TInviteId): Promise<void> {
		this.store.delete(id);
	}
}
