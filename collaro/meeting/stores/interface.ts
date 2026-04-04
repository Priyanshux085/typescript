import { IMember, IMemberDTO, TMemberId } from "@collaro/member";
import { IMeetingDTO, TMeetingId } from "..";
import { Input } from "@collaro/utils/omit";

export interface IMeetingStore<T> {
  save(meeting: IMeetingDTO<T>): void;
  findById(id: TMeetingId): IMeetingDTO<T> | null;
  update(id: TMeetingId, meeting: Partial<IMeetingDTO<T>>): void;
  delete(id: TMeetingId): void;
  list(): IMeetingDTO<T>[];
}

export interface IParticipantDTO {
  meetingId: TMeetingId;
  memberId: TMemberId;
  name: string;
  role: IMemberDTO["role"];
  joinedAt: Date;
  leaveAt: Date | null;
}

export interface IParticipantStore {
  member: IMember;

  addParticipant(participant: Input<IParticipantDTO>): void;
  removeParticipant(meetingId: TMeetingId): void;
  listParticipants(meetingId: TMeetingId): IParticipantDTO[];
  endMeetingForParticipant(meetingId: TMeetingId): void;
}
