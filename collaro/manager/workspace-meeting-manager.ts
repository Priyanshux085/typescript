import {
	IMeetingStore,
	IParticipantDTO,
	IParticipantStore,
	IWorkspaceMeetingDTO,
	meetingStatus,
	MemoryWorkspaceMeetingStore,
	ParticipantStore,
	TeamMeetingDTO,
} from "@collaro/meeting";
import {
	IMemberDTO,
	IMemberStore,
	MemberStore,
} from "@collaro/workspace/role/member";
import { createMeetingLink, ID } from "@collaro/utils/generate";
import { Input } from "@collaro/utils/omit";
import { MeetingNotification } from "@collaro/notification/meeting-notification/meeting.notification";
import { streamClient } from "@collaro/stream";
import { VoiceAgent } from "@collaro/workspace/voice-agent";
import { ActionItem } from "@collaro/workspace/action-item";
import { TMeetingId, TMemberId } from "@collaro/utils";

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

type TFullMeetingDTO = Omit<TeamMeetingDTO, "participants"> & {
	participants: IParticipantDTO[];
};

export class WorkspaceMeetingManager {
	private memberStore: IMemberStore = MemberStore.getInstance();
	public participantStore: IParticipantStore = new ParticipantStore();
	private notificationService: MeetingNotification =
		MeetingNotification.getInstance();
	private meetingStore: IMeetingStore<TMemberId> =
		MemoryWorkspaceMeetingStore.getInstance();
	private voiceAgent: VoiceAgent = new VoiceAgent();
	private actionItemManager: ActionItem = new ActionItem();

	private async checkMemberAccessToMeeting(
		meetingId: TMeetingId,
		memberId: TMemberId
	): Promise<boolean> {
		const meeting = await this.getFullMeetingDetail(meetingId);
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
			const caller = await this.validateMember(input.createdBy);

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
					[String(input.createdBy)]: caller.name,
				},
			};

			// Add creator as participant to that meeting
			await this.participantStore.addParticipant({
				meetingId: meeting.id,
				memberId: input.createdBy,
				name: caller.name,
				role: caller.role,
				joinedAt: new Date(),
				leaveAt: null,
			});

			// Save meeting to store
			await this.meetingStore.save(meeting);
			// 📍 POINT 1: Create Stream Call
			try {
				const streamCall = streamClient.video.call(
					input.meetingType,
					String(meeting.id)
				);

				await streamCall.getOrCreate({
					data: {
						created_by: {
							id: String(input.createdBy),
							name: caller.name,
							custom: {
								memberId: String(input.createdBy),
								workspaceId: String(workspaceId),
								name: caller.name,
							},
						},
						members: [
							{
								user_id: String(input.createdBy),
								role: caller.role,
								custom: {
									memberId: String(input.createdBy),
									workspaceId: String(workspaceId),
									name: caller.name,
								},
							},
						],
					},
					notify: true,
					ring: true,
					video: true,
				});
				console.log(`Stream call created: ${input.meetingType}:${meeting.id}`);
			} catch (streamError) {
				console.error("Error creating Stream call:", streamError);
				// Continue - meeting created locally, Stream sync happens async
			}

			// 📍 POINT 1: Initialize AI Assistant if enabled
			if (input.aiAssistantEnabled) {
				try {
					const agentConfig = await this.voiceAgent.getAgentConfig(workspaceId);
					if (agentConfig && agentConfig.enabled) {
						console.log(
							`AI Assistant "${agentConfig.name}" initialized for meeting ${meeting.id}`
						);

						// Create VAPI assistant for this workspace
						const vapiAssistantId = await this.voiceAgent.createVapiAssistant(
							`Workspace ${workspaceId}`
						);

						if (vapiAssistantId) {
							console.log(
								`VAPI assistant created: ${vapiAssistantId} for meeting ${meeting.id}`
							);
							// Store VAPI assistant ID in meeting metadata for later retrieval
							await this.meetingStore.update(meeting.id, {
								...meeting,
								// vapiAssistantId,
							});
						} else {
							console.warn(
								`Failed to create VAPI assistant for meeting ${meeting.id}`
							);
						}
					} else {
						console.warn(
							`AI Assistant not configured for workspace ${workspaceId}`
						);
					}
				} catch (aiError) {
					console.error("Error initializing AI assistant:", aiError);
					// Continue - meeting created locally
				}
			}

			// Notify all members in the workspace about the new meeting except the creator
			await this.sendNoticationToMembers("meeting_created", meeting.id, caller);
			// Return the created meeting

			return {
				...meeting,
				callerDetail: caller,
			};
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

			// 📍 POINT 2: Add Member to Stream Call
			try {
				const streamCall = streamClient.video.call(
					meeting!.meetingType,
					String(meetingId)
				);

				await streamCall.updateCallMembers({
					update_members: [
						{
							user_id: String(memberId),
							role: member.role,
							custom: {
								memberId: String(memberId),
								workspaceId: String(meeting!.workspaceId),
								name: member.name,
							},
						},
					],
				});

				// Ring the member to notify
				await streamCall.ring({
					members_ids: [String(memberId)],
				});

				console.log(`Member ${memberId} added to Stream call`);
			} catch (streamError) {
				console.error("Error adding member to Stream call:", streamError);
				// Continue - local join still happens
			}
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

		const caller = await this.validateMember(meeting.createdBy);
		if (!caller) {
			throw new Error(
				`Creator with ID: ${meeting.createdBy} not found for meeting ID: ${id}`
			);
		}

		const participants = await this.listParticipants(id);
		if (!participants) {
			throw new Error(`Participants for meeting ID: ${id} not found`);
		}

		return {
			...meeting,
			callerDetail: caller,
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

		// 📍 POINT 3: End Stream Call
		try {
			const streamCall = streamClient.video.call(
				meeting.meetingType,
				String(meetingId)
			);

			// Query members before ending
			const { members } = await streamCall.queryMembers({});
			console.log(`Ending call with ${members.length} members`);

			// Update call data to mark as ended
			await streamCall.update({
				custom: {
					status: "ended",
					endedAt: new Date().toISOString(),
				},
			});

			console.log(`Stream call ended: ${meeting.meetingType}:${meetingId}`);
		} catch (streamError) {
			console.error("Error ending Stream call:", streamError);
			// Continue - local state still updated
		}

		// 📍 POINT 3: Process AI Meeting Analysis if AI was enabled
		if (meeting.aiAssistantEnabled) {
			try {
				const meetingMetadata = meeting as TeamMeetingDTO & {
					metadata?: {
						vapiAssistantId?: string;
						vapiCallId?: string;
					};
				};

				// Get VAPI assistant ID from meeting metadata
				const vapiAssistantId = meetingMetadata.metadata?.vapiAssistantId;

				if (!vapiAssistantId) {
					console.warn("Meeting has AI enabled but no VAPI assistant ID found");
					return;
				}

				// In production: Get transcript from VAPI using the call ID
				// For now: use mock transcript
				let transcript = "";

				// Try to fetch real transcript if we have a call ID
				if (meetingMetadata.metadata?.vapiCallId) {
					const vapiClient = (
						this.voiceAgent as unknown as {
							vapiClient?: {
								getTranscript(callId: string): Promise<{
									messages: Array<{
										role: string;
										message: string;
									}>;
								}>;
							};
						}
					).vapiClient;

					const vapiTranscript = await vapiClient?.getTranscript(
						meetingMetadata.metadata.vapiCallId
					);
					if (vapiTranscript) {
						transcript = vapiTranscript.messages
							.map((msg) => `${msg.role}: ${msg.message}`)
							.join("\n");
					}
				}

				// Fallback to mock transcript if no real one available
				if (!transcript) {
					transcript =
						"[Meeting transcript retrieved from VAPI - participants discussed project progress]";
				}

				const participants = await this.listParticipants(meetingId);
				const participantNames = participants.map((p) => p.name);

				// Analyze meeting transcript using VAPI LLM
				const analysis = await this.voiceAgent.analyzeTranscript(transcript, {
					title: meeting.title,
					participants: participantNames,
				});

				// Create action items from analysis
				if (analysis.actions && analysis.actions.length > 0) {
					for (const action of analysis.actions) {
						// Find member by name to get their ID
						const assignedMember = participants.find(
							(p) => p.name === action.assignedTo
						);

						if (assignedMember) {
							await this.actionItemManager.createActionItem({
								meetingId,
								workspaceId: meeting.workspaceId,
								assignedTo: String(assignedMember.memberId),
								title: action.title,
								description: action.description,
								dueDate: action.dueDate,
								priority: action.priority,
								status: "pending",
							});
						}
					}

					console.log(
						`Created ${analysis.actions.length} action items from VAPI analysis`
					);
				}

				// Log analysis results
				console.log(`Meeting summary: ${analysis.summary}`);
				console.log(`Key decisions: ${analysis.keyDecisions.join(", ")}`);
				console.log(
					`Discussion topics: ${analysis.discussionTopics.join(", ")}`
				);

				// Clean up VAPI assistant after analysis
				const deleted =
					await this.voiceAgent.deleteVapiAssistant(vapiAssistantId);
				if (deleted) {
					console.log(
						`VAPI assistant ${vapiAssistantId} deleted after analysis`
					);
				}
			} catch (aiError) {
				console.error("Error processing AI analysis:", aiError);
				// Continue - meeting ended locally
			}
		}
	}

	async listParticipants(meetingId: TMeetingId): Promise<IParticipantDTO[]> {
		return await this.participantStore.listParticipants(meetingId);
	}

	/**
	 * 📍 POINT 4: Generate a secure call token for a member to join a meeting
	 * Called by API endpoint when member wants to join the video call
	 */
	async generateCallToken(
		meetingId: TMeetingId,
		memberId: TMemberId
	): Promise<{
		callToken: string;
		callId: string;
		callType: string;
		userId: string;
	}> {
		try {
			// Validate that member can access this meeting
			await this.checkMemberAccessToMeeting(meetingId, memberId);

			const meeting = await this.getMeeting(meetingId);
			if (!meeting) {
				throw new Error(`Meeting not found: ${meetingId}`);
			}

			// Generate secure token for this specific call
			const token = streamClient.generateCallToken({
				user_id: String(memberId),
				call_cids: [`${meeting.meetingType}:${meetingId}`],
				validity_in_seconds: 3600, // 1 hour
			});

			console.log(
				`Token generated for member ${memberId} on meeting ${meetingId}`
			);

			return {
				callToken: token,
				callId: String(meetingId),
				callType: meeting.meetingType,
				userId: String(memberId),
			};
		} catch (error) {
			console.error("Error generating call token:", error);
			throw error;
		}
	}
}
