import { User } from "@collaro/user";
import {   
  WorkspaceRoleManager as RoleManager,
  // WorkspaceMeetingManager, 
  WorkspaceMemberManager } from "./index";

async function playground() {
  const memberManager = new WorkspaceMemberManager();
  // const meetingManager = new WorkspaceMeetingManager();
  const userService = new User();
  
  // Example usage:
  const batman = userService.createUser({ name: "Bruce Wayne", email: "batman@justiceleague.com", password: "darkknight", userName: "batman" });
  const wonderWoman = userService.createUser({ name: "Diana Prince", email: "wonderwoman@justiceleague.com", password: "lasso", userName: "wonderwoman" });
  const superman = userService.createUser({ name: "Clark Kent", email: "superman@justiceleague.com", password: "kryptonite", userName: "superman" });
  
  const workspace = await memberManager.createWorkspace({ 
    name: "Justice League", 
    description: "A team of superheroes", 
    ownerId: batman.id, 
    subscription: "enterprise", 
    slug: "justice-league",
    logoUrl: "https://example.com/logo.png"
  });

  const roleManager = new RoleManager(workspace.id, workspace.subscription);
  
  await memberManager.requestWorkspace(workspace.id, wonderWoman.id);
  await memberManager.requestWorkspace(workspace.id, superman.id);
  
  const requests = await memberManager.listRequests(workspace.id);

  for (const request of requests) {
    await memberManager.approveJoinRequest(request.id, workspace.ownerDetail.id);
  }

  // const wonderWomanMember = await memberManager.listMemberDetails({ userID: wonderWoman.id, workspaceId: workspace.id });
  // const supermanMember = await memberManager.listMemberDetails({ userID: superman.id, workspaceId: workspace.id });

  console.log("Members in workspace: \n", await memberManager.listMembers(workspace.id));
}

playground()