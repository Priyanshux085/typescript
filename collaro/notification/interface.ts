import { IMemberDTO } from "@collaro/workspace/role/member";
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
	memberId?: IMemberDTO["id"];
	read: boolean;
	createdAt: Date;
}

export interface INotification<T extends INotificationDTO, TInput> {
	notification: T;

	createNotification(notification: TInput): Promise<INotificationDTO>;

	markAsRead(notificationId: TNotificationId): Promise<boolean>;

	listNotifications(userId: IUserDTO["id"]): Promise<INotificationDTO[]>;
}

export type GetNotificationQuery = {
	workspaceId?: IWorkspaceDTO["id"];
	userId?: IUserDTO["id"];
	memberId?: IMemberDTO["id"];
};

export interface INotificationStore {
	notification: INotificationDTO;

	create(notification: INotificationDTO): Promise<INotificationDTO>;

	markAsRead(notificationId: TNotificationId): Promise<boolean>;

	findById(notificationId: TNotificationId): Promise<INotificationDTO | null>;

	queryNotifications(query: GetNotificationQuery): Promise<INotificationDTO[]>;
}
