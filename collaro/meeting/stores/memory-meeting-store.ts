import { IMeetingDTO, TMeetingId } from "../interface";
import { IMeetingStore } from ".";
import { TUserId } from "@collaro/user";
import { TMemberId } from "@collaro/member";

export class MemoryMeetingStore implements IMeetingStore<TUserId> {
  private meetings: IMeetingDTO<TUserId>[] = [];

  save(meeting: IMeetingDTO<TUserId>): void {
    this.meetings.push(meeting);
  }

  findById(id: TMeetingId): IMeetingDTO<TUserId> | null {
    return this.meetings.find((meeting) => meeting.id === id) || null;
  }

  update(id: TMeetingId, meeting: Partial<IMeetingDTO<TUserId>>): void {
    const index = this.meetings.findIndex((m) => m.id === id);
    if (index !== -1) {
      this.meetings[index] = { ...this.meetings[index], ...meeting } as IMeetingDTO<TUserId>;
    }
  }

  delete(id: TMeetingId): void {
    this.meetings = this.meetings.filter((meeting) => meeting.id !== id);
  }

  list(): IMeetingDTO<TUserId>[] {
    return [...this.meetings];
  }
}

const localWorkspaceMeetingStore: IMeetingDTO<TMemberId>[] = [];

export class MemoryWorkspaceMeetingStore implements IMeetingStore<TMemberId> {
  save(meeting: IMeetingDTO<TMemberId>): void {
    localWorkspaceMeetingStore.push(meeting);
  }

  findById(id: TMeetingId): IMeetingDTO<TMemberId> | null {
    const meeting = localWorkspaceMeetingStore.find((meeting) => meeting.id === id) || null;

    if (!meeting) {
      throw new Error(`Meeting with ID: ${id} not found`);
    }

    return meeting;
  }

  update(id: TMeetingId, meeting: Partial<IMeetingDTO<TMemberId>>): void {
    const index = localWorkspaceMeetingStore.findIndex((m) => m.id === id);
    if (index !== -1) {
      localWorkspaceMeetingStore[index] = { ...localWorkspaceMeetingStore[index], ...meeting } as IMeetingDTO<TMemberId>;
    }
  }

  delete(id: TMeetingId): void {
    const index = localWorkspaceMeetingStore.findIndex((m) => m.id === id);
    if (index !== -1) {
      localWorkspaceMeetingStore.splice(index, 1);
    }
  }

  list(): IMeetingDTO<TMemberId>[] {
    return [...localWorkspaceMeetingStore];
  }
}