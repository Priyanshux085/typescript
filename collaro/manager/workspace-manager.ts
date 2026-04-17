import { ID } from "@collaro/utils/generate";
import { Input } from "@collaro/utils/omit";
import {
	WorkspaceNotification,
	workspaceNotification,
} from "@collaro/notification";
import { SubscriptionEnforcer, TSubscriptionPlan } from "@collaro/subscription";
import {
	MemoryRoleStore,
	RoleManager,
	ROLE_LIMITS_BY_SUBSCRIPTION,
	IRoleValidationResult,
	TPermission,
	TRoleId,
} from "@collaro/workspace/member/role";
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

export class WorkspaceMemberManager implements IWorkspaceMemberManager {
	private memberStore: IMemberStore = new MemberStore();
	private workspaceStore: IWorkspaceStore = new MemoryWorkspaceStore();
	private notificationService: WorkspaceNotification = workspaceNotification;
	private requestService: IRequestMember = new RequestMember();
	private user: IUser = new User();
	private roleStore = new MemoryRoleStore();

	private sorting = new MemberSorting();

	private getRoleManager(subscription: TSubscriptionPlan): RoleManager {
		return new RoleManager(this.roleStore, subscription);
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

		const user = this.user.getUser(userId);
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

		const roleManager = this.getRoleManager(workspace.subscription);
		await roleManager.seedWorkspaceRoles(workspaceId);
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
			role: memberRole.key,
			roleId: memberRole.id,
			createdAt: new Date(),
			updatedAt: null,
			userId,
		};

		await this.memberStore.save(newMember);
		await roleManager.assignRoleToMember(
			String(newMember.id),
			workspaceId,
			memberRole.id,
			"system"
		);

		await this.notificationService.createMemberNotification({
			type: "request_approved",
			userName: user.userName,
			workspaceName: workspace.name || workspace.slug,
			memberID: newMember.id,
			userId: user.id,
			workspaceId: workspaceId,
		});

		await this.notificationService.createWorkspaceNotification({
			userName: user.userName,
			type: "workspace_joined",
			userId: workspace.ownerId,
			workspaceId: workspaceId,
			workspaceName: workspace.name,
			memberID: newMember.id,
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
	): Promise<IWorkspaceDTO> {
		const user = await this.user.getUser(workspace.ownerId);
		if (!user) {
			console.log(
				`Owner with ID: ${workspace.ownerId} not found. Cannot create workspace.`
			);
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

		const roleManager = this.getRoleManager(newWorkspace.subscription);
		await roleManager.seedWorkspaceRoles(newWorkspace.id);
		const ownerRole = await roleManager.getPredefinedRole(
			newWorkspace.id,
			"owner"
		);
		if (!ownerRole) {
			throw new Error(`Owner role not found for workspace ${newWorkspace.id}.`);
		}

		const ownerMember: IMemberDTO = {
			userId: workspace.ownerId,
			id: ID.memberId(),
			workspaceId: newWorkspace.id,
			name: `${user.name} Owner`,
			role: ownerRole.key,
			roleId: ownerRole.id,
			createdAt: new Date(),
			updatedAt: null,
		};

		await this.memberStore.save(ownerMember);
		await roleManager.assignRoleToMember(
			String(ownerMember.id),
			newWorkspace.id,
			ownerRole.id,
			"system"
		);

		await this.notificationService.createWorkspaceNotification({
			workspaceName: newWorkspace.name,
			type: "workspace_created",
			memberID: ownerMember.id,
			userId: workspace.ownerId,
			workspaceId: newWorkspace.id,
		});

		return newWorkspace;
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

		const roleManager = this.getRoleManager(workspaceDetail.subscription);
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
			memberID: memberId,
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

			const roleManager = this.getRoleManager(workspace.subscription);
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
				`Error approving join request: ${(error as Error).message}`,
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

			const roleManager = this.getRoleManager(workspace.subscription);
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
				`Error rejecting join request: ${(error as Error).message}`,
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

			const list = await this.memberStore.list();
			const workspaceMembers = list.filter(
				(member: IMemberDTO) => member.workspaceId === workspaceId
			);

			return this.sorting.sortByName(workspaceMembers, "asc");
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

		const roleManager = this.getRoleManager(workspace.subscription);
		const targetRole = await roleManager.getMemberRole(
			String(memberId),
			workspaceId
		);
		if (targetRole?.key === "owner") {
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

		await this.roleStore.removeMemberRole(String(memberId), workspaceId);
		await this.memberStore.delete(memberId);

		await this.notificationService.createMemberNotification({
			type: "member_removed",
			memberID: memberId,
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

		const members = await this.memberStore.list();
		const memberDetails = members.find(
			(member) => member.userId === userID && member.workspaceId === workspaceId
		);

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

	async changeMemberRole(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId,
		newRoleId: TRoleId,
		changedBy: TMemberId
	): Promise<void> {
		const workspace = await this.findWorkspaceById(workspaceId);
		if (!workspace) {
			throw new Error(`Workspace with ID: ${workspaceId} not found.`);
		}

		const targetMember = await this.memberStore.findById(memberId);
		const actor = await this.memberStore.findById(changedBy);
		if (!targetMember || !actor) {
			throw new Error("Member not found.");
		}

		const roleManager = this.getRoleManager(workspace.subscription);
		const permission = await roleManager.hasPermission(
			actor.roleId,
			"manage_roles:workspace"
		);
		if (!permission.hasPermission) {
			throw new Error(
				permission.reason ||
					"You do not have permission to manage member roles."
			);
		}

		const nextRole = await roleManager.getRole(newRoleId);
		if (!nextRole || nextRole.workspaceId !== workspaceId) {
			throw new Error(
				`Role with ID ${String(newRoleId)} not found in workspace ${workspaceId}.`
			);
		}

		if (targetMember.role === "owner" && nextRole.key !== "owner") {
			throw new Error("Workspace owner role cannot be changed.");
		}

		await this.memberStore.update(memberId, {
			role: nextRole.key,
			roleId: nextRole.id,
			updatedAt: new Date(),
		});

		await roleManager.assignRoleToMember(
			String(memberId),
			workspaceId,
			nextRole.id,
			String(changedBy)
		);
	}

	async bulkAssignRole(
		workspaceId: IWorkspaceDTO["id"],
		memberIds: readonly TMemberId[],
		roleId: TRoleId,
		assignedBy: TMemberId
	): Promise<void> {
		const workspace = await this.findWorkspaceById(workspaceId);
		if (!workspace) {
			throw new Error(`Workspace with ID: ${workspaceId} not found.`);
		}

		if (
			!ROLE_LIMITS_BY_SUBSCRIPTION[workspace.subscription].canUseBulkOperations
		) {
			throw new Error("Bulk role assignment is not available on this plan.");
		}

		const actor = await this.memberStore.findById(assignedBy);
		if (!actor) {
			throw new Error("Requester not found.");
		}

		const roleManager = this.getRoleManager(workspace.subscription);
		const permission = await roleManager.hasPermission(
			actor.roleId,
			"manage_roles:workspace"
		);
		if (!permission.hasPermission) {
			throw new Error(
				permission.reason || "You do not have permission to bulk assign roles."
			);
		}

		const nextRole = await roleManager.getRole(roleId);
		if (!nextRole || nextRole.workspaceId !== workspaceId) {
			throw new Error(
				`Role with ID ${String(roleId)} not found in workspace ${workspaceId}.`
			);
		}

		for (const candidateMemberId of memberIds) {
			const candidateMember =
				await this.memberStore.findById(candidateMemberId);
			if (candidateMember?.role === "owner" && nextRole.key !== "owner") {
				throw new Error("Workspace owner role cannot be changed.");
			}
		}

		const result = await roleManager.bulkAssignRole({
			workspaceId,
			memberIds: memberIds.map((id) => String(id)),
			roleId,
			assignedBy: String(assignedBy),
		});

		for (const memberId of result.successful) {
			await this.memberStore.update(memberId as unknown as TMemberId, {
				role: nextRole.key,
				roleId: nextRole.id,
				updatedAt: new Date(),
			});
		}

		if (result.failureCount > 0) {
			console.warn(
				`Bulk role assignment completed with ${result.failureCount} failures.`
			);
		}
	}

	async createCustomRole(
		workspaceId: IWorkspaceDTO["id"],
		name: string,
		permissions: readonly TPermission[],
		createdBy: TMemberId,
		options?: { description?: string; parentRoleId?: TRoleId }
	): Promise<IRoleValidationResult> {
		const workspace = await this.findWorkspaceById(workspaceId);
		if (!workspace) {
			return {
				success: false,
				code: "ROLE_NOT_FOUND",
				message: `Workspace with ID: ${workspaceId} not found.`,
			};
		}

		if (
			!ROLE_LIMITS_BY_SUBSCRIPTION[workspace.subscription].canCreateCustomRoles
		) {
			return {
				success: false,
				code: "CUSTOM_ROLES_NOT_ALLOWED",
				message: `${workspace.subscription} plan does not support custom roles.`,
			};
		}

		const creator = await this.memberStore.findById(createdBy);
		if (!creator) {
			return {
				success: false,
				code: "INSUFFICIENT_PERMISSION",
				message: "Requester not found.",
			};
		}

		const roleManager = this.getRoleManager(workspace.subscription);
		const permission = await roleManager.hasPermission(
			creator.roleId,
			"manage_roles:workspace"
		);
		if (!permission.hasPermission) {
			return {
				success: false,
				code: "INSUFFICIENT_PERMISSION",
				message:
					permission.reason ||
					"You do not have permission to create custom roles.",
			};
		}

		return roleManager.createCustomRole(
			workspaceId,
			name,
			permissions,
			options
		);
	}

	async checkMemberPermission(
		workspaceId: IWorkspaceDTO["id"],
		memberId: TMemberId,
		permission: TPermission
	): Promise<boolean> {
		const workspace = await this.findWorkspaceById(workspaceId);
		if (!workspace) {
			return false;
		}

		const member = await this.memberStore.findById(memberId);
		if (!member) {
			return false;
		}

		const roleManager = this.getRoleManager(workspace.subscription);
		const result = await roleManager.hasPermission(member.roleId, permission);
		return result.hasPermission;
	}
}
