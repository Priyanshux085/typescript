import { WorkspaceMemberManager } from "@collaro/manager/workspace-manager";
import { workspaceNotification } from "@collaro/notification";
import { User } from "@collaro/user";

async function main() {
  const workspaceManager = new WorkspaceMemberManager();
  const userService = new User();
  const notificationService = workspaceNotification

  // Create Users
  const user01 = await userService.createUser({
    name: "Tony Stark",
    email: "tony@avengers.com",
    password: "password123",
    userName: "tony_stark"
  });

  const user02 = await userService.createUser({
    name: "Steve Rogers",
    email: "captain@avengers.com",
    password: "password123",
    userName: "steve_rogers"
  });

  const user03 = await userService.createUser({
    name: "Bruce Wayne",
    email: "bruce@dc.com",
    password: "password123",
    userName: "bruce_wayne"
  });

  // Create Workspaces
  const workspace = await workspaceManager.createWorkspace({
    name: "Avengers",
    description: "This is a test workspace",
    ownerId: user01.id,
    slug: "test-workspace"
  });

  const workspace2 = await workspaceManager.createWorkspace({
    name: "Justice League",
    description: "Workspace for the Justice League team",
    ownerId: user03.id,
    slug: "justice_league"
  });

  // Request to join workspace
  await workspaceManager.requestWorkspace(workspace.id, user02.id);

  const requests = await workspaceManager.listRequests(workspace.id);
  if(!requests || !requests[0]) return;

  const request_01 = requests[0];
  
  // Get member details
  const member_01 = await workspaceManager.listMemberDetails({
    userID: user01.id,
    workspaceId: workspace.id
  });

  const member_03 = await workspaceManager.listMemberDetails({
    userID: user03.id,
    workspaceId: workspace2.id
  })

  await workspaceManager.requestWorkspace(workspace2.id, user01.id);
  
  // Approve join request
  try {
    await workspaceManager.approveJoinRequest(request_01.id, member_01!.id);
    
    const member_02 = await workspaceManager.listMemberDetails({
      userID: user02.id,
      workspaceId: workspace.id
    })
    
    await workspaceManager.removeMemberFromWorkspace(workspace.id, member_02!.id);

    // Updaete the workspace description to trigger a notification
    await workspaceManager.updateWorkspace(workspace.id, { description: "Updated description to trigger notification" }, member_01!.id);
    
    const workspace_02_Requests = await workspaceManager.listRequests(workspace2.id);

    await workspaceManager.approveJoinRequest(workspace_02_Requests[0]!.id, member_03!.id);

    await workspaceManager.updateWorkspace(
      workspace2.id, {
        description: "Updated description to trigger notification for Justice League workspace",
        name: "Justice League Updated",
        logoUrl: "https://example.com/new-logo.png",
      }, 
      member_03!.id
    );

    const user_01_workspace_02_MemberDetails = await workspaceManager.listMemberDetails({
      userID: user01.id,
      workspaceId: workspace2.id
    });

    await workspaceManager.updateWorkspace(
      workspace2.id, {
        description: "Updated description again to trigger notification for Justice League workspace",
        name: "Justice League Updated Again",
      }, 
      user_01_workspace_02_MemberDetails!.id
    )
  } catch (error) {
    console.error("Error approving join request:", error);
  }

  // Fetch notifications AFTER approval
  const notifications = await notificationService.listNotifications(user01.id);
  console.log("Notification for Tony Stark: \n");
  for (const notification of notifications) {
    console.log("==> " + notification.message + "\n (Read: " + notification.read + ", Created At: " + 
      notification.createdAt.toDateString() + ", Type: " + notification.type + " ) \n");
  }
  console.log("===================================\n");

  const steveNotifications = await notificationService.listNotifications(user02.id);
  console.log("Notification for Steve Rogers: \n");
  for (const notification of steveNotifications) {
    console.log("==> " + notification.message + "\n (Read: " + notification.read + ", Created At: " + 
      notification.createdAt.toDateString() + ", Type: " + notification.type + " ) \n");
  }

  console.log("===================================\n");

  const bruceNotifications = await notificationService.listNotifications(user03.id);
  console.log("Notification for Bruce Wayne: \n");
  for (const notification of bruceNotifications) {
    console.log("==> " + notification.message + "\n (Read: " + notification.read + ", Created At: " + 
      notification.createdAt.toDateString() + ", Type: " + notification.type + " ) \n");
  }
}

main().catch(console.error);