import { IMemberDTO } from "@collaro/workspace/role/member";
import { IParticipantDTO, IParticipantStore } from "./index";
import { Input, TMeetingId } from "@collaro/utils";

const localStorage: IParticipantDTO[] = [];

export class ParticipantStore implements IParticipantStore {
	member: IMemberDTO = {} as IMemberDTO;

	async addParticipant(participant: Input<IParticipantDTO>): Promise<void> {
		const member: IParticipantDTO = {
			...participant,
			joinedAt: new Date(),
			leaveAt: null,
		};
		localStorage.push(member);
	}

	async listParticipants(meetingId: TMeetingId): Promise<IParticipantDTO[]> {
		return Promise.resolve(
			localStorage.filter((p) => p.meetingId === meetingId)
		);
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
