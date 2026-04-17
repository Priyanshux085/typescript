import { TCreateUserInput, User } from "@collaro/user";
import { WorkspaceMemberManager } from "@collaro/manager";
import { generateUserName } from "@collaro/utils/generate";

const workspaceMemberManager = new WorkspaceMemberManager();
const userService = new User();

// Create a new user to be added as a member to the workspace
const newUser = await userService.createUser({
  name: "Jane Doe",
  email: "jane.doe@example.com",
  password: "securepassword",
  userName: "janedoe",
}); 

// Create a new workspace
const workspace = await workspaceMemberManager.createWorkspace({
	name: "Project Alpha",
	description: "Workspace for Project Alpha",
	slug: "project-alpha",
	ownerId: newUser.id,
	subscription: "free",
});

const secondUserInput: TCreateUserInput = {
  name: "Bob Smith",
  email: "bob.smith@example.com",
  password: "securepassword",
  userName: generateUserName("Bob Smith"),
}

const secondUser = await userService.createUser(secondUserInput);

const user_01_Details = await workspaceMemberManager.listMemberDetails({
  userID: newUser.id,
  workspaceId: workspace.id
});

await workspaceMemberManager.requestWorkspace(workspace.id, secondUser.id)

const [joinRequests] = await workspaceMemberManager.listRequests(workspace.id);

const approvedMember = await workspaceMemberManager.approveJoinRequest(joinRequests!.id,user_01_Details!.id);

console.log("Added member details:", approvedMember);

await workspaceMemberManager.findWorkspaceById(workspace.id);