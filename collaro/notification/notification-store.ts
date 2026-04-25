import { TNotificationId } from "@collaro/utils";
import {
	GetNotificationQuery,
	INotificationStore,
	INotificationDTO,
} from "./interface";

const globalNotifications: INotificationDTO[] = [];

class NotificationStore implements INotificationStore {
	notification: INotificationDTO = {} as INotificationDTO;
	private static instance: NotificationStore;

	static getInstance(): NotificationStore {
		if (!NotificationStore.instance) {
			NotificationStore.instance = new NotificationStore();
		}
		return NotificationStore.instance;
	}

	constructor() {
		if (NotificationStore.instance) {
			throw new Error(
				"Use NotificationStore.getInstance() to get the singleton instance."
			);
		}
	}

	async create(notification: INotificationDTO): Promise<INotificationDTO> {
		globalNotifications.push(notification);
		return Promise.resolve(notification);
	}

	async markAsRead(notificationId: TNotificationId): Promise<boolean> {
		const notification = await this.findById(notificationId);

		if (!notification) {
			console.log("Notification not found:", notificationId);
			return Promise.resolve(false);
		}

		return Promise.resolve(true);
	}

	async findById(
		notificationId: TNotificationId
	): Promise<INotificationDTO | null> {
		const notification = globalNotifications.find(
			(n) => n.id === notificationId
		);
		return Promise.resolve(notification || null);
	}

	async queryNotifications(
		query: GetNotificationQuery
	): Promise<INotificationDTO[]> {
		const whereclause = [];

		if (query.userId) {
			whereclause.push(`userId: ${query.userId}`);
		}

		if (query.workspaceId) {
			whereclause.push(`workspaceId: ${query.workspaceId}`);
		}

		if (query.memberId) {
			whereclause.push(`memberId: ${query.memberId}`);
		}

		const filteredNotifications = globalNotifications.filter((notification) => {
			if (query.userId && notification.userId !== query.userId) {
				return false;
			}

			if (query.workspaceId && notification.workspaceId !== query.workspaceId) {
				return false;
			}

			if (query.memberId && notification.memberId !== query.memberId) {
				return false;
			}

			return true;
		});

		return Promise.resolve(filteredNotifications);
	}
}

export const notificationStore = NotificationStore.getInstance();
