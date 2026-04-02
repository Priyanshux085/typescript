declare type Brand<K, T> = K & { __brand: T };

export type UserId = Brand<string, "UserId">;

export type WorkspaceId = Brand<string, "WorkspaceId">;

export type MemberId = Brand<string, "MemberId">;