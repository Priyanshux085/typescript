import { IMeetingDTO, meetingStatus } from "../interface";
import { IMeetingStore } from ".";
import { TUserId, TMeetingId, TMemberId } from "@collaro/utils";

export class MemoryMeetingStore implements IMeetingStore<TUserId> {
	private meetings: IMeetingDTO<TUserId>[] = [];

	save(meeting: IMeetingDTO<TUserId>): Promise<void> {
		this.meetings.push(meeting);
		return Promise.resolve();
	}

	findById(id: TMeetingId): Promise<IMeetingDTO<TUserId> | null> {
		const meeting = this.meetings.find((meeting) => meeting.id === id) || null;
		return Promise.resolve(meeting);
	}

	update(
		id: TMeetingId,
		meeting: Partial<IMeetingDTO<TUserId>>
	): Promise<void> {
		const index = this.meetings.findIndex((m) => m.id === id);
		if (index !== -1) {
			this.meetings[index] = {
				...this.meetings[index],
				...meeting,
			} as IMeetingDTO<TUserId>;
		}
		return Promise.resolve();
	}

	delete(id: TMeetingId): Promise<void> {
		this.meetings = this.meetings.filter((meeting) => meeting.id !== id);
		return Promise.resolve();
	}

	list(): Promise<IMeetingDTO<TUserId>[]> {
		return Promise.resolve([...this.meetings]);
	}

	async findByStatus(status: meetingStatus): Promise<IMeetingDTO<TUserId>[]> {
		return this.meetings.filter((meeting) => meeting.status === status);
	}
}

const localWorkspaceMeetingStore: IMeetingDTO<TMemberId>[] = [];

export class MemoryWorkspaceMeetingStore implements IMeetingStore<TMemberId> {
	private constructor() {}

	private static instance: MemoryWorkspaceMeetingStore;

	static getInstance(): MemoryWorkspaceMeetingStore {
		if (!MemoryWorkspaceMeetingStore.instance) {
			MemoryWorkspaceMeetingStore.instance = new MemoryWorkspaceMeetingStore();
		}
		return MemoryWorkspaceMeetingStore.instance;
	}

	save(meeting: IMeetingDTO<TMemberId>): Promise<void> {
		localWorkspaceMeetingStore.push(meeting);
		return Promise.resolve();
	}

	async findById(id: TMeetingId): Promise<IMeetingDTO<TMemberId> | null> {
		const meeting =
			localWorkspaceMeetingStore.find((meeting) => meeting.id === id) || null;

		if (!meeting) {
			throw new Error(`Meeting with ID: ${id} not found`);
		}

		return meeting;
	}

	async update(
		id: TMeetingId,
		meeting: Partial<IMeetingDTO<TMemberId>>
	): Promise<void> {
		const index = localWorkspaceMeetingStore.findIndex((m) => m.id === id);

		if (index === -1) {
			throw new Error(`Meeting with ID: ${id} not found`);
		}

		const dto: IMeetingDTO<TMemberId> = {
			...localWorkspaceMeetingStore[index],
			...meeting,
		} as IMeetingDTO<TMemberId>;

		localWorkspaceMeetingStore[index] = dto;

		return Promise.resolve();
	}

	async delete(id: TMeetingId): Promise<void> {
		const index = localWorkspaceMeetingStore.findIndex((m) => m.id === id);
		if (index !== -1) {
			localWorkspaceMeetingStore.splice(index, 1);
		}
	}

	async list(): Promise<IMeetingDTO<TMemberId>[]> {
		return [...localWorkspaceMeetingStore];
	}

	async findByStatus(status: meetingStatus): Promise<IMeetingDTO<TMemberId>[]> {
		return localWorkspaceMeetingStore.filter(
			(meeting) => meeting.status === status
		);
	}
}
