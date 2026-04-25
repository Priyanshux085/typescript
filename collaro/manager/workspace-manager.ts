import { ID } from "@collaro/utils/generate";
import { Input } from "@collaro/utils/omit";
import {
	WorkspaceNotification,
	workspaceNotification,
} from "@collaro/notification";
import { SubscriptionEnforcer, TSubscriptionPlan } from "@collaro/subscription";
import { IUser, IUserDTO, User } from "@collaro/user";
import { MemberSorting } from "@collaro/sorting/interface";
import {
	IMemberDTO,
	IMemberStore,
	IWorkspaceMemberManager,
	MemberStore,
	TCreateInviteInput,
} from "@collaro/workspace/role/member";

import { IWorkspaceDTO, IWorkspaceStore } from "../workspace/interface";
import { MemoryWorkspaceStore } from "../workspace/stores/memory-workspace-store";
import {
	IRequestMember,
	IRequestMemberDTO,
} from "../workspace/member-request/interface";
import { RequestMember } from "../workspace/member-request/class";
import { WorkspaceRoleManager as RoleManager } from "./workspace-role-manager";
import {
	IRequestInvite,
	IInviteDTO,
} from "../workspace/workspace-invite/interface";
import { InviteService } from "../workspace/workspace-invite/class";
import { expirationTimeMap } from "@collaro/utils/time";
import { TMemberId, TRequestId } from "@collaro/utils";

export class WorkspaceMemberManager implements IWorkspaceMemberManager {
	private workspaceStore: IWorkspaceStore = MemoryWorkspaceStore.getInstance();
	private memberStore: IMemberStore = MemberStore.getInstance();
	private notificationService: WorkspaceNotification = workspaceNotification;
	private requestService: IRequestMember = new RequestMember();
	private inviteService: IRequestInvite = new InviteService();
	private user: IUser = new User();

	private sorting = new MemberSorting();

	private async getOwnerDetail(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberDTO | null> {
		const workspace = await this.findWorkspaceById(workspaceId);
		if (!workspace) {
			throw new Error(`Workspace with ID: ${workspaceId} not found.`);
		}

		return this.listMemberDetails({
			userID: workspace.ownerId,
			workspaceId,
		});
	}

	private getRoleManager(
		workspaceId: IWorkspaceDTO["id"],
		subscription: TSubscriptionPlan
	): RoleManager {
		return new RoleManager(workspaceId, subscription);
	}

	// private async createOwnerRole(
	// 	userId: IUserDTO["id"],
	// 	workspaceId: IWorkspaceDTO["id"]
	// ): Promise<IMemberDTO & { role: IRoleDTO }> {
	// 	const roleManager = this.getRoleManager(workspaceId, "free");

	// 	const ownerRole = await roleManager.getPredefinedRole(workspaceId, "owner");

	// 	if (!ownerRole) {
	// 		throw new Error(
	// 			`Failed to create owner role for workspace ID: ${workspaceId}.`
	// 		);
	// 	}

	// 	const user = await this.user.getUser(userId);

	// 	const ownerMember: IMemberDTO = {
	// 		userId,
	// 		id: ID.memberId(),
	// 		workspaceId,
	// 		name: `${user?.name}`,
	// 		role: "owner",
	// 		createdAt: new Date(),
	// 		updatedAt: null,
	// 	};
	// 	console.log("Owner Member: \n", ownerMember);

	// 	await this.memberStore.save(ownerMember);

	// 	return { ...ownerMember, role: ownerRole };
	// }

	private async joinWorkspace(
		workspaceId: IWorkspaceDTO["id"],
		userId: IUserDTO["id"]
	): Promise<IMemberDTO> {
		const workspace = await this.findWorkspaceById(workspaceId);
		if (!workspace) {
			throw new Error(
				`Workspace with ID: ${workspaceId} not found. Cannot join workspace.`
			);
		}

		const user = await this.user.getUser(userId);
		if (!user) {
			throw new Error(
				`User with ID: ${userId} not found. Cannot join workspace.`
			);
		}

		const currentMembers = await this.listMembers(workspaceId);
		SubscriptionEnforcer.enforceMemberAddition({
			currentPlan: workspace.subscription,
			currentMemberCount: currentMembers.length,
		});

		const roleManager = this.getRoleManager(
			workspaceId,
			workspace.subscription
		);

		const memberRole = await roleManager.getPredefinedRole(
			workspaceId,
			"member"
		);
		if (!memberRole) {
			throw new Error(
				`Default member role not found for workspace ${workspaceId}.`
			);
		}

		const newMember: IMemberDTO = {
			id: ID.memberId(),
			name: user.name,
			workspaceId,
			role: "member",
			createdAt: new Date(),
			updatedAt: null,
			userId,
		};

		const owner = await this.getOwnerDetail(workspaceId);
		await this.memberStore.save(newMember);

		await roleManager.assignRole(newMember.id, "member", owner!.id);

		await this.notificationService.createMemberNotification({
			type: "request_approved",
			userName: user.userName,
			workspaceName: workspace.name || workspace.slug,
			memberId: newMember.id,
			userId: user.id,
			workspaceId: workspaceId,
		});

		await this.notificationService.createWorkspaceNotification({
			userName: user.userName,
			type: "workspace_joined",
			userId: workspace.ownerId,
			workspaceId: workspaceId,
			workspaceName: workspace.name,
			memberId: newMember.id,
		});

		return newMember;
	}

	async findWorkspaceById(
		id: IWorkspaceDTO["id"]
	): Promise<IWorkspaceDTO | null> {
		return this.workspaceStore.findById(id);
	}

	async createWorkspace(
		workspace: Input<IWorkspaceDTO>
	): Promise<IWorkspaceDTO & { ownerDetail: IMemberDTO }> {
		const user = await this.user.getUser(workspace.ownerId);
		if (!user) {
			throw new Error(`Owner with ID: ${workspace.ownerId} not found.`);
		}

		const createdAt = new Date();

		const newWorkspace: IWorkspaceDTO = {
			...workspace,
			id: ID.workspaceId(),
			subscription: workspace.subscription || "free",
			createdAt,
			updatedAt: null,
		};

		await this.workspaceStore.save(newWorkspace);

		// const ownerMember = await this.createOwnerRole(
		// 	workspace.ownerId,
		// 	newWorkspace.id
		// );

		// Create owner member with owner role
		const createRoleId = ID.memberId();

		const ownerMember: IMemberDTO & { role: "owner" } = {
			id: createRoleId,
			userId: workspace.ownerId,
			workspaceId: newWorkspace.id,
			role: "owner",
			name: user.name,
			createdAt,
			updatedAt: null,
		};

		await this.memberStore.save({
			...ownerMember,
		});

		await this.notificationService.createWorkspaceNotification({
			workspaceName: newWorkspace.name,
			type: "workspace_created",
			memberId: createRoleId,
			userId: workspace.ownerId,
			workspaceId: newWorkspace.id,
		});

		return { ...newWorkspace, ownerDetail: ownerMember };
	}

	async updateWorkspace(
		workspaceId: IWorkspaceDTO["id"],
		workspaceData: Partial<
			Omit<IWorkspaceDTO, "id" | "createdAt" | "updatedAt">
		>,
		memberId: TMemberId
	): Promise<IWorkspaceDTO> {
		const memberExists = await this.memberStore.checkMemberExists(
			workspaceId,
			memberId
		);
		if (!memberExists) {
			throw new Error(
				`Workspace with ID: ${workspaceId} not found. Cannot update workspace.`
			);
		}

		const workspaceDetail = await this.findWorkspaceById(workspaceId);
		if (!workspaceDetail) {
			throw new Error(`Workspace with ID: ${workspaceId} not found.`);
		}

		const member = await this.memberStore.findById(memberId);
		if (!member) {
			throw new Error("Member not found.");
		}

		const dto: IWorkspaceDTO = {
			...workspaceDetail,
			...workspaceData,
			updatedAt: new Date(),
		};

		await this.workspaceStore.update(workspaceId, dto);

		await this.notificationService.createWorkspaceNotification({
			workspaceName: dto.name,
			type: "workspace_updated",
			userId: workspaceDetail.ownerId,
			workspaceId,
			memberId: member.id,
			userName: member.name,
		});

		return dto;
	}

	async approveJoinRequest(
		requestId: TRequestId,
		approvedBy: TMemberId
	): Promise<IMemberDTO> {
		try {
			const request = await this.requestService.getRequest(requestId);
			if (!request) {
				throw new Error(`Join request with ID: ${requestId} not found.`);
			}

			const approverExists = await this.memberStore.checkMemberExists(
				request.workspaceId,
				approvedBy
			);
			if (!approverExists) {
				throw new Error(
					"Approver is not a member of the workspace. Cannot approve join request."
				);
			}

			const approverDetails = await this.memberStore.findById(approvedBy);
			const workspace = await this.findWorkspaceById(request.workspaceId);
			if (!approverDetails || !workspace) {
				throw new Error("Approver or workspace not found.");
			}

			return await this.joinWorkspace(request.workspaceId, request.userId);
		} catch (error: unknown) {
			throw new Error(
				`Error approving join request:: \n ${(error as Error).message}`,
				{
					cause: error,
				}
			);
		}
	}

	async rejectJoinRequest(
		requestId: TRequestId,
		rejectedBy: TMemberId
	): Promise<void> {
		try {
			const request = await this.requestService.getRequest(requestId);
			if (!request) {
				throw new Error(`Join request with ID: ${requestId} not found.`);
			}

			const rejectorExists = await this.memberStore.checkMemberExists(
				request.workspaceId,
				rejectedBy
			);
			if (!rejectorExists) {
				throw new Error(
					"Rejector is not a member of the workspace. Cannot reject join request."
				);
			}

			const rejectorDetails = await this.memberStore.findById(rejectedBy);
			const workspace = await this.findWorkspaceById(request.workspaceId);
			if (!rejectorDetails || !workspace) {
				throw new Error("Rejector or workspace not found.");
			}

			// const roleManager = this.getRoleManager(
			// 	workspace.id,
			// 	workspace.subscription
			// );
			// const canManage = await roleManager.hasPermission(
			// 	rejectorDetails.roleId,
			// 	"manage_roles:workspace"
			// );
			// if (!canManage.hasPermission) {
			// 	throw new Error(
			// 		canManage.reason ||
			// 			"Rejector does not have sufficient permissions to reject join requests."
			// 	);
			// }

			await this.requestService.rejectRequest(requestId);

			await this.notificationService.createMemberNotification({
				type: "request_rejected",
				userName: request.name,
				workspaceName: workspace.name,
				userId: request.userId,
				workspaceId: request.workspaceId,
			});
		} catch (error: unknown) {
			throw new Error(
				`Error rejecting join request:: \n ${(error as Error).message}`,
				{
					cause: error,
				}
			);
		}
	}

	async banMember(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId,
		bannedBy?: TMemberId
	): Promise<void> {
		await this.removeMemberFromWorkspace(workspaceId, memberId, bannedBy);
	}

	async listMembers(workspaceId: IWorkspaceDTO["id"]): Promise<IMemberDTO[]> {
		try {
			const workspace = await this.findWorkspaceById(workspaceId);
			if (!workspace) {
				console.log(
					`Workspace with ID: ${workspaceId} not found. Cannot fetch members.`
				);
				throw new Error(`Workspace with ID: ${workspaceId} not found.`);
			}

			const list = await this.memberStore.list(workspaceId);
			const members = this.sorting.sortByName(list, "asc");

			return members;
		} catch (error) {
			console.error(
				`Error fetching members for workspace ID: ${workspaceId}.`,
				error
			);
			throw error;
		}
	}

	async removeMemberFromWorkspace(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId,
		removedBy?: TMemberId
	): Promise<void> {
		const memberExists = await this.memberStore.checkMemberExists(
			workspaceId,
			memberId
		);
		if (!memberExists) {
			throw new Error(
				`Member with ID: ${memberId} not found in workspace ID: ${workspaceId}.`
			);
		}

		const member = await this.memberStore.findById(memberId);
		const workspace = await this.findWorkspaceById(workspaceId);
		if (!member || !workspace) {
			throw new Error("Member or workspace not found.");
		}

		if (member.role === "owner") {
			throw new Error("Workspace owner cannot be removed.");
		}

		if (removedBy) {
			const approverMember = await this.memberStore.findById(removedBy);
			if (!approverMember) {
				throw new Error(
					`Requester with ID: ${removedBy} not found. Cannot remove member.`
				);
			}

			if (approverMember.role !== "member") {
				throw new Error("Only workspace Owner and Admins can remove members.");
			}
		}

		await this.memberStore.delete(memberId);

		await this.notificationService.createMemberNotification({
			type: "member_removed",
			memberId,
			workspaceId,
			userId: member.userId,
			userName: member.name,
			workspaceName: workspace.name,
		});
	}

	async listMemberDetails(query: {
		userID: IUserDTO["id"];
		workspaceId: IWorkspaceDTO["id"];
	}): Promise<IMemberDTO | null> {
		const { userID, workspaceId } = query;

		const user = await this.user.getUser(userID);
		if (!user) {
			throw new Error(
				`User with ID: ${userID} not found. Cannot fetch member details.`
			);
		}

		const members = await this.memberStore.list(workspaceId);
		const memberDetails = members.find((member) => member.userId === userID);

		if (!memberDetails) {
			console.log(`Member details for user ID: ${userID} not found.`);
			return null;
		}

		return memberDetails;
	}

	async requestWorkspace(
		workspaceId: IWorkspaceDTO["id"],
		userId: IUserDTO["id"]
	): Promise<void> {
		const workspace = await this.findWorkspaceById(workspaceId);
		const user = await this.user.getUser(userId);

		if (!workspace || !user) {
			throw new Error(
				`Workspace or User not found. Cannot request to join workspace.`
			);
		}

		const request: IRequestMemberDTO = {
			id: ID.requestId(),
			userId,
			workspaceId,
			name: user.name,
			status: "pending",
			role: "member",
			createdAt: new Date(),
			updatedAt: null,
		};

		const result = await this.requestService.createRequest(request);

		await this.notificationService.createMemberNotification({
			workspaceName: workspace.name,
			userName: user.userName,
			type: "join_request",
			userId: workspace.ownerId,
			workspaceId,
		});

		if (!result) {
			throw new Error(
				`Failed to create join request for user ID: ${userId} and workspace ID: ${workspaceId}.`
			);
		}

		return Promise.resolve();
	}

	async listRequests(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IRequestMemberDTO[]> {
		return this.requestService.listRequests(workspaceId);
	}

	async createInvite(input: TCreateInviteInput): Promise<IInviteDTO> {
		try {
			// Validate inviter has permission
			const workspace = await this.findWorkspaceById(input.workspaceId);
			if (!workspace) {
				throw new Error(`Workspace with ID: ${input.workspaceId} not found.`);
			}

			const expirationDate = expirationTimeMap(input.expirationTime);

			switch (input.type) {
				case "email":
					return await this.createEmailInvite(input.invitedEmail, {
						...input,
						expirationDate,
						status: "pending",
					});

				case "userId":
					return await this.createUserIdInvite(input.invitedUserId, {
						...input,
						expirationDate,
						status: "pending",
					});
				default:
					throw new Error("Invalid invite type.");
			}
		} catch (error: unknown) {
			throw new Error(`Failed to create invite: ${(error as Error).message}`, {
				cause: error,
			});
		}
	}

	private async createEmailInvite(
		email: string,
		inviteDTO: Input<IInviteDTO>
	): Promise<IInviteDTO> {
		try {
			// Validate email format
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!emailRegex.test(email)) {
				throw new Error(`Invalid email format: ${email}`);
			}

			// Check workspace capacity
			const workspace = await this.findWorkspaceById(inviteDTO.workspaceId);
			if (!workspace) {
				throw new Error(
					`Workspace with ID: ${inviteDTO.workspaceId} not found.`
				);
			}

			const currentMembers = await this.listMembers(inviteDTO.workspaceId);
			SubscriptionEnforcer.enforceMemberAddition({
				currentPlan: workspace.subscription,
				currentMemberCount: currentMembers.length,
			});

			// For email invites, user doesn't need to have an account yet
			const invite = await this.inviteService.createInvite({
				invitedEmail: email,
				...inviteDTO,
			});

			return invite;
		} catch (error: unknown) {
			throw new Error(
				`Failed to create email invite: ${(error as Error).message}`,
				{
					cause: error,
				}
			);
		}
	}

	private async createUserIdInvite(
		userId: IUserDTO["id"],
		inviteDTO: Input<IInviteDTO>
	): Promise<IInviteDTO> {
		try {
			// Validate user exists (Collaro user)
			const user = await this.user.getUser(userId);
			if (!user) {
				throw new Error(
					`User with ID: ${userId} not found. User must have a Collaro account.`
				);
			}

			// Check user is not already a member
			const workspace = await this.findWorkspaceById(inviteDTO.workspaceId);
			if (!workspace) {
				throw new Error(
					`Workspace with ID: ${inviteDTO.workspaceId} not found.`
				);
			}

			const existingMember = await this.listMemberDetails({
				userID: userId,
				workspaceId: inviteDTO.workspaceId,
			});
			if (existingMember) {
				throw new Error(
					`User is already a member of workspace: ${workspace.name}`
				);
			}

			// Check workspace capacity
			const currentMembers = await this.listMembers(inviteDTO.workspaceId);
			SubscriptionEnforcer.enforceMemberAddition({
				currentPlan: workspace.subscription,
				currentMemberCount: currentMembers.length,
			});

			const invite = await this.inviteService.createInvite({
				invitedUserId: userId,
				...inviteDTO,
			});

			// Send notification to Collaro user
			await this.notificationService.createMemberNotification({
				type: "invite_sent",
				workspaceId: inviteDTO.workspaceId,
				workspaceName: workspace.name,
				userName: user.userName,
				userId: userId,
			});

			return invite;
		} catch (error: unknown) {
			throw new Error(
				`Failed to create user ID invite: ${(error as Error).message}`,
				{
					cause: error,
				}
			);
		}
	}

	async acceptInvite(
		inviteId: TRequestId,
		acceptedByUserId: IUserDTO["id"]
	): Promise<IMemberDTO> {
		try {
			// Get and validate invite
			const invite = await this.inviteService.getInvite(inviteId);
			if (!invite) {
				throw new Error(`Invite with ID: ${inviteId} not found.`);
			}

			if (invite.status !== "pending") {
				throw new Error(
					`Invite is not pending. Current status: ${invite.status}`
				);
			}

			// Check expiration
			const isExpired = await this.inviteService.checkExpiration(invite);
			if (isExpired) {
				throw new Error("Invite has expired.");
			}

			// Validate userId matches invited user
			if (!invite.invitedUserId) {
				throw new Error(
					"This invite is not for a userId. Use acceptInviteByEmail instead."
				);
			}

			if (invite.invitedUserId !== acceptedByUserId) {
				throw new Error("You cannot accept an invite sent to another user.");
			}

			// Join workspace
			const member = await this.joinWorkspace(
				invite.workspaceId,
				acceptedByUserId
			);

			// Update invite status
			await this.inviteService.acceptInvite(inviteId, acceptedByUserId);

			// Assign role if not default member role
			if (invite.role !== "member") {
				const workspace = await this.findWorkspaceById(invite.workspaceId);
				if (workspace) {
					const roleManager = this.getRoleManager(
						invite.workspaceId,
						workspace.subscription
					);
					const owner = await this.getOwnerDetail(invite.workspaceId);
					if (owner) {
						await roleManager.assignRole(member.id, invite.role, owner.id);
					}
				}
			}

			// Send acceptance notifications
			const user = await this.user.getUser(acceptedByUserId);
			const workspace = await this.findWorkspaceById(invite.workspaceId);
			if (user && workspace) {
				await this.notificationService.createWorkspaceNotification({
					type: "invite_sent",
					userId: workspace.ownerId,
					workspaceId: invite.workspaceId,
					workspaceName: workspace.name,
					userName: user.userName,
					memberId: member.id,
				});
			}

			return member;
		} catch (error: unknown) {
			throw new Error(`Error accepting invite: ${(error as Error).message}`, {
				cause: error,
			});
		}
	}

	async acceptInviteByEmail(
		inviteId: TRequestId,
		email: string,
		acceptedByUserId: IUserDTO["id"]
	): Promise<IMemberDTO> {
		try {
			// Get and validate invite
			const invite = await this.inviteService.getInvite(inviteId);
			if (!invite) {
				throw new Error(`Invite with ID: ${inviteId} not found.`);
			}

			// Validate email matches invite
			if (!invite.invitedEmail || invite.invitedEmail !== email) {
				throw new Error(
					"Email mismatch. This invite was sent to a different email."
				);
			}

			if (invite.status !== "pending") {
				throw new Error(
					`Invite is not pending. Current status: ${invite.status}`
				);
			}

			// Check expiration
			const isExpired = await this.inviteService.checkExpiration(invite);
			if (isExpired) {
				throw new Error("Invite has expired.");
			}

			// Verify user has created account (not just invite for email)
			const user = await this.user.getUser(acceptedByUserId);
			if (!user) {
				throw new Error(
					"You must create a Collaro account before accepting this invite."
				);
			}

			// Verify email matches user account email
			if (user.email !== email) {
				throw new Error(
					"Email mismatch. This invite was sent to a different email than your account."
				);
			}

			// Join workspace
			const member = await this.joinWorkspace(
				invite.workspaceId,
				acceptedByUserId
			);

			// Update invite status
			await this.inviteService.acceptInviteByEmail(
				inviteId,
				email,
				acceptedByUserId
			);

			// Send acceptance notifications
			const workspace = await this.findWorkspaceById(invite.workspaceId);
			if (user && workspace) {
				await this.notificationService.createWorkspaceNotification({
					type: "invite_sent",
					userId: workspace.ownerId,
					workspaceId: invite.workspaceId,
					workspaceName: workspace.name,
					userName: user.userName,
					memberId: member.id,
				});
			}

			return member;
		} catch (error: unknown) {
			throw new Error(
				`Error accepting invite by email: ${(error as Error).message}`,
				{
					cause: error,
				}
			);
		}
	}
}
