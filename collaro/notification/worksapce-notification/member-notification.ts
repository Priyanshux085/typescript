import { ID } from "@collaro/utils/generate";
import { INotificationDTO, INotificationStore, TNotificationId } from "../interface";
import { notificationStore } from "../notification-store";

type NotificationType = "join_request" | "approve_request" | "workspace_update" | "general";

export const mapNotificationTypeToMessage = (type: NotificationType): string => {
  switch(type) {
    case "join_request":
      return "You have a new join request.";
    case "approve_request":
      return "Your join request has been approved.";
    case "workspace_update":
      return "There is an update in your workspace.";
    case "general":
      return "You have a new notification.";
    default:
      return "You have a new notification.";
  }
};

type CreateNotificationInput = {
	type: NotificationType;
	userId: INotificationDTO["userId"];
	workspaceId: INotificationDTO["workspaceId"];
	memberId: INotificationDTO["memberId"];
};

class WorkspaceMemberNotification {
  private static instance: WorkspaceMemberNotification;
  store: INotificationStore = notificationStore

  static getInstance(): WorkspaceMemberNotification {
    if (!WorkspaceMemberNotification.instance) {
      WorkspaceMemberNotification.instance = new WorkspaceMemberNotification();
    }
    return WorkspaceMemberNotification.instance;
  }

  constructor() {
    if (WorkspaceMemberNotification.instance) {
      throw new Error("Use WorkspaceMemberNotification.getInstance() to get the singleton instance.");
    }
  }

  async createNotification(input: CreateNotificationInput): Promise<INotificationDTO> {
    const message = mapNotificationTypeToMessage(input.type);

    const notification: INotificationDTO = {
			...input,
			id: ID.notificationId(),
			message,
			read: false,
			createdAt: new Date(),
		};

    await this.store.create({
			...notification,
		});

    return Promise.resolve(notification);
  }

  async markAsRead(notificationId: TNotificationId): Promise<boolean> {
    const notification = await this.store.findById(notificationId);

    if(!notification) {
      console.log("Notification not found:", notificationId);
      return Promise.resolve(false);
    }

    const result = await this.store.markAsRead(notificationId);
    
    return Promise.resolve(result);
  }

  async getNotificationsforUser(userId: INotificationDTO["userId"]): Promise<INotificationDTO[]> {
    const notifications = await this.store.queryNotifications({ userId });
    return Promise.resolve(notifications);
  }
}

export const workspaceMemberNotification = WorkspaceMemberNotification.getInstance();