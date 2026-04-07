import { TMeetingId, TWorkspaceId } from "@collaro/meeting";
import { TMemberId } from "@collaro/member";
import { TNotificationId } from "@collaro/notification/interface";
import { TUserId } from "@collaro/user";
import { TRequestId } from "@collaro/workspace/member-request/interface";
import { randomUUIDv7 } from "bun";

function generateId<T>(): T {
  const createdAt = new Date().getTime();
  const str = randomUUIDv7("hex", createdAt);
  return str as unknown as T;
}

export class ID {
  static userId(): TUserId {
    const prefix = "usr_";
    const id = generateId<TUserId>();
    const result = `${prefix}${id}`.slice(0, 32);
    return result as unknown as TUserId;
  }

  static workspaceId(): TWorkspaceId {
    const prefix = "wks_";
    const id = generateId<TWorkspaceId>();
    const result = `${prefix}${id}`.slice(0, 32);
    return result as unknown as TWorkspaceId;
  }

  static memberId(): TMemberId {
    const prefix = "mbr_";
    const id = generateId<TMemberId>();
    const result = `${prefix}${id}`.slice(0, 32);
    return result as unknown as TMemberId;
  }

  static meetingId(): TMeetingId {
    const prefix = "mtg_";
    const id = generateId<TMeetingId>();
    const result = `${prefix}${id}`.slice(0, 32);
    return result as unknown as TMeetingId;
  }

  static notificationId(): TNotificationId {
    const prefix = "ntf_";
    const id = generateId<TNotificationId>();
    const result = `${prefix}${id}`.slice(0, 32);
    return result as unknown as TNotificationId;
  }

  static requestId(): TRequestId {
    const prefix = "req_";
    const id = generateId<TRequestId>();
    const result = `${prefix}${id}`.slice(0, 32);
    return result as unknown as TRequestId;
  }
}

export function generateWorkspaceSlug(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '-');
}

export function generateUserName(input: string): string {
  return input.toLowerCase().replace(/\s+/g, '');
}
