import { IMeetingStore, IParticipantDTO, IParticipantStore, IWorkspaceMeetingDTO, MemoryWorkspaceMeetingStore, ParticipantStore, TeamMeetingDTO, TMeetingId } from "@collaro/meeting";
import {
	IMemberDTO,
	IMemberStore,
	IWorkspaceMemberManager,
	MemberStore,
	TMemberId,
} from "@collaro/workspace/member";
import { ID } from "@collaro/utils/generate";
import { Input } from "@collaro/utils/omit";
import { IWorkspaceDTO } from "@collaro/workspace/interface";
import { WorkspaceMemberManager } from "./workspace-manager";

export class WorkspaceMeetingManager {
  manager: IWorkspaceMemberManager = new WorkspaceMemberManager();
  memberStore: IMemberStore = new MemberStore();
  participantStore: IParticipantStore = new ParticipantStore();
  meetingStore: IMeetingStore<TMemberId> = new MemoryWorkspaceMeetingStore();
  
  private async checkMemberAccessToMeeting(meetingId: TMeetingId, memberId: TMemberId): Promise<boolean> {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) {
      throw new Error(`Meeting with ID: ${meetingId} not found`);
    }

    const checkExists = await this.memberStore.checkMemberExists(meeting.workspaceId, memberId);
    if (!checkExists) {
      throw new Error(`Member with Id ${memberId} does not exist in workspace with ID: ${meeting.workspaceId}`);
    }

    return true;
  }

  async validateMember(memberId: TMemberId): Promise<IMemberDTO> {
    const member = await this.memberStore.findById(memberId);
    if (!member) {
      throw new Error(`Member with ID: ${memberId} not found`);
    }
    return member;
  }

  async createMeeting(input: Omit<Input<TeamMeetingDTO>, "participants" | "endTime">, workspaceId: IWorkspaceDTO["id"]): Promise<TeamMeetingDTO> {
    try {
      const checkExists = await this.memberStore.checkMemberExists(workspaceId, input.createdBy);
      if (!checkExists) {
        throw new Error(`Member with Id ${input.createdBy} does not exist in workspace with ID: ${workspaceId}`);
      }

      // Validation
      const member = await this.validateMember(input.createdBy);
  
      // Create meeting DTO
      const meeting: IWorkspaceMeetingDTO = {
        ...input,
        workspaceId: workspaceId,
        id: ID.meetingId(),
        createdAt: new Date(),
        endTime: null,
        participants: {
          [member.name]: input.createdBy
        }
      }
  
      // Save meeting to store
      await this.meetingStore.save(meeting);
  
      // Add creator as participant to that meeting
      await this.participantStore.addParticipant({
        meetingId: meeting.id,
        memberId: input.createdBy,
        name: member.name,
        role: member.role,
        joinedAt: new Date(),
        leaveAt: null,
      });
  
      // Return the created meeting
      return meeting;
    } catch (error) {
      console.error("Error creating meeting:", error);
      throw error;
    }
  }

  async joinMeeting(meetingId: TMeetingId, memberId: TMemberId): Promise<void> {
    try {
      // Check if meeting exists
      const checkExists = await this.checkMemberAccessToMeeting(meetingId, memberId);
      if(!checkExists) {
        throw new Error(`Member with Id ${memberId} does not exist in workspace with ID: ${meetingId}`);
      }
  
      const meeting = await this.getMeeting(meetingId);

      const member = await this.validateMember(memberId);

      await this.participantStore.addParticipant({
        meetingId,
        memberId,
        name: member.name,
        role: member.role,
        joinedAt: new Date(),
        leaveAt: null,
      });
  
      // Update meeting participants
      const updatedParticipants = {
        ...meeting!.participants,
        [member.name]: memberId
      };
  
      await this.meetingStore.update(meetingId, { 
        participants: updatedParticipants }
      );
      
    } catch (error) {
      console.error("Error joining meeting:", error);
      throw error;
    }
  }

  async getMeeting(id: TMeetingId): Promise<TeamMeetingDTO | null> {
    const meeting = await this.meetingStore.findById(id);
    return meeting as unknown as TeamMeetingDTO | null;
  }

  async updateMeeting(meetingId: TMeetingId, status: TeamMeetingDTO["status"]): Promise<void> {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) {
      throw new Error(`Meeting with ID: ${meetingId} not found`);
    }

    await this.meetingStore.update(meetingId, { status });
  }

  async endMeeting(meetingId: TMeetingId): Promise<void> {
    const meeting = await this.getMeeting(meetingId);
    if (!meeting) {
      throw new Error(`Meeting with ID: ${meetingId} not found`);
    }
    
    await this.meetingStore.update(meetingId, { 
      status: "Completed",
      endTime: new Date(),
     });

    await this.participantStore.endMeetingForParticipant(meetingId);
  }

  async listParticipants(meetingId: TMeetingId): Promise<IParticipantDTO[]> {
    return await this.participantStore.listParticipants(meetingId);
  }
}