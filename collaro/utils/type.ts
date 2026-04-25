type BRAND<K extends string> = {  __brand: K; };

export type TUserId = BRAND<"UserId">;

export type TWorkspaceId = BRAND<"WorkspaceId">;

export type TMemberId = BRAND<"MemberId">;

export type TRoleId = BRAND<"RoleId">;

export type TMeetingId = BRAND<"MeetingId">;

export type TActionItemId = BRAND<"ActionItemId">;

export type TVoiceAgentId = BRAND<"VoiceAgentId">;

export type TNotificationId = BRAND<"NotificationId">;

export type TRequestId = BRAND<"RequestId">;