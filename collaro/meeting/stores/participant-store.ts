import { IMember, Member } from "@collaro/member";
import { TMeetingId } from "../interface";
import { IParticipantDTO, IParticipantStore } from "./index";
import { Input } from "@collaro/utils/omit";

const localStorage: IParticipantDTO[] = [];

export class ParticipantStore implements IParticipantStore {
  member: IMember = new Member();

  async addParticipant(participant: Input<IParticipantDTO>): Promise<void> {
    const member: IParticipantDTO = {
      ...participant,
      joinedAt: new Date(),
      leaveAt: null,
    }
    localStorage.push(member);
  }

  async listParticipants(meetingId: TMeetingId): Promise<IParticipantDTO[]> {
    return Promise.resolve(localStorage.filter((p) => p.meetingId === meetingId));
  }

  async removeParticipant(meetingId: TMeetingId): Promise<void> {
    const index = localStorage.findIndex((p) => p.meetingId === meetingId);
    if (index !== -1 && localStorage[index]) {
      localStorage[index].leaveAt = new Date();
    }
  }

  async endMeetingForParticipant(meetingId: TMeetingId): Promise<void> {
    const participants = await this.listParticipants(meetingId);
    participants.forEach((p) => {
      if (!p.leaveAt) {
        p.leaveAt = new Date();
      }
    });
  }
}