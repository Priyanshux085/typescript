import { IWorkspaceDTO } from "../interface";
import { IUserDTO } from "@collaro/user";
import { TMemberId } from "@collaro/workspace/role/member";
import { TRequestId } from "@collaro/workspace/member-request/interface";
import { Input } from "@collaro/utils";

export type TInviteId = TRequestId;
export type TInviteStatus = "pending" | "accepted" | "revoked" | "expired";
export type TInviteRole = "member" | "admin";
export type TInviteMethod = "email" | "userId";

export interface IInviteDTO {
	id: TInviteId;
	workspaceId: IWorkspaceDTO["id"];
	role: TInviteRole;
	status: TInviteStatus;
	createdAt: Date;
	updatedAt: Date | null;
	expirationDate: Date;
	reason?: string;
	// For email invites
	invitedEmail?: string;
	// For userId invites
	invitedUserId?: IUserDTO["id"];
}

export interface IInviteStore {
	save(invite: IInviteDTO): Promise<IInviteDTO>;
	findById(id: TInviteId): Promise<IInviteDTO | null>;
	checkExpiration(inviteId: TInviteId): Promise<boolean>;
	listByWorkspace(workspaceId: IWorkspaceDTO["id"]): Promise<IInviteDTO[]>;
	findByWorkspaceAndStatus(
		workspaceId: IWorkspaceDTO["id"],
		status: IInviteDTO["status"]
	): Promise<IInviteDTO[]>;
	findByUserAndWorkspace(
		userId: IUserDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IInviteDTO | null>;
	findByEmailAndWorkspace(
		email: string,
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IInviteDTO | null>;
	update(id: TInviteId, patch: Partial<IInviteDTO>): Promise<IInviteDTO>;
	delete(id: TInviteId): Promise<void>;
}

export interface IRequestInvite {
	createInvite(invite: Input<IInviteDTO>): Promise<IInviteDTO>;
	checkExpiration(invite: IInviteDTO): Promise<boolean>;
	getInvite(id: TInviteId): Promise<IInviteDTO | null>;
	listInvites(workspaceId: IWorkspaceDTO["id"]): Promise<IInviteDTO[]>;
	acceptInvite(
		id: TInviteId,
		acceptedByUserId: IUserDTO["id"]
	): Promise<IInviteDTO & { user: IUserDTO }>;
	acceptInviteByEmail(
		id: TInviteId,
		email: string,
		userId: IUserDTO["id"]
	): Promise<IInviteDTO & { user: IUserDTO }>;
	revokeInvite(
		id: TInviteId,
		revokedByMemberId: TMemberId
	): Promise<IInviteDTO>;
}
