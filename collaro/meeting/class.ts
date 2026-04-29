import { Input } from "@collaro/utils/omit";
import {
	IMeetingDTO,
	IWorkspaceMeetingDTO,
	IMeetingStore,
	IParticipantStore,
	TeamMeetingDTO,
	IParticipantDTO,
} from "./index";
import {
	ID,
	type TMeetingId,
	type TUserId,
	type TWorkspaceId,
	type TMemberId,
} from "@collaro/utils";
import { IMemberDTO } from "@collaro/workspace/role/member";
import { IUserDTO } from "@collaro/user";
import { inject, Injectable } from "@collaro/di";

export type TMeetingInput<T> = Omit<Input<T>, "participants"> & {
	callerDetail: IMemberDTO | IUserDTO;
};

abstract class MeetingBase<T, TMeetingInput = T> {
	abstract createMeeting(input: TMeetingInput): T;
	abstract getMeeting(id: TMeetingId): T | null;
	abstract updateMeeting(id: TMeetingId, data: Partial<T>): void;
	abstract deleteMeeting(id: TMeetingId): void;
}

type PrivateMeetingDTO = IMeetingDTO<TUserId>;

@Injectable()
export class PrivateMeeting extends MeetingBase<PrivateMeetingDTO> {
	store: IMeetingStore<TUserId>;
	meeting: PrivateMeetingDTO = {} as PrivateMeetingDTO;

	constructor() {
		super();
		this.store = inject<IMeetingStore<TUserId>>("MemoryMeetingStore");
	}

	createMeeting(
		input: PrivateMeetingDTO & { callerDetail: IUserDTO }
	): PrivateMeetingDTO {
		if (input.startTime < new Date()) {
			throw new Error("Cannot create a meeting in the past");
		}

		this.store.save(input);
		this.meeting = input;
		return input;
	}

	getMeeting(id: TMeetingId): PrivateMeetingDTO | null {
		const meeting = this.store.findById(id);
		if (!meeting) {
			return null;
		}
		this.meeting = meeting as unknown as PrivateMeetingDTO;
		return this.meeting;
	}

	deleteMeeting(id: TMeetingId): void {
		const meeting = this.getMeeting(id);
		if (meeting && meeting.status !== "Ended") {
			throw new Error("Cannot delete an active or scheduled meeting");
		}
		this.store.delete(id);
		this.meeting = {} as PrivateMeetingDTO;
	}

	updateMeeting(
		id: TMeetingId,
		data: Partial<PrivateMeetingDTO>
	): void {
		const current = this.getMeeting(id);
		if (current) {
			if (data.status && current.status === "Ended" && data.status !== "Ended") {
				throw new Error("Cannot reopen an ended meeting");
			}
		}
		this.store.update(id, data);
	}

	canJoin(userId: TUserId): boolean {
		return this.meeting.createdBy === userId ||
			Object.values(this.meeting.participants).includes(String(userId));
	}

	getDuration(): number | null {
		if (!this.meeting.startTime || !this.meeting.endTime) {
			return null;
		}
		return this.meeting.endTime.getTime() - this.meeting.startTime.getTime();
	}
}

@Injectable()
export class TeamMeeting extends MeetingBase<
	IWorkspaceMeetingDTO,
	Input<TeamMeetingDTO>
> {
	store: IMeetingStore<TMemberId>;
	participantStore: IParticipantStore;
	meeting: IWorkspaceMeetingDTO = {} as IWorkspaceMeetingDTO;
	private workspaceId: TWorkspaceId = {} as TWorkspaceId;

	constructor() {
		super();
		this.store = inject<IMeetingStore<TMemberId>>("MemoryWorkspaceMeetingStore");
		this.participantStore = inject<IParticipantStore>("ParticipantStore");
	}

	createMeeting(input: Input<TeamMeetingDTO> & { callerDetail: IMemberDTO }): IWorkspaceMeetingDTO {
		const meetingId = ID.meetingId();

		if (!input.title || input.title.trim().length === 0) {
			throw new Error("Meeting title is required");
		}

		if (input.startTime && input.startTime < new Date()) {
			throw new Error("Cannot create a meeting in the past");
		}

		const newMeeting: IWorkspaceMeetingDTO = {
			id: meetingId,
			meetingType: input.meetingType,
			title: input.title,
			createdBy: input.createdBy,
			workspaceId: input.workspaceId,
			status: "Not Started",
			createdAt: new Date(),
			description: input.description || "",
			startTime: input.startTime || new Date(),
			endTime: null,
			participants: {},
		};

		this.participantStore.addParticipant({
			meetingId: newMeeting.id,
			memberId: input.createdBy,
			name: input.callerDetail?.name || "Creator",
			role: "admin",
			joinedAt: new Date(),
			leaveAt: null,
		});

		newMeeting.participants = {
			[String(input.createdBy)]: input.callerDetail?.name || "Creator",
		};

		this.store.save(newMeeting);
		this.meeting = newMeeting;
		this.workspaceId = input.workspaceId;

		return newMeeting;
	}

	deleteMeeting(id: TMeetingId): void {
		const meeting = this.getMeeting(id);
		if (meeting && meeting.status === "Active") {
			throw new Error("Cannot delete an active meeting. End it first.");
		}

		this.participantStore.removeParticipant(id);
		this.store.delete(id);

		if (this.meeting.id === id) {
			this.meeting = {} as IWorkspaceMeetingDTO;
		}
	}

	getMeeting(id: TMeetingId): IWorkspaceMeetingDTO | null {
		const meeting = this.store.findById(id);
		if (!meeting) {
			return null;
		}
		this.meeting = meeting as unknown as IWorkspaceMeetingDTO;
		return this.meeting;
	}

	updateMeeting(
		id: TMeetingId,
		data: Partial<IWorkspaceMeetingDTO>
	): void {
		const current = this.getMeeting(id);
		if (current && data.status) {
			this.validateStatusTransition(current.status, data.status);
			if (data.startTime && data.startTime < new Date()) {
				throw new Error("Cannot set meeting start time to the past");
			}
		}

		this.store.update(id, data);

		if (this.meeting.id === id) {
			this.meeting = { ...this.meeting, ...data };
		}
	}

	private validateStatusTransition(current: string, next: string): void {
		const validTransitions: Record<string, string[]> = {
			"Not Started": ["Active", "Cancelled"],
			"Active": ["Ended", "Cancelled"],
			"Ended": [],
			"Cancelled": [],
		};

		const allowed = validTransitions[current] || [];
		if (!allowed.includes(next)) {
			throw new Error(`Invalid status transition from ${current} to ${next}`);
		}
	}

	joinMeeting(memberId: TMemberId, workspaceId: TWorkspaceId): void {
		if (this.meeting.participants[memberId as any]) {
			console.log(`Member ${memberId} is already a participant.`);
			return;
		}

		if (String(this.meeting.workspaceId) !== String(workspaceId)) {
			throw new Error(`Member ${memberId} does not belong to workspace ${workspaceId}.`);
		}

		if (this.meeting.status !== "Active" && this.meeting.status !== "Not Started") {
			throw new Error(`Cannot join meeting with status: ${this.meeting.status}`);
		}

		const participant: IParticipantDTO = {
			meetingId: this.meeting.id,
			memberId: memberId,
			name: `Member ${memberId}`,
			role: "member",
			joinedAt: new Date(),
			leaveAt: null,
		};

		this.participantStore.addParticipant(participant);

		this.updateMeeting(this.meeting.id, {
			participants: {
				...this.meeting.participants,
				[memberId as any]: `Member ${memberId}`,
			},
		});

		console.log(`Member ${memberId} joined the meeting ${this.meeting.title}.`);
	}

	leaveMeeting(memberId: TMemberId): void {
		if (!this.meeting.participants[memberId as any]) {
			throw new Error(`Member ${memberId} is not a participant of this meeting.`);
		}

		const participant = {
			meetingId: this.meeting.id,
			memberId: memberId,
			name: this.meeting.participants[memberId as any],
			role: "member" as const,
			joinedAt: new Date(),
			leaveAt: new Date(),
		};

		this.participantStore.addParticipant(participant);

		const updatedParticipants = { ...this.meeting.participants };
		delete (updatedParticipants as any)[memberId];

		this.updateMeeting(this.meeting.id, {
			participants: updatedParticipants,
		});
	}

	addParticipant(participant: IParticipantDTO): void {
		this.updateMeeting(this.meeting.id, {
			participants: {
				...this.meeting.participants,
				[participant.memberId as any]: participant.name,
			},
		});

		this.participantStore.addParticipant(participant);
	}

	async getMeetingStats(): Promise<{
		participantCount: number;
		duration: number | null;
		isActive: boolean;
	}> {
		const participants = await this.participantStore.listParticipants(this.meeting.id);
		const duration = this.meeting.endTime
			? this.meeting.endTime.getTime() - this.meeting.startTime.getTime()
			: null;

		return {
			participantCount: participants.length,
			duration,
			isActive: this.meeting.status === "Active",
		};
	}
}
