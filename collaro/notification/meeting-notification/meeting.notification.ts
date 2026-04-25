import { IUserDTO } from "@collaro/user";
import {
	INotification,
	INotificationDTO,
	INotificationStore,
} from "../interface";
import { notificationStore } from "../notification-store";
import { ID, TNotificationId } from "@collaro/utils";

type TNotification = "meeting_created" | "meeting_updated" | "meeting_cancelled" | "meeting_reminder" | "meeting_rescheduled";
 
interface IMeetingNotificationDTO extends INotificationDTO {
  type: TNotification;
  meetingLink: string;
}

type TCreateNotificationInput = Omit<IMeetingNotificationDTO, "id" | "createdAt" | "updatedAt" | "read" | "message">;

interface IMeetingNotification extends INotification<IMeetingNotificationDTO, TCreateNotificationInput> {
  createNotification(notification: TCreateNotificationInput): Promise<INotificationDTO>;

  markAsRead(notificationId: TNotificationId): Promise<boolean>;

  listNotifications(userId: IUserDTO["id"]): Promise<INotificationDTO[]>;
}

export const mapNotificationTypeToMessage = (type: TNotification, meetingLink: string, meetingDate: Date): string => {
  switch(type) {
    case "meeting_created":
      return "A new meeting has been created." + "\n" + "Meeting Link: " + meetingLink + "\n" + "Meeting Date: " + meetingDate.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "long" });
    case "meeting_updated":
      return "A meeting has been updated." + "\n" + "Meeting Link: " + meetingLink + "\n" + "Meeting Date: " + meetingDate.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "long" });
    case "meeting_cancelled":
      return "A meeting has been cancelled." + "\n" + "Meeting Link: " + meetingLink + "\n" + "On Meeting Date: " + meetingDate.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "long" });
    case "meeting_reminder":
      return "This is a reminder for your upcoming meeting." + "\n" + "Meeting Link: " + meetingLink + "\n" + "Meeting Date: " + meetingDate.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "long" });
    case "meeting_rescheduled":
      return "A meeting has been rescheduled." + "\n" + "Meeting Link: " + meetingLink + "\n" + "New Meeting Date and Time: " + meetingDate.toLocaleString("en-IN", { dateStyle: "full", timeStyle: "long" });
    default:
      return "You have a new meeting notification.";
  }
};

export class MeetingNotification implements IMeetingNotification {  
  static instance: MeetingNotification;
  notification: IMeetingNotificationDTO = {} as IMeetingNotificationDTO;
  store: INotificationStore = notificationStore;
  workspaceStore: INotificationStore = notificationStore;

  public static getInstance(): MeetingNotification {
    if (!MeetingNotification.instance) {
      MeetingNotification.instance = new MeetingNotification();
    }
    return MeetingNotification.instance;
  }

  private constructor(){
    if (MeetingNotification.instance) {
      throw new Error("Use MeetingNotification.getInstance() to get the singleton instance.");
    }
  }

  async createNotification(notification: TCreateNotificationInput): Promise<INotificationDTO> {
    const notifacationId = ID.notificationId();
    const notificationMeetingDate = new Date();
    const notifacationMessage = mapNotificationTypeToMessage(notification.type, notification.meetingLink, notificationMeetingDate);

    return await this.store.create({
			...notification,
			id: notifacationId,
			message: notifacationMessage,
			read: false,
			createdAt: notificationMeetingDate,
		});
  }

  async listNotifications(userId: IUserDTO["id"]): Promise<INotificationDTO[]> {
    try {
      return await this.store.queryNotifications({ userId });
    } catch (error: unknown) {
      throw new Error("Failed to list notifications: ", {
        cause: error,
      });
    }
  }

  async markAsRead(notificationId: TNotificationId): Promise<boolean> {
    try {
      return await this.store.markAsRead(notificationId);
    } catch (error: unknown) {
      throw new Error("Failed to mark notification as read: ", {
        cause: error,
      });
    }
  }
}