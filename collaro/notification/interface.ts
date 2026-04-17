import { IMemberDTO } from "@collaro/workspace/member";
import { IUserDTO } from "@collaro/user";
import { BRAND } from "@collaro/utils/brand";
import { IWorkspaceDTO } from "@collaro/workspace";

export type TNotificationId = BRAND<"notification_id">;

export interface INotificationDTO {
	id: TNotificationId;
	type: string;
	message: string;
	userId: IUserDTO["id"];
	workspaceId: IWorkspaceDTO["id"];
	memberID?: IMemberDTO["id"];
	read: boolean;
	createdAt: Date;
	updatedAt: Date | null;
}

export interface INotification {
	notification: INotificationDTO;

	createNotification(notification: INotificationDTO): Promise<INotificationDTO>;

	markAsRead(notificationId: TNotificationId): Promise<boolean>;

	getNotificationsforUser(userId: IUserDTO["id"]): Promise<INotificationDTO[]>;
}

export type GetNotificationQuery = {
	workspaceId?: IWorkspaceDTO["id"];
	userId?: IUserDTO["id"];
	memberID?: IMemberDTO["id"];
};

export interface INotificationStore {
	notification: INotificationDTO;

	create(notification: INotificationDTO): Promise<INotificationDTO>;

	markAsRead(notificationId: TNotificationId): Promise<boolean>;

	findById(notificationId: TNotificationId): Promise<INotificationDTO | null>;

	queryNotifications(query: GetNotificationQuery): Promise<INotificationDTO[]>;
}
