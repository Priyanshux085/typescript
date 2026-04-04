import { IMeetingDTO, TMeetingId } from "../interface";
import { IMeetingStore } from ".";
import { TUserId } from "@collaro/user";
import { TMemberId } from "@collaro/member";

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

  update(id: TMeetingId, meeting: Partial<IMeetingDTO<TUserId>>): Promise<void> {
    const index = this.meetings.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.meetings[index] = { ...this.meetings[index], ...meeting } as IMeetingDTO<TUserId>;
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
}

const localWorkspaceMeetingStore: IMeetingDTO<TMemberId>[] = [];

export class MemoryWorkspaceMeetingStore implements IMeetingStore<TMemberId> {
  save(meeting: IMeetingDTO<TMemberId>): Promise<void> {
    localWorkspaceMeetingStore.push(meeting);
    return Promise.resolve();
  }

  async findById(id: TMeetingId): Promise<IMeetingDTO<TMemberId> | null> {
    const meeting = localWorkspaceMeetingStore.find((meeting) => meeting.id === id) || null;

    if (!meeting) {
      throw new Error(`Meeting with ID: ${id} not found`);
    }

    return meeting;
  }

  async update(id: TMeetingId, meeting: Partial<IMeetingDTO<TMemberId>>): Promise<void> {
    const index = localWorkspaceMeetingStore.findIndex((m) => m.id === id);
    if (index !== -1) {
      localWorkspaceMeetingStore[index] = { ...localWorkspaceMeetingStore[index], ...meeting } as IMeetingDTO<TMemberId>;
    }
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
}