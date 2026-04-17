import { IMember, IMemberDTO, TMemberId } from "@collaro/workspace/member";
import { IMeetingDTO, TMeetingId } from "..";
import { Input } from "@collaro/utils/omit";

export interface IMeetingStore<T> {
	save(meeting: IMeetingDTO<T>): Promise<void>;
	findById(id: TMeetingId): Promise<IMeetingDTO<T> | null>;
	update(id: TMeetingId, meeting: Partial<IMeetingDTO<T>>): Promise<void>;
	delete(id: TMeetingId): Promise<void>;
	list(): Promise<IMeetingDTO<T>[]>;
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

	addParticipant(participant: Input<IParticipantDTO>): Promise<void>;
	removeParticipant(meetingId: TMeetingId): Promise<void>;
	listParticipants(meetingId: TMeetingId): Promise<IParticipantDTO[]>;
	endMeetingForParticipant(meetingId: TMeetingId): Promise<void>;
}
