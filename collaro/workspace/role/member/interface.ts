import { IUserDTO } from "@collaro/user";
import { Input } from "@collaro/utils/omit";
import { IWorkspaceDTO } from "@collaro/workspace";
import { IInviteDTO } from "@collaro/workspace/workspace-invite";
import { expirationTimeMap } from "@collaro/utils/time";
import { TMemberId, TRequestId } from "@collaro/utils";

export type TRole = "owner" | "admin" | "member";
export type TOwnerRole = "owner";
export type TRequestRole = "member";
export type TChangeableRole = Exclude<TRole, "owner">;

export interface IMemberDTO {
	id: TMemberId;
	name: string;
	userId: IUserDTO["id"];
	workspaceId: IWorkspaceDTO["id"];
	// roleId: IRoleDTO["id"];
	role: TRole;
	createdAt: Date;
	updatedAt: Date | null;
}

export interface IMember {
  member: IMemberDTO;
  store: IMemberStore;

  // methods
  addMemberToWorkspace(member: IMemberDTO, workspaceId: IWorkspaceDTO["id"]): void;
  getMember(id: TMemberId): IMemberDTO | null;
  updateMember(id: TMemberId, member: Partial<IMemberDTO>): void;
  removeMember(id: TMemberId): void;
  readonly listMembers: IMemberDTO[];
  removeFromWorkspace(workspaceId: IWorkspaceDTO["id"], memberId: TMemberId): void;
}

export interface IMemberStore {
	save(member: IMemberDTO): Promise<void>;
	findById(id: TMemberId): Promise<IMemberDTO | null>;
	update(id: TMemberId, member: Partial<IMemberDTO>): Promise<void>;
	delete(id: TMemberId): Promise<void>;
	list(workspaceId: IWorkspaceDTO["id"]): Promise<IMemberDTO[]>;
	checkMemberExists(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId
	): Promise<boolean>;
}

export type TInviteInput<T> = Omit<
	T,
	"id" | "createdAt" | "updatedAt" | "status" | "expirationDate"
>;

export type TExpiartionParams = Parameters<typeof expirationTimeMap>[0];

export type TCreateInviteDTO = TInviteInput<IInviteDTO> & {
	expirationTime: TExpiartionParams;
};

export type TCreateInviteInput =
	| ({
			type: "email";
			invitedEmail: string;
	  } & TCreateInviteDTO)
	| ({
			type: "userId";
			invitedUserId: IUserDTO["id"];
	  } & TCreateInviteDTO);


export interface IWorkspaceMemberManager {
	approveJoinRequest(
		requestId: TRequestId,
		approvedBy: TMemberId
	): Promise<IMemberDTO>;
	createWorkspace(
		workspace: Input<IWorkspaceDTO>
	): Promise<IWorkspaceDTO & { ownerDetail: IMemberDTO }>;
	listMembers(workspaceId: IWorkspaceDTO["id"]): Promise<IMemberDTO[]>;
	banMember(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId,
		bannedBy?: TMemberId
	): Promise<void>;
	removeMemberFromWorkspace(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId,
		removedBy?: TMemberId
	): Promise<void>;
	rejectJoinRequest(
		requestId: TRequestId,
		rejectedBy: TMemberId
	): Promise<void>;
	createInvite(input: TCreateInviteInput): Promise<IInviteDTO>;
	// acceptInvite(
	// 	inviteId: IInviteDTO["id"],
	// 	type: "email" | "userId",
	// 	approvedBy: TMemberId
	// ): Promise<IMemberDTO>;

	// // Role management methods
	// changeMemberRole(
	// 	workspaceId: IWorkspaceDTO["id"],
	// 	memberId: TMemberId,
	// 	newRole: IRoleDTO["name"],
	// 	changedBy: TMemberId
	// ): Promise<void>;
	// bulkAssignRole(
	// 	workspaceId: IWorkspaceDTO["id"],
	// 	memberIds: readonly TMemberId[],
	// 	roleId: TRoleId,
	// 	assignedBy: TMemberId
	// ): Promise<void>;
	// createCustomRole(
	// 	workspaceId: IWorkspaceDTO["id"],
	// 	name: string,
	// 	permissions: readonly TPermission[],
	// 	createdBy: TMemberId,
	// 	options?: { description?: string; parentRoleId?: TRoleId }
	// ): Promise<IRoleValidationResult>;
	// checkMemberPermission(
	// 	workspaceId: IWorkspaceDTO["id"],
	// 	memberId: TMemberId,
	// 	permission: TPermission
	// ): Promise<boolean>;
}