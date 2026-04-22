import {
	IMeetingStore,
	IParticipantDTO,
	IParticipantStore,
	IWorkspaceMeetingDTO,
	meetingStatus,
	MemoryWorkspaceMeetingStore,
	ParticipantStore,
	TeamMeetingDTO,
	TMeetingId,
} from "@collaro/meeting";
import {
	IMemberDTO,
	IMemberStore,
	MemberStore,
	TMemberId,
} from "@collaro/workspace/role/member";
import { createMeetingLink, ID } from "@collaro/utils/generate";
import { Input } from "@collaro/utils/omit";
import { MeetingNotification } from "@collaro/notification/meeting-notification/meeting.notification";

type TBaseCreateMeetingInput = Omit<
	Input<TeamMeetingDTO>,
	"participants" | "endTime" | "startTime" | "createdAt" | "id" | "status"
>;

type TCreateMeetingInput =
	| (TBaseCreateMeetingInput & {
			readonly meetingType: "Instant";
	  })
	| (TBaseCreateMeetingInput & {
			readonly meetingType: "Scheduled";
			readonly startTime: Date;
	  });

// Type guard to differentiate meeting types at runtime
const isScheduledMeeting = (
	input: TCreateMeetingInput
): input is TBaseCreateMeetingInput & {
	meetingType: "Scheduled";
	startTime: Date;
} => input.meetingType === "Scheduled" && "startTime" in input;

type TFullMeetingDTO = Omit<TeamMeetingDTO, "participants" | "createdBy"> & {
	participants: IParticipantDTO[];
	createdBy: IMemberDTO;
};

export class WorkspaceMeetingManager {
	private memberStore: IMemberStore = new MemberStore();
	public participantStore: IParticipantStore = new ParticipantStore();
	private notificationService: MeetingNotification =
		MeetingNotification.getInstance();
	private meetingStore: IMeetingStore<TMemberId> =
		MemoryWorkspaceMeetingStore.getInstance();

	private async checkMemberAccessToMeeting(
		meetingId: TMeetingId,
		memberId: TMemberId
	): Promise<boolean> {
		const meeting = await this.getMeeting(meetingId);
		if (!meeting) {
			throw new Error(`Meeting with ID: ${meetingId} not found`);
		}

		const checkExists = await this.memberStore.checkMemberExists(
			meeting.workspaceId,
			memberId
		);
		if (!checkExists) {
			throw new Error(
				`Member with Id ${memberId} does not exist in workspace with ID: ${meeting.workspaceId}`
			);
		}

		return true;
	}

	private async sendNoticationToMembers(
		type:
			| "meeting_created"
			| "meeting_updated"
			| "meeting_cancelled"
			| "meeting_reminder"
			| "meeting_rescheduled",
		meetingId: TMeetingId,
		member: IMemberDTO
	): Promise<void> {
		const { workspaceId, userId } = member;

		const members = (await this.memberStore.list(workspaceId)).filter(
			(m) => m.userId !== userId
		);

		for (const member of members) {
			await this.notificationService.createNotification({
				meetingLink: createMeetingLink(meetingId),
				type,
				userId: member.userId,
				workspaceId: workspaceId,
				memberId: member.id,
			});
		}
	}

	private async checkMeetingStatus(
		meetingId: TMeetingId,
		status: meetingStatus
	): Promise<boolean> {
		const allMeetings = await this.meetingStore.findByStatus(status);

		const meeting = allMeetings.find((m) => m.id === meetingId);
		return !!meeting;
	}

	async validateMember(memberId: TMemberId): Promise<IMemberDTO> {
		const member = await this.memberStore.findById(memberId);
		if (!member) {
			throw new Error(`Member with ID: ${memberId} not found`);
		}
		return member;
	}

	async createMeeting(input: TCreateMeetingInput): Promise<TeamMeetingDTO> {
		try {
			const workspaceId = input.workspaceId;

			const checkExists = await this.memberStore.checkMemberExists(
				input.workspaceId,
				input.createdBy
			);

			if (!checkExists) {
				throw new Error(
					`Member with Id ${input.createdBy} does not exist in workspace with ID: ${workspaceId}`
				);
			}

			// Validation
			const member = await this.validateMember(input.createdBy);

			// Type-safe handling of startTime based on discriminated union
			const startTime = isScheduledMeeting(input)
				? input.startTime
				: new Date(Date.now());

			const meetingType = isScheduledMeeting(input) ? "Not Started" : "Active";

			// Create meeting DTO
			const meeting: IWorkspaceMeetingDTO = {
				...input,
				id: ID.meetingId(),
				workspaceId: workspaceId,
				status: meetingType,
				startTime,
				endTime: null,
				createdAt: new Date(),
				participants: {
					[String(input.createdBy)]: member.name,
				},
			};

			// Add creator as participant to that meeting
			await this.participantStore.addParticipant({
				meetingId: meeting.id,
				memberId: input.createdBy,
				name: member.name,
				role: member.role,
				joinedAt: new Date(),
				leaveAt: null,
			});

			// Save meeting to store
			await this.meetingStore.save(meeting);

			// Notify all members in the workspace about the new meeting except the creator
			await this.sendNoticationToMembers("meeting_created", meeting.id, member);

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
			const checkExists = await this.checkMemberAccessToMeeting(
				meetingId,
				memberId
			);
			if (!checkExists) {
				throw new Error(
					`Member with Id ${memberId} does not exist in workspace with ID: ${meetingId}`
				);
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
				[String(memberId)]: member.name,
			};

			await this.meetingStore.update(meetingId, {
				participants: updatedParticipants,
			});
		} catch (error) {
			console.error("Error joining meeting:", error);
			throw error;
		}
	}

	async getMeeting(id: TMeetingId): Promise<TeamMeetingDTO | null> {
		const meeting = await this.meetingStore.findById(id);
		return meeting as unknown as TeamMeetingDTO | null;
	}

	async getFullMeetingDetail(id: TMeetingId): Promise<TFullMeetingDTO | null> {
		const meeting = await this.getMeeting(id);
		if (!meeting) {
			return null;
		}

		const member = await this.memberStore.findById(meeting.createdBy);
		if (!member) {
			throw new Error(
				`Creator with ID: ${meeting.createdBy} not found for meeting ID: ${id}`
			);
		}

		const participants = await this.listParticipants(id);
		if (!participants) {
			throw new Error(`Participants for meeting ID: ${id} not found`);
		}

		return {
			createdBy: member,
			id: meeting.id,
			title: meeting.title,
			status: meeting.status,
			description: meeting.description,
			startTime: meeting.startTime,
			endTime: meeting.endTime,
			createdAt: meeting.createdAt,
			workspaceId: meeting.workspaceId,
			meetingType: meeting.meetingType,
			participants: {
				...participants,
			},
		};
	}

	async updateMeeting(
		meetingId: TMeetingId,
		status: "Not Started" | "Cancelled"
	): Promise<void> {
		const meeting = await this.getMeeting(meetingId);
		if (!meeting) {
			throw new Error(`Meeting with ID: ${meetingId} not found`);
		}

		if (meeting.status === "Ended") {
			throw new Error(
				`Cannot update a completed meeting with ID: ${meetingId}`
			);
		}

		const member = await this.validateMember(meeting.createdBy);

		await this.meetingStore.update(meetingId, { status });

		if (status === "Not Started") {
			await this.sendNoticationToMembers(
				"meeting_rescheduled",
				meetingId,
				member
			);
			return;
		}

		if (status === "Cancelled") {
			await this.sendNoticationToMembers(
				"meeting_cancelled",
				meetingId,
				member
			);
			return;
		}

		await this.sendNoticationToMembers("meeting_updated", meetingId, member);
	}

	async endMeeting(meetingId: TMeetingId): Promise<void> {
		const checkMeetingStatus = await this.checkMeetingStatus(
			meetingId,
			"Active"
		);
		if (!checkMeetingStatus) {
			throw new Error(
				`Only active meetings can be ended. Meeting with ID: ${meetingId} is not active.`
			);
		}

		const meeting = await this.getMeeting(meetingId);
		if (!meeting) {
			throw new Error(`Meeting with ID: ${meetingId} not found`);
		}

		await this.meetingStore.update(meetingId, {
			status: "Ended",
			endTime: new Date(),
		});

		await this.participantStore.endMeetingForParticipant(meetingId);
	}

	async listParticipants(meetingId: TMeetingId): Promise<IParticipantDTO[]> {
		return await this.participantStore.listParticipants(meetingId);
	}
}
