import { randomUUIDv7 } from "bun";
import * as T from "./type";

function generateId<T>(): T {
	const createdAt = new Date().getTime();
	const str = randomUUIDv7("hex", createdAt);
	return str as unknown as T;
}

export class ID {
	static userId(): T.TUserId {
		const prefix = "usr_";
		const id = generateId<T.TUserId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TUserId;
	}

	static workspaceId(): T.TWorkspaceId {
		const prefix = "wks_";
		const id = generateId<T.TWorkspaceId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TWorkspaceId;
	}

	static memberId(): T.TMemberId {
		const prefix = "mbr_";
		const id = generateId<T.TMemberId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TMemberId;
	}

	static meetingId(): T.TMeetingId {
		const prefix = "mtg_";
		const id = generateId<T.TMeetingId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TMeetingId;
	}

	static notificationId(): T.TNotificationId {
		const prefix = "ntf_";
		const id = generateId<T.TNotificationId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TNotificationId;
	}

	static requestId(): T.TRequestId {
		const prefix = "req_";
		const id = generateId<T.TRequestId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TRequestId;
	}

	static roleId(wSlug: string): T.TRoleId {
		const prefix = `rle_${wSlug.slice(0, 8)}_`;
		const id = generateId<T.TRoleId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TRoleId;
	}

	static voiceAgentId(): T.TVoiceAgentId {
		const prefix = "vag_";
		const id = generateId<T.TVoiceAgentId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TVoiceAgentId;
	}

	static actionID(): T.TActionItemId {
		const prefix = "act_";
		const id = generateId<T.TActionItemId>();
		const result = `${prefix}${id}`.slice(0, 32);
		return result as unknown as T.TActionItemId;
	}
}

export function generateWorkspaceSlug(input: string): string {
	return input.toLowerCase().replace(/\s+/g, "-");
}

export function generateUserName(input: string): string {
	return input.toLowerCase().replace(/\s+/g, "");
}

export function createMeetingLink(meetingId: T.TMeetingId): string {
	return `https://collaro.com/meetings/${meetingId}`;
}
