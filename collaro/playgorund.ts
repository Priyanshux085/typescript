import { WorkspaceMemberManager, WorkspaceMeetingManager } from "@collaro/manager";
import { User } from "@collaro/user";
import { generateUserName, generateWorkspaceSlug } from "./utils/generate";

const userService = new User();
const workspaceManager = new WorkspaceMemberManager();
const meetingManager = new WorkspaceMeetingManager();

async function main() {
  try {
    const user01 = userService.createUser({
      name: "Tony Stark",
      email: "tony.stark@avengers.com",
      password: "password123",
      userName: generateUserName("Tony Stark")
    });
    
    const avengers = workspaceManager.createWorkspace({
      name: "Team Avengers",
      description: "Workspace for the Avengers team",
      ownerId: user01.id,
      slug: generateWorkspaceSlug("Team Avengers")
    });
    
    const memberDetails = await workspaceManager.getMemberDetails({
      userID: user01.id,
      workspaceId: avengers.id
    });
    
    const meeting = await meetingManager.createMeeting({
      title: "Avengers Initiative Planning",
      description: "Discuss the details of the Avengers initiative Project.",
      createdBy: memberDetails!.id,
      status: "Scheduled",
      workspaceId: avengers.id,
      startTime: new Date(Date.now() + 60 * 60 * 1000), // Schedule for 1 hour later
    }, avengers.id);
    console.log("Created Meeting:", meeting);
    
    const user02 = userService.createUser({
      name: "Steve Rogers",
      email: "steve.rogers@avengers.com",
      password: "password123",
      userName: "steve_rogers"
    });
    
    const fantasticFour = workspaceManager.createWorkspace({
      name: "Fantastic Four",
      description: "Workspace for the Fantastic Four team",
      ownerId: user02.id,
      slug: generateWorkspaceSlug("Fantastic Four")
    });
    
    const memberDetails02 = await workspaceManager.getMemberDetails({
      userID: user02.id,
      workspaceId: fantasticFour.id
    });
    console.log("Member Details for Steve Rogers in Fantastic Four workspace:", memberDetails02);

    workspaceManager.joinWorkspace(avengers.id, user02.id);
    
    console.log("Added Steve Rogers to Avengers workspace:", workspaceManager.listMembers(avengers.id));
  } catch (error) {
  console.error("Error joining meeting:", error);
  }
}

await main();