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
	TMemberId,
	MemberStore,
} from "@collaro/workspace/member";

import { IWorkspaceDTO, IWorkspaceStore } from "../workspace/interface";
import { MemoryWorkspaceStore } from "../workspace/stores/memory-workspace-store";
import {
	IRequestMember,
	IRequestMemberDTO,
	TRequestId,
} from "../workspace/member-request/interface";
import { RequestMember } from "../workspace/member-request/class";
import { WorkspaceRoleManager as RoleManager } from "./workspace-role-manager";
import { IRoleDTO } from "@collaro/workspace/role";

export class WorkspaceMemberManager implements IWorkspaceMemberManager {
	private workspaceStore: IWorkspaceStore = MemoryWorkspaceStore.getInstance();
	private memberStore: IMemberStore = new MemberStore();
	private notificationService: WorkspaceNotification = workspaceNotification;
	private requestService: IRequestMember = new RequestMember();
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

	private async createOwnerRole(
		userId: IUserDTO["id"],
		workspaceId: IWorkspaceDTO["id"]
	): Promise<IMemberDTO & { role: IRoleDTO }> {
		const roleManager = this.getRoleManager(workspaceId, "free");

		const ownerRole = await roleManager.getPredefinedRole(workspaceId, "owner");

		if (!ownerRole) {
			throw new Error(
				`Failed to create owner role for workspace ID: ${workspaceId}.`
			);
		}

		const user = await this.user.getUser(userId);

		const ownerMember: IMemberDTO = {
			userId,
			id: ID.memberId(),
			workspaceId,
			name: `${user?.name}`,
			roleId: ownerRole.id,
			createdAt: new Date(),
			updatedAt: null,
		};
		console.log("Owner Member: \n", ownerMember);

		await this.memberStore.save(ownerMember);

		return { ...ownerMember, role: ownerRole };
	}

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
			roleId: memberRole.id,
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

		const newWorkspace: IWorkspaceDTO = {
			...workspace,
			id: ID.workspaceId(),
			subscription: workspace.subscription || "free",
			createdAt: new Date(),
			updatedAt: null,
		};

		await this.workspaceStore.save(newWorkspace);

		const ownerMember = await this.createOwnerRole(
			workspace.ownerId,
			newWorkspace.id
		);

		await this.notificationService.createWorkspaceNotification({
			workspaceName: newWorkspace.name,
			type: "workspace_created",
			memberId: ownerMember.id,
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

		const roleManager = this.getRoleManager(
			workspaceDetail.id,
			workspaceDetail.subscription
		);
		const canUpdate = await roleManager.hasPermission(
			member.roleId,
			"edit_settings:workspace"
		);
		if (!canUpdate.hasPermission) {
			throw new Error(
				canUpdate.reason ||
					"Only workspace admins can update workspace details."
			);
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

			const roleManager = this.getRoleManager(
				workspace.id,
				workspace.subscription
			);
			const canManage = await roleManager.hasPermission(
				approverDetails.roleId,
				"manage_roles:workspace"
			);
			if (!canManage.hasPermission) {
				throw new Error(
					canManage.reason ||
						"Approver does not have sufficient permissions to approve join requests."
				);
			}

			const result = await this.requestService.approveRequest(requestId);
			if (!result || !result.success) {
				throw new Error(
					`Failed to approve join request with ID: ${requestId}.`
				);
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

			const roleManager = this.getRoleManager(
				workspace.id,
				workspace.subscription
			);
			const canManage = await roleManager.hasPermission(
				rejectorDetails.roleId,
				"manage_roles:workspace"
			);
			if (!canManage.hasPermission) {
				throw new Error(
					canManage.reason ||
						"Rejector does not have sufficient permissions to reject join requests."
				);
			}

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

	async listMembers(
		workspaceId: IWorkspaceDTO["id"]
	): Promise<(IMemberDTO & { role: IRoleDTO })[]> {
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

			const roles = await this.getRoleManager(
				workspaceId,
				workspace.subscription
			).getRolesForWorkspace();

			const roleMap = new Map<string, IRoleDTO>(
				roles.map((role) => [String(role.id), role])
			);

			const result: (IMemberDTO & { role: IRoleDTO })[] = members.map(
				(member) => ({
					...member,
					role: roleMap.get(String(member.roleId))!,
				})
			);

			return result;
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

		const roleManager = this.getRoleManager(
			workspace.id,
			workspace.subscription
		);
		const targetRole = await roleManager.getMemberRole(memberId);
		if (targetRole?.name === "owner") {
			throw new Error("Workspace owner cannot be removed.");
		}

		if (removedBy) {
			const remover = await this.memberStore.findById(removedBy);
			if (!remover) {
				throw new Error("Requester not found.");
			}

			const canRemove = await roleManager.hasPermission(
				remover.roleId,
				"remove:member"
			);
			if (!canRemove.hasPermission) {
				throw new Error(
					canRemove.reason || "You do not have permission to remove members."
				);
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
}
