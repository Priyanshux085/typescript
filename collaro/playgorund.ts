import { WorkspaceMemberManager, WorkspaceMeetingManager } from "@collaro/manager";
import { User } from "@collaro/user";
import { generateUserName, generateWorkspaceSlug } from "./utils/generate";

const userService = new User();
const workspaceManager = new WorkspaceMemberManager();
const meetingManager = new WorkspaceMeetingManager();

async function main() {
  try {
    const user01 = await userService.createUser({
      name: "Tony Stark",
      email: "tony.stark@avengers.com",
      password: "password123",
      userName: generateUserName("Tony Stark")
    });
    
    const avengers = await workspaceManager.createWorkspace({
      name: "Team Avengers",
      description: "Workspace for the Avengers team",
      ownerId: user01.id,
      slug: generateWorkspaceSlug("Team Avengers")
    });
    
    const memberDetails = await workspaceManager.listMemberDetails({
      userID: user01.id,
      workspaceId: avengers.id
    });
    
    const avengersMeeting = await meetingManager.createMeeting({
      title: "Avengers Initiative Planning",
      description: "Discuss the details of the Avengers initiative Project.",
      createdBy: memberDetails!.id,
      status: "Scheduled",
      workspaceId: avengers.id,
      startTime: new Date(Date.now() + 60 * 60 * 1000), // Schedule for 1 hour later
    }, avengers.id);
    console.log("Created Meeting:", avengersMeeting);

    const user02 = await userService.createUser({
      name: "Steve Rogers",
      email: "steve.rogers@avengers.com",
      password: "password123",
      userName: "steve_rogers"
    });
      
    // Steve Rogers joins the Avengers workspace
    await workspaceManager.requestWorkspace(avengers.id, user02.id);

    const memberDetails02 = await workspaceManager.listMemberDetails({
      userID: user02.id,
      workspaceId: avengers.id
    });
    console.log("Member Details for Steve Rogers in Avengers workspace:", memberDetails02);

    await meetingManager.joinMeeting(avengersMeeting.id, memberDetails02!.id);
    console.log("Steve Rogers joined the meeting:", avengersMeeting.title);

    // const fantasticFour = workspaceManager.createWorkspace({
    //   name: "Fantastic Four",
    //   description: "Workspace for the Fantastic Four team",
    //   ownerId: user02.id,
    //   slug: generateWorkspaceSlug("Fantastic Four")
    //   });
        
    // const memberDetails02 = await workspaceManager.getMemberDetails({
    //   userID: user02.id,
    //   workspaceId: fantasticFour.id
    // });
    // console.log("Member Details for Steve Rogers in Fantastic Four workspace:", memberDetails02);
    
    const participants = await meetingManager.listParticipants(avengersMeeting.id);
    console.log("Meeting Participants:", participants);
          
  } catch (error) {
  console.error("Error joining meeting:", error);
  }
}

await main();