import { TCreateUserInput, User } from "@collaro/user";
import { WorkspaceMemberManager } from "./index";
import { generateUserName } from "@collaro/utils/generate";

const workspaceMemberManager = new WorkspaceMemberManager();
const userService = new User();

// Create a new user to be added as a member to the workspace
const newUser = userService.createUser({
  name: "Jane Doe",
  email: "jane.doe@example.com",
  password: "securepassword",
  userName: "janedoe",
}); 

// Create a new workspace
const workspace = workspaceMemberManager.createWorkspace({
  name: "Project Alpha",
  description: "Workspace for Project Alpha",
  slug: "project-alpha",
  ownerId: newUser.id,
  createdAt: new Date(),
  updatedAt: null,
});

const secondUserInput: TCreateUserInput = {
  name: "Bob Smith",
  email: "bob.smith@example.com",
  password: "securepassword",
  userName: generateUserName("Bob Smith"),
}

const secondUser = userService.createUser(secondUserInput);

workspaceMemberManager.addMemberToWorkspace(workspace.id, secondUser.id);
console.log("Added member details:", secondUser);

workspaceMemberManager.getWorkspaceMembers(workspace.id);