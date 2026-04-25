import { IMemberDTO } from "@collaro/workspace/role/member";
import { IMeetingDTO, meetingStatus } from "..";
import { Input } from "@collaro/utils/omit";
import { IRoleDTO } from "@collaro/workspace/role";
import { TMeetingId, TMemberId } from "@collaro/utils";

export interface IMeetingStore<T> {
	save(meeting: IMeetingDTO<T>): Promise<void>;
	findById(id: TMeetingId): Promise<IMeetingDTO<T> | null>;
	findByStatus(status: meetingStatus): Promise<IMeetingDTO<T>[]>;
	update(id: TMeetingId, meeting: Partial<IMeetingDTO<T>>): Promise<void>;
	delete(id: TMeetingId): Promise<void>;
	list(): Promise<IMeetingDTO<T>[]>;
}

export interface IParticipantDTO {
	meetingId: TMeetingId;
	memberId: TMemberId;
	name: string;
	role: IRoleDTO["name"];
	joinedAt: Date;
	leaveAt: Date | null;
}

export interface IParticipantStore {
	member: IMemberDTO;

	addParticipant(participant: Input<IParticipantDTO>): Promise<void>;
	removeParticipant(meetingId: TMeetingId): Promise<void>;
	listParticipants(meetingId: TMeetingId): Promise<IParticipantDTO[]>;
	endMeetingForParticipant(meetingId: TMeetingId): Promise<void>;
}
