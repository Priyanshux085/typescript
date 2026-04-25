import { VoiceAgent } from "./workspace/voice-agent";
import { ActionItem } from "./workspace/action-item";
import { IMemberDTO, MemberStore } from "./workspace/role/member";
import { TMeetingId, TMemberId, TUserId, TWorkspaceId } from "./utils";
// import { ParticipantStore } from "./meeting";
// import { MockVapiClient } from "./workspace/vapi/client";

export async function simulateVapiWorkflow() {
	const memberStore = MemberStore.getInstance();
	const actionItemManager = new ActionItem();
	const voiceAgent = new VoiceAgent(false); 
	// For real VAPI: use VoiceAgent(false) and uncomment below:
	const { loadVapiConfig } = await import("./workspace/vapi/config");
	voiceAgent.initializeVapiClient(loadVapiConfig());
	const workspaceId = "ws_sim_123" as unknown as TWorkspaceId;

	const members = [
		{ id: "member_1", name: "Alice Johnson", role: "admin" },
		{ id: "member_2", name: "Bob Smith", role: "member" },
		{ id: "member_3", name: "Charlie Brown", role: "member" },
	];

	for (const m of members) {
		await memberStore.save({
			id: m.id as unknown as TMemberId,
			workspaceId,
			userId: `user_${m.id}` as unknown as TUserId,
			name: m.name,
			role: m.role,
			createdAt: new Date(),
			updatedAt: null,
		} as IMemberDTO);
	}

	console.log(
		`✅ Added ${members.length} members: ${members.map((m) => m.name).join(", ")}\n`
	);

	// Step 3: Initialize Voice Agent
	console.log("🤖 Step 3: Initializing Voice Agent...\n");
	await voiceAgent.createAgent(workspaceId, {
		name: "Workspace Meeting Assistant",
		enabled: true,
		voiceModel: "gpt-4.1",
		voiceProvider: "elevenlabs",
		language: "en-US",
		systemPrompt: "You are a helpful meeting assistant.",
		role: "note-taker",
		workspaceId: workspaceId as unknown as TWorkspaceId,
	});

	console.log("✅ Voice Agent configured\n");

	// Step 4: Create meeting
	console.log("📅 Step 4: Creating meeting with AI enabled...\n");
	const meetingId = "meeting_sim_456" as unknown as TMeetingId;
	console.log(`✅ Meeting created: Q4 Sprint Planning`);
	console.log(`   ID: ${meetingId}`);
	console.log(`   AI Enabled: true\n`);

	// Step 5: Create VAPI assistant
	console.log("🤖 Step 5: Creating VAPI assistant...\n");
	const vapiAssistantId = await voiceAgent.createVapiAssistant(
		"Simulated Workspace",
		"You are a meeting assistant."
	);
	if (vapiAssistantId) {
		console.log(`✅ VAPI Assistant ID: ${vapiAssistantId}\n`);
	} else {
		console.log(`❌ Failed to create VAPI assistant\n`);
	}

	// Step 6: Simulate meeting
	console.log("🎙️  Step 6: Meeting in progress...\n");
	console.log("   Topics: Q4 deliverables, budget, action items\n");

	// Step 7: End meeting and analyze
	console.log("🔚 Step 7: Ending meeting and analyzing...\n");
	const mockTranscript = `
Alice: Let's discuss Q4 deliverables.
Bob: Action: Alice to review mockups by Friday.
Alice: Action: Bob to set up deployment pipeline - high priority.
Charlie: Action: I'll handle database migration by Monday.
Bob: Decision: We'll launch December 1st with $50k budget.
  `;

	const analysis = await voiceAgent.analyzeTranscript(mockTranscript, {
		title: "Q4 Planning",
		participants: members.map((m) => m.name),
	});

	console.log(`✅ Analysis complete:`);
	console.log(`   Summary: ${analysis.summary}`);
	console.log(`   Actions: ${analysis.actions.length}`);
	console.log(`   Decisions: ${analysis.keyDecisions.join(", ")}\n`);

	// Step 8: Create action items
	console.log("📋 Step 8: Creating action items...\n");
	for (const action of analysis.actions) {
		const assignedMember = members.find((m) => m.name === action.assignedTo);
		if (assignedMember) {
			await actionItemManager.createActionItem({
				meetingId,
				workspaceId,
				assignedTo: assignedMember.name,
				title: action.title,
				description: action.description,
				priority: action.priority,
				status: "pending",
			});
		}
	}
	console.log(`✅ Created ${analysis.actions.length} action items\n`);

	// Step 9: Display action items
	console.log("📋 Step 9: Action Items Created:\n");
	const actionItems =
		await actionItemManager.listActionItemsByMeeting(meetingId);

	actionItems.forEach((item, i: number) => {
		const member = members.find((m) => m.name === item.assignedTo);
		console.log(`${i + 1}. ${item.title}`);
		console.log(`   Assigned to: ${member?.name || "Unknown"}`);
		console.log(`   Priority: ${item.priority}`);
		console.log();
	});

	// Step 10: Cleanup
	console.log("🧹 Step 10: Cleanup...\n");
	if (vapiAssistantId) {
		await voiceAgent.deleteVapiAssistant(vapiAssistantId);
		console.log(`✅ VAPI Assistant deleted\n`);
	}

	// Summary
	console.log("=".repeat(60));
	console.log("✅ SIMULATION COMPLETE");
	console.log("=".repeat(60));
	console.log("\nWhat happened:");
	console.log("1. ✅ Meeting created with AI enabled");
	console.log(
		`2. ${vapiAssistantId ? "✅" : "❌"} VAPI assistant ${vapiAssistantId ? "created" : "creation failed"}`
	);
	console.log("3. ✅ Transcript analyzed with VAPI LLM");
	console.log("4. ✅ Action items extracted and created");
	console.log(
		`5. ${vapiAssistantId ? "✅ VAPI assistant cleaned up" : "⚠️ No assistant to clean up"}\n`
	);
}

/**
 * Quick Demo
 */
export async function quickDemo() {
	console.log("\n⚡ QUICK DEMO\n");
	console.log("-".repeat(40));

	const voiceAgent = new VoiceAgent(true);
	const assistantId = await voiceAgent.createVapiAssistant(
		"Demo",
		"Extract action items."
	);

	if (assistantId) {
		console.log(`✅ Assistant created: ${assistantId}`);
		const analysis = await voiceAgent.analyzeTranscript(
			"Alice: Action: Review code by Friday.",
			{ title: "Demo", participants: ["Alice"] }
		);
		console.log(`✅ Actions: ${analysis.actions.length}`);
		await voiceAgent.deleteVapiAssistant(assistantId);
	}

	console.log("\n" + "=".repeat(40));
	console.log("✅ Quick demo complete\n");
}

// Main
async function main() {
	try {
		await simulateVapiWorkflow();
		await quickDemo();
	} catch (error) {
		console.error("❌ Error:", error);
	}
}

// Run main (playground is meant to be executed directly)
main();
