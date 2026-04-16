import { INotificationDTO, INotification, TNotificationId } from "./interface";
import { notificationStore } from "./notification-store";

export abstract class Notification implements INotification {
  notification: INotificationDTO = {} as INotificationDTO;

  async createNotification(notification: INotificationDTO): Promise<INotificationDTO> {
    await notificationStore.create(notification);
    return Promise.resolve(this.notification);
  };
  
  async markAsRead(notificationId: TNotificationId): Promise<boolean> {
    const result = await notificationStore.markAsRead(notificationId);
    return Promise.resolve(result);
  };

  async getNotificationsforUser(userId: INotificationDTO["userId"]): Promise<INotificationDTO[]> {
    const notifications = await notificationStore.queryNotifications({ userId });
    return Promise.resolve(notifications);
  };
}