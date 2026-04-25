import { Input } from "@collaro/utils/omit";
import { IParticipantStore } from "./stores";
import { IMemberDTO } from "@collaro/workspace/role/member";
import { TMeetingId, TMemberId, TWorkspaceId } from "@collaro/utils";

export enum MeetingType {
	team = "Team Meeting",
	private = "Private Meeting",
}

export type meetingStatus = "Active" | "Not Started" | "Cancelled" | "Ended";

export type TMeeting = "Instant" | "Scheduled";

export interface IMeetingDTO<T> {
	meetingType: TMeeting;
	participants: Record<string, string>;
	id: TMeetingId;
	title: string;
	createdBy: T;
	status: meetingStatus;
	description: string;
	startTime: Date;
	endTime: Date | null;
	createdAt: Date;
	aiAssistantEnabled?: boolean; // Enable AI note-taker and action item extraction
}

export interface IWorkspaceMeetingDTO extends IMeetingDTO<TMemberId> {
	workspaceId: TWorkspaceId;
}

export interface IMeeting<T> {
	meeting: IMeetingDTO<T>;

	// methods
	createMeeting(meeting: T): void;
	getMeeting(id: TMeetingId): T | null;
	updateMeeting(id: TMeetingId, meeting: Partial<T>): void;
	deleteMeeting(id: TMeetingId): void;
}

export type TeamMeetingDTO = IMeetingDTO<TMemberId> & {
	workspaceId: TWorkspaceId;
} & { callerDetail: IMemberDTO };

export interface IWorkspaceMeeting {
	meeting: IWorkspaceMeetingDTO;
	participantStore: IParticipantStore;

	// methods
	createMeeting(input: Input<TeamMeetingDTO>, name: string): void;
	getMeeting(id: TMeetingId): IWorkspaceMeetingDTO | null;
	updateMeeting(id: TMeetingId, meeting: Partial<IWorkspaceMeetingDTO>): void;
	deleteMeeting(id: TMeetingId): void;
}
