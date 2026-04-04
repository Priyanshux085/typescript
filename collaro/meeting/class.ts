import { Input } from "@collaro/utils/omit";
import { 
  IMeetingDTO, 
  IWorkspaceMeetingDTO, 
  TMeetingId, 
  IMeetingStore,
  MemoryMeetingStore,
  TWorkspaceId,
  IWorkspaceMeeting,
  IParticipantStore,
  ParticipantStore,
  MemoryWorkspaceMeetingStore,
  TeamMeetingDTO,
  IParticipantDTO,
} from "./index";
import { ID } from "@collaro/utils/generate";
import { TMemberId } from "@collaro/member/interface";
import { TUserId } from "@collaro/user";

export type TMeetingInput<T> = Omit<Input<T>, "participants">

abstract class MeetingBase<T, TMeetingInput = T> {
  abstract createMeeting(input: TMeetingInput): T;
  abstract getMeeting(id: TMeetingId): T | null;
  abstract updateMeeting(id: TMeetingId, data: Partial<T>): void;
  abstract deleteMeeting(id: TMeetingId): void;
}

type PrivateMeetingDTO = IMeetingDTO<TUserId>;

export class PrivateMeeting extends MeetingBase<PrivateMeetingDTO> {
  store: IMeetingStore<TUserId> = new MemoryMeetingStore();

  constructor(public meeting: PrivateMeetingDTO) {
    super();
  }

  override createMeeting(input: PrivateMeetingDTO): PrivateMeetingDTO {
    this.store.save(input);
    return input;
  }

  override getMeeting(id: TMeetingId): PrivateMeetingDTO | null {
    return this.store.findById(id);
  }

  override deleteMeeting(id: TMeetingId): void {
    this.store.delete(id);
  }

  override updateMeeting(id: TMeetingId, data: Partial<PrivateMeetingDTO>): void {
    this.store.update(id, data);
  }
}

export class TeamMeeting extends MeetingBase<IWorkspaceMeetingDTO, Input<TeamMeetingDTO>> implements IWorkspaceMeeting {
  store: IMeetingStore<TMemberId> = new MemoryWorkspaceMeetingStore();
  participantStore: IParticipantStore = new ParticipantStore();
  meeting: IWorkspaceMeetingDTO = {} as IWorkspaceMeetingDTO;

  private findMemberById(id: TMemberId): TeamMeetingDTO | null {
    const participant = this.participantStore.listParticipants(this.meeting.id).find(p => p.memberId === id);
    if (!participant) {
      console.log(`Member with ID ${id} is not a participant of this meeting.`);
      return null;
    }
    
    return this.store.findById(this.meeting.id);
  }

  override createMeeting(input: TMeetingInput<IWorkspaceMeetingDTO>): IWorkspaceMeetingDTO {
    const Id = ID.meetingId();

    // Check if meeting with the same ID already exists
    const newMeeting: IWorkspaceMeetingDTO = {
      id: Id,
      title: input.title,
      createdBy: input.createdBy,
      status: "Scheduled",
      createdAt: new Date(),
      description: input.description,
      startTime: input.startTime,
      endTime: null,
      participants: {
        [String(input.createdBy)]: input.createdBy
      }
    };

    // console.log(`Creating meeting with ID: ${newMeeting.id} and title: ${newMeeting.title}`);
    
    this.participantStore.addParticipant({
      meetingId: newMeeting.id,
      memberId: input.createdBy,
      name: "Creator",
      role: "admin",
      joinedAt: new Date(),
      leaveAt: null,
    })

    this.store.save(newMeeting);

    return newMeeting;
  }

  override deleteMeeting(id: TMeetingId): void {
    this.store.delete(id);
  }

  override getMeeting(id: TMeetingId): IWorkspaceMeetingDTO | null {
    const meeting = this.store.findById(id);

    if (!meeting) {
      return null;
    }

    return meeting as IWorkspaceMeetingDTO;
  }

  override updateMeeting(id: TMeetingId, data: Partial<IWorkspaceMeetingDTO>): void {
    this.store.update(id, data);
  }

  joinMeeting(memberId: string, workspaceId: TWorkspaceId): void {
    // check if member is already a participant
    if (this.meeting.participants[memberId]) {
      console.log(`Member ${memberId} is already a participant.`);
      return;
    }

    // check is the member belongs to the workspace
    if (String(this.meeting.id) !== String(workspaceId)) {
      console.log(`Member ${memberId} does not belong to workspace ${workspaceId}.`);
      return;
    }

    console.log(`Member ${memberId} joined the meeting ${this.meeting.title}.`);
  }

  addParticipant(participant: IParticipantDTO): void {
    this.updateMeeting(this.meeting.id, {
      participants: {
        [String(participant.memberId)]: participant.memberId
      }
    })

    this.participantStore.addParticipant(participant);
  }
}
