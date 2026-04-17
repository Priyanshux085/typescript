import {
  // PrivateMeeting,
  TeamMeeting,
} from "./index";

import { User } from "@collaro/user";
// import { ID } from "@collaro/utils/generate";
import { WorkspaceMemberManager } from "@collaro/member";

async function main() {

  const userService = new User();

  const user_01 = await userService.createUser({
    email: "john@example.com",
    name: "John Doe",
    password: "password123",
    userName: "john_doe",
  })

  // Create a private meeting
  // const privateMeeting = new PrivateMeeting({
  //   id: ID.meetingId("Private Meeting"),
  //   title: "Private Meeting",
  //   description: "This is a private meeting",
  //   createdAt: new Date(),
  //   createdBy: user_01.id,
  //   participants: {
  //     [String(user_01.id)]: user_01.id
  //   },
  //   status: "Ongoing",
  //   startTime: new Date(),
  //   endTime: null,
  // });

  const workspace = new WorkspaceMemberManager()

  const createdWorkspace = await workspace.createWorkspace({
		name: "Workspace 1",
		description: "This is the first workspace",
		ownerId: user_01.id,
		slug: "workspace-1",
		subscription: "free",
	});

  const member = await workspace.listMemberDetails({
    userID: user_01.id,
    workspaceId: createdWorkspace.id,
  });

  if (!member) {
    console.log(`Member with user ID: ${user_01.id} not found in workspace ID: ${createdWorkspace.id}`);
    return;
  }

  const teamMeetingInput = new TeamMeeting();

  const meeting = await teamMeetingInput.createMeeting({
    workspaceId: createdWorkspace.id,
    title: "Team Meeting",
    description: "This is a team meeting",
    createdBy: member.id,
    startTime: new Date(),
    status: "Ongoing",
    endTime: null
  })

  console.log("Created team meeting:", meeting);
}

main().catch(console.error);