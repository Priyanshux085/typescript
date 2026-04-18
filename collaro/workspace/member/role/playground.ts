import { User } from "@collaro/user";
import { RoleManager } from "./index";
import { generateUserName, generateWorkspaceSlug } from "@collaro/utils";
import { WorkspaceMemberManager } from "@collaro/manager";

const workspaceManager = new WorkspaceMemberManager();
const userService = new User();

async function AvengersWorkspacePlayground() {
  const tony = userService.createUser({
    name: "Tony Stark",
    email: "tony.stark@gmail.com",
    password: "password123",
    userName: generateUserName("Tony Stark"),
  })

  const steve = userService.createUser({
    name: "Steve Rogers",
    email: "steve.rogers@gmail.com",
    password: "password123",
    userName: generateUserName("Steve Rogers"),
  })
  
  const workspace = await workspaceManager.createWorkspace({
    name: "Avengers",
    description: "Workspace for the Avengers team",
    ownerId: tony.id,
    slug: generateWorkspaceSlug("Avengers"),
    subscription: "enterprise",
  });

  const roleService = new RoleManager(workspace.id, workspace.subscription);

  const tonyMember = await workspaceManager.listMemberDetails({
    userID: tony.id,
    workspaceId: workspace.id,
  });

  await workspaceManager.requestWorkspace(workspace.id, steve.id);

  const pendingRequests = await workspaceManager.listRequests(workspace.id);

  await workspaceManager.approveJoinRequest(
    pendingRequests[0]!.id,
    tonyMember!.id
  );

  await roleService.createCustomRole(
    "Moderator", 
    ["read:meeting", "update:meeting", "delete:meeting", "export_data:meeting_data"], 
    {
      description: "Can moderate meetings and export member data",
    },
    workspace.id 
  );

  await roleService.createCustomRole(
    "Viewer", 
    ["read:meeting"], 
    {
      description: "Can only view meetings",
    },
    workspace.id 
  );

  await roleService.createCustomRole(
    "Analytics Manager", 
    ["read:meeting", "export_data:meeting_data"], 
    {
      description: "Can view meetings and export member data",
    },
    workspace.id
  )

  // PRINT:: Get Workspace Roles by Workspace ID
  const roles = await roleService.getRolesForWorkspace(workspace.id);
  console.log("Roles in Workspace:", roles);
}

async function  playground() {
  await AvengersWorkspacePlayground();  
}

playground();