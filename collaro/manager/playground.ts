import { User } from "@collaro/user";
import {
	WorkspaceRoleManager as RoleManager,
	WorkspaceMeetingManager,
	WorkspaceMemberManager,
} from "./";

async function playground() {
	const memberManager = new WorkspaceMemberManager();
	const meetingManager = new WorkspaceMeetingManager();
	const userService = new User();

	const batman = userService.createUser({
		name: "Bruce Wayne",
		email: "batman@justiceleague.com",
		password: "darkknight",
		userName: "batman",
	});
	const wonderWoman = userService.createUser({
		name: "Diana Prince",
		email: "wonderwoman@justiceleague.com",
		password: "lasso",
		userName: "wonderwoman",
	});
	const superman = userService.createUser({
		name: "Clark Kent",
		email: "superman@justiceleague.com",
		password: "kryptonite",
		userName: "superman",
	});
	const flashUser = userService.createUser({
		name: "Barry Allen",
		email: "flash@justiceleague.com",
		password: "speedforce",
		userName: "flash",
	});
	const aquamanUser = userService.createUser({
		name: "Arthur Curry",
		email: "aquaman@justiceleague.com",
		password: "trident",
		userName: "aquaman",
	});

	const workspace = await memberManager.createWorkspace({
		name: "Justice League",
		description: "A team of superheroes",
		ownerId: batman.id,
		subscription: "enterprise",
		slug: "justice-league",
		logoUrl: "https://example.com/logo.png",
	});

	new RoleManager(workspace.id, workspace.subscription);

	await memberManager.requestWorkspace(workspace.id, wonderWoman.id);
	await memberManager.requestWorkspace(workspace.id, superman.id);
	await memberManager.requestWorkspace(workspace.id, flashUser.id);
	const requests = await memberManager.listRequests(workspace.id);

	for (let i = 0; i < requests.length - 1; i++) {
		await memberManager.approveJoinRequest(
			requests[i]!.id,
			workspace.ownerDetail.id
		);
	}

	const pendingRequests = await memberManager.listRequests(workspace.id);
	if (pendingRequests.length > 0) {
		await memberManager.rejectJoinRequest(
			pendingRequests[0]!.id,
			workspace.ownerDetail.id
		);
	}

	const wonderWomanMember = await memberManager.listMemberDetails({
		userID: wonderWoman.id,
		workspaceId: workspace.id,
	});

	await memberManager.updateWorkspace(
		workspace.id,
		{
			name: "Justice League (Updated)",
			description: "A team of superheroes - protecting the world",
		},
		workspace.ownerDetail.id
	);

	await memberManager.requestWorkspace(workspace.id, aquamanUser.id);

	const newRequests = await memberManager.listRequests(workspace.id);
	const aquamanRequest = newRequests.find((r) => r.userId === aquamanUser.id);
	if (aquamanRequest) {
		await memberManager.approveJoinRequest(
			aquamanRequest.id,
			workspace.ownerDetail.id
		);
	}

	const aquamanMember = await memberManager.listMemberDetails({
		userID: aquamanUser.id,
		workspaceId: workspace.id,
	});

	const JusticeLeagueMeeting = await meetingManager.createMeeting({
		createdBy: workspace.ownerDetail.id,
		title: "Weekly Sync",
		meetingType: "Instant",
		description: "Weekly team sync-up meeting",
		workspaceId: workspace.id,
	});

	console.log(
		`✓ Meeting created \n: ${JusticeLeagueMeeting.title} (ID: ${JusticeLeagueMeeting.id})`
	);

	// Superman tries to create a meeting without being a member.
	await meetingManager.joinMeeting(
		JusticeLeagueMeeting.id,
		wonderWomanMember!.id
	);

	await meetingManager.joinMeeting(
		JusticeLeagueMeeting.id,
		workspace.ownerDetail.id
	);

	await meetingManager.getMeeting(JusticeLeagueMeeting.id);

	await meetingManager.joinMeeting(JusticeLeagueMeeting.id, aquamanMember!.id);

	// await meetingManager.joinMeeting(
	// 	JusticeLeagueMeeting.id,
	// 	flashUser.id as unknown as TMemberId
	// );

	await meetingManager.endMeeting(JusticeLeagueMeeting.id);

	const fullMeetingDetail = await meetingManager.getFullMeetingDetail(
		JusticeLeagueMeeting.id
	);
	console.log("Detail", fullMeetingDetail);

	const batmanNotifications = await userService.listNotifications(batman.id);
	const wonderWomanNotifications = await userService.listNotifications(
		wonderWoman.id
	);

  console.log("Meeting notifications for Batman", batmanNotifications);
	console.log("Meeting notifications for Wonder", wonderWomanNotifications);
}

playground()