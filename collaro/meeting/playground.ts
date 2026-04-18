import { WorkspaceMeetingManager } from "../manager/workspace-meeting-manager";
import { WorkspaceMemberManager } from "../manager";
import { User } from "@collaro/user";

const workspaceManager = new WorkspaceMemberManager();
const meetingManager = new WorkspaceMeetingManager();
const user = new User();

async function AvengersMeetingPlayground() {
	const tony = user.createUser({
		name: "Tony Stark",
		email: "tony.stark@example.com",
		password: "password123",
		userName: "tony.stark",
	});

	const steve = user.createUser({
		name: "Steve Rogers",
		email: "steve.rogers@avengers.com",
		password: "password123",
		userName: "steve.rogers",
	});

	const avengersWorkspace = await workspaceManager.createWorkspace({
		name: "Avengers",
		description: "Workspace for the Avengers team",
		ownerId: tony.id,
		slug: "avengers-workspace",
		subscription: "enterprise",
	});

	const tonyMember = await workspaceManager.listMemberDetails({
		userID: tony.id,
		workspaceId: avengersWorkspace.id,
	});

	await workspaceManager.requestWorkspace(avengersWorkspace.id, steve.id);

	const pendingRequests = await workspaceManager.listRequests(
		avengersWorkspace.id
	);

	await workspaceManager.approveJoinRequest(
		pendingRequests[0]!.id,
		tonyMember!.id
	);

	const steveMember = await workspaceManager.listMemberDetails({
		userID: steve.id,
		workspaceId: avengersWorkspace.id,
	});

	// Create a meeting in the Avengers workspace
	const meeting = await meetingManager.createMeeting({
		createdBy: tonyMember!.id,
		workspaceId: avengersWorkspace.id,
		status: "Scheduled",
		title: "Strategy Meeting",
		meetingType: "Instant",
		description: "Discuss strategy for the upcoming mission",
		startTime: new Date(Date.now() + 60 * 60 * 1000),
	});

	await meetingManager.joinMeeting(meeting.id, steveMember!.id);

	// console.log("Meeting created successfully in the Avengers workspace!");
	// user.listNotifications(tony.id).then((notifications) => {
	// 	console.log(`Notifications for ${tony.name}:`, notifications);
	// });

	// user.listNotifications(steve.id).then((notifications) => {
	// 	console.log(`Notifications for ${steve.name}:`, notifications);
	// });

	meetingManager.listParticipants(meeting.id).then((participants) => {
		console.log(`Participants in meeting ${meeting.title}:`, participants);
	});

	meetingManager.getMeeting(meeting.id).then((meetingDetails) => {
		console.log(`Details of meeting ${meeting.title}:`, meetingDetails);
	});
}

async function playground() {
	await AvengersMeetingPlayground();
}

playground();
