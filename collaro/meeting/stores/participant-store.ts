import { IMember, Member } from "@collaro/member";
import { TMeetingId } from "../interface";
import { IParticipantDTO, IParticipantStore } from "./index";
import { Input } from "@collaro/utils/omit";

const localStorage: IParticipantDTO[] = [];

export class ParticipantStore implements IParticipantStore {
  member: IMember = new Member();

  addParticipant(participant: Input<IParticipantDTO>): void {
    localStorage.push({
      ...participant,
      joinedAt: new Date(),
      leaveAt: null,
    });
  }

  listParticipants(meetingId: TMeetingId): IParticipantDTO[] {
    return localStorage.filter((p) => p.meetingId === meetingId);
  }

  removeParticipant(meetingId: TMeetingId): void {
    const index = localStorage.findIndex((p) => p.meetingId === meetingId);
    if (index !== -1 && localStorage[index]) {
      localStorage[index].leaveAt = new Date();
    }
  }

  endMeetingForParticipant(meetingId: TMeetingId): void {
    const participants = this.listParticipants(meetingId);
    participants.forEach((p) => {
      if (!p.leaveAt) {
        p.leaveAt = new Date();
      }
    });
  }
}