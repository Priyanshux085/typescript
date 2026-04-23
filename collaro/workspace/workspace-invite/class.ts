import { ID } from "@collaro/utils/generate";
import { IUser, IUserDTO, TUserId, User } from "@collaro/user";
import { IMemberStore, MemberStore, TMemberId } from "@collaro/workspace/role/member";
import { TWorkspaceId } from "@collaro/workspace/interface";
import {
	IInviteDTO,
	IInviteStore,
	IRequestInvite,
	TInviteId,
	TInviteStatus,
} from "./interface";
import { MemoryInviteStore } from "./stores/memory-invite-store";
import { Input } from "@collaro/utils";

export class InviteService implements IRequestInvite {
	private store: IInviteStore = new MemoryInviteStore();
	private userService: IUser = new User();
	private memberService: IMemberStore = MemberStore.getInstance();

	async createInvite(invite: Input<IInviteDTO>): Promise<IInviteDTO> {
		try {

			const dto: IInviteDTO = {
				...invite,
				status: "pending",
				id: ID.requestId(),
				createdAt: new Date(),
				updatedAt: null,
			}

			await this.store.save({
				...dto
			})

			return dto;
		} catch (error: unknown) {
			throw new Error(`Failed to create invite:`, {
				cause: error
			});
		}
	}
	
	async checkExpiration(invite: IInviteDTO): Promise<boolean> {
		try {
			return await this.store.checkExpiration(invite.id);
		} catch (error: unknown) {
			throw new Error(`Failed to check invite expiration:`, {
				cause: error
			});
		}
	}

	async getInvite(id: TInviteId): Promise<IInviteDTO | null> {
		try {
			return this.store.findById(id);
		} catch (error: unknown) {
			throw new Error(`Failed to retrieve invite with ID: ${id}`, {
				cause: error
			});
		}
	}

	async listInvites(workspaceId: TWorkspaceId): Promise<IInviteDTO[]> {
		try {
			return this.store.listByWorkspace(workspaceId);
		} catch (error: unknown) {
			throw new Error(`Failed to list invites for workspace ID: ${workspaceId}`, {
				cause: error
			});
		}
	}

	async acceptInvite(
		id: TInviteId,
		acceptedByUserId: TUserId
	): Promise<IInviteDTO & { user: IUserDTO }> {
		try {
			const invite = await this.store.findById(id);
			if (!invite) {
				throw new Error(`Invite with ID: ${id} not found.`);
			}
			if (invite.status !== "pending") {
				throw new Error(
					`Invite is not pending. Current status: ${invite.status}`
				);
			}
			if (invite.invitedUserId && invite.invitedUserId !== acceptedByUserId) {
				throw new Error(
					`User ID mismatch. This invite was sent to a different user.`
				);
			}

			await this.store.update(id, {
				status: "accepted",
				updatedAt: new Date(),
			});

			return {
				...invite,
				user: await this.userService.getUser(acceptedByUserId)!
			}

	} catch (error: unknown) {
			throw new Error(`Failed to accept invite with ID: ${id}`, {
				cause: error
			});
		}
	}

	async acceptInviteByEmail(
		id: TInviteId,
		email: string,
		userId: TUserId
	): Promise<IInviteDTO & { user: IUserDTO }> {
		const invite = await this.store.findById(id);
		if (!invite) {
			throw new Error(`Invite with ID: ${id} not found.`);
		}
		if (invite.status !== "pending") {
			throw new Error(
				`Invite is not pending. Current status: ${invite.status}`
			);
		}
		if (invite.invitedEmail && invite.invitedEmail !== email) {
			throw new Error(
				`Email mismatch. This invite was sent to a different email.`
			);
		}
		if (invite.invitedUserId && invite.invitedUserId !== userId) {
			throw new Error(
				`User ID mismatch. This invite was sent to a different user.`
			);
		}
		await this.store.update(id, {
			status: "accepted",
			invitedUserId: userId,
			updatedAt: new Date(),
		});

		return {
			...invite,
			invitedUserId: userId,
			user: await this.userService.getUser(userId)!
		}
	}

	async queryInvites(workspaceId: TWorkspaceId, status: TInviteStatus): Promise<IInviteDTO[]> {
		try {
			return await this.store.findByWorkspaceAndStatus(workspaceId, status);
		} catch (error) {
			throw new Error(`Failed to query invites for workspace ID: ${workspaceId}`, {
				cause: error
			});
		}
	}

	/**
	 * Revokes an invite by setting its status to "revoked". Only pending invites can be revoked.
	 * @param id The ID of the invite to revoke
	 * @param revokedByMemberId The ID of the member performing the revocation
	 * @returns The updated invite DTO after revocation.
	 * @throws Error if the invite is not found, is not pending, or if any other error occurs during the process.
	 */
	async revokeInvite(
		id: TInviteId,
		revokedByMemberId: TMemberId
	): Promise<IInviteDTO> {
		const invite = await this.store.findById(id);
		if (!invite) {
			throw new Error(`Invite with ID: ${id} not found.`);
		}
		if (invite.status !== "pending") {
			throw new Error(
				`Invite cannot be revoked. Current status: ${invite.status}`
			);
		}

		const memberExists = await this.memberService.findById(revokedByMemberId);
		if (!memberExists) {
			throw new Error(`The given member ID: does not exist. Cannot revoke invite.`);
		}

		if (memberExists.workspaceId !== invite.workspaceId && memberExists.role !== "owner") {
			throw new Error(`You do not have permission to revoke this invite.`);
		}

		return this.store.update(id, {
			status: "revoked",
			updatedAt: new Date(),
		});
	}
}
