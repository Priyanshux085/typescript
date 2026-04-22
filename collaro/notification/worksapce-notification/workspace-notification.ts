import { ID } from "@collaro/utils/generate";
import {
	INotification,
	INotificationDTO,
	INotificationStore,
} from "../interface";
import { notificationStore } from "../notification-store";
import { IUserDTO } from "@collaro/user";
import { IWorkspaceDTO } from "@collaro/workspace";

// const WorkspaceNotificationMessageMap: Map<string, string> = new Map([
  //   ["workspace_created", "A new workspace has been created."],
  //   ["workspace_updated", "A workspace has been updated."],
  //   ["workspace_deleted", "A workspace has been deleted."],
  //   ["workspace_joined", "You have joined a new workspace."],
  //   ["workspace_left", "You have left a workspace."],
  //   ["settings_updated", "Workspace settings have been updated."],
  //   ["logo_updated", "Workspace logo has been updated."],
  // ]);
  
type TWorkspaceNotificationType = "workspace_created" | "workspace_updated" | "workspace_deleted" | "workspace_joined" | "workspace_left" | "settings_updated" | "logo_updated";

interface IWorkspaceNotificationDTO extends INotificationDTO {
  workspaceName: IWorkspaceDTO["name"];
  userName?: IUserDTO["name"];
  type: TWorkspaceNotificationType;
}

function WorkspaceNotificationMessage(type: TWorkspaceNotificationType, workspaceName: string, userName?: string): string {
  switch (type) {
    case "workspace_created": 
      return `A new Workspace ` + workspaceName + " has been created by You.";
    case "workspace_updated":
      return "Workspace " + workspaceName + " has been updated by " + userName + ".";
    case "workspace_deleted":
      return "Workspace " + workspaceName + " has been deleted.";
    case "workspace_joined": 
      return "User " + userName + " has joined the workspace " + workspaceName + ".";
    case "workspace_left":
      return "User " + userName + " has left the workspace " + workspaceName + ".";
    case "settings_updated":
      return "Settings for workspace " + workspaceName + " have been updated.";
    case "logo_updated":
      return "Logo for workspace " + workspaceName + " has been updated.";
    default:
      return "You have a new notification.";
  }
}

type TMemberNotificationType = "join_request" | "request_approved" | "request_rejected" | "role_changed" | "member_banned" | "member_removed";

interface IMemberNotificationDTO extends INotificationDTO {
  type: TMemberNotificationType;
  userName: IUserDTO["name"];
  workspaceName: IWorkspaceDTO["name"];
}

function MemberNotificationMessage(type: TMemberNotificationType, userName: string, workspaceName: string): string {
  switch (type) {
    case "join_request":
      return "You have a new join request from " + userName + ".";
    case "request_approved":
      return "Your join request to the workspace " + workspaceName + " has been approved.";
    case "request_rejected":
      return "Your join request to the workspace " + workspaceName + " has been rejected.";
    case "role_changed":
      return "Your role in the workspace " + workspaceName + " has been changed.";
    case "member_banned":
      return "You have been banned from the workspace " + workspaceName + ".";
    case "member_removed":
      return "You have been removed from the workspace " + workspaceName + ".";
    default:
      return "You have a new notification.";
  }
}

type ICreateWorkspaceNotificationInput = Omit<
	IWorkspaceNotificationDTO,
	"id" | "message" | "createdAt" | "updatedAt" | "read"
>;

type ICreateMemberNotificationInput = Omit<
	IMemberNotificationDTO,
	"id" | "message" | "createdAt" | "updatedAt" | "read"
>;

export class WorkspaceNotification implements INotification<
	INotificationDTO,
	ICreateWorkspaceNotificationInput | ICreateMemberNotificationInput
> {
	private static instance: WorkspaceNotification;
	store: INotificationStore = notificationStore;
	notification: INotificationDTO = {} as INotificationDTO;

	private constructor() {
		if (WorkspaceNotification.instance) {
			throw new Error(
				"Use WorkspaceNotification.getInstance() to get the singleton instance."
			);
		}
	}

	public static getInstance(): WorkspaceNotification {
		if (!WorkspaceNotification.instance) {
			WorkspaceNotification.instance = new WorkspaceNotification();
		}

		return WorkspaceNotification.instance;
	}

	async createNotification(
		notification:
			| ICreateWorkspaceNotificationInput
			| ICreateMemberNotificationInput
	): Promise<INotificationDTO> {
		// if the type is workspace notification, then create a workspace notification, else create a member notification
		if ("workspaceName" in notification) {
			return await this.createWorkspaceNotification(
				notification as ICreateWorkspaceNotificationInput
			);
		} else {
			return await this.createMemberNotification(
				notification as ICreateMemberNotificationInput
			);
		}
	}

	async createWorkspaceNotification(
		input: ICreateWorkspaceNotificationInput
	): Promise<INotificationDTO> {
		try {
			const message =
				WorkspaceNotificationMessage(
					input.type,
					input.workspaceName,
					input.userName
				) || "";

			const dto: INotificationDTO = {
				...input,
				id: ID.notificationId(),
				message,
				read: false,
				createdAt: new Date(),
			};

			await this.store.create({ ...dto });

			return dto;
		} catch (error: unknown) {
			console.error("Error creating notification:", error);
			throw error;
		}
	}

	async createMemberNotification(
		input: Omit<
			IMemberNotificationDTO,
			"id" | "message" | "createdAt" | "updatedAt" | "read"
		>
	): Promise<INotificationDTO> {
		try {
			const message =
				MemberNotificationMessage(
					input.type,
					input.userName,
					input.workspaceName
				) || "";

			const dto: INotificationDTO = {
				...input,
				id: ID.notificationId(),
				message,
				read: false,
				createdAt: new Date(),
			};

			// Save the notification to the store
			await this.store.create({
				...dto,
			});

			return dto;
		} catch (error: unknown) {
			console.error("Error creating member notification:", error);
			throw error;
		}
	}

	async markAsRead(notificationId: INotificationDTO["id"]): Promise<boolean> {
		try {
			return await this.store.markAsRead(notificationId);
		} catch (error: unknown) {
			console.error("Error marking notification as read:", error);
			throw error;
		}
	}

	async listNotifications(
		userId: INotificationDTO["userId"]
	): Promise<INotificationDTO[]> {
		try {
			return await this.store.queryNotifications({ userId });
		} catch (error: unknown) {
			console.error("Error listing notifications:", error);
			throw error;
		}
	}
}

export const workspaceNotification = WorkspaceNotification.getInstance();