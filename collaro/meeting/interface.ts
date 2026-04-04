import { TWorkspaceId } from "../workspace";
import { BRAND } from "@collaro/utils/brand";
import { Input } from "@collaro/utils/omit";
import { IParticipantStore } from "./stores";
import { TMemberId } from "@collaro/member";

export type TMeetingId = BRAND<"MeetingId">;
export type { TWorkspaceId };

export enum MeetingType {
  team = "Team Meeting",
  private = "Private Meeting",
}

export type meetingStatus = "Scheduled" | "Ongoing" | "Completed" | "Cancelled";

export type TParicipants<T> = Record<string, T>;

export interface IMeetingDTO<T> {
  participants: TParicipants<T>;
  id: TMeetingId;
  title: string;
  createdBy: T;
  status: meetingStatus;
  description: string;
  startTime: Date;
  endTime: Date | null;
  createdAt: Date;
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

export type TeamMeetingDTO = IMeetingDTO<TMemberId> & { workspaceId: TWorkspaceId };

export interface IWorkspaceMeeting {
  meeting: IWorkspaceMeetingDTO;
  participantStore: IParticipantStore;

  // methods
  createMeeting(input: Input<TeamMeetingDTO>, name: string): void;
  getMeeting(id: TMeetingId): IWorkspaceMeetingDTO | null;
  updateMeeting(id: TMeetingId, meeting: Partial<IWorkspaceMeetingDTO>): void;
  deleteMeeting(id: TMeetingId): void;
}