import { GetOrCreateCallRequest } from "@stream-io/node-sdk";
import { streamClient, secondStreamClient } from "./stream";
import {} from "@collaro/meeting";
import { WorkspaceMeetingManager, WorkspaceMemberManager } from "@collaro/manager";
import { User } from "@collaro/user";
import { IMemberDTO } from "@collaro/workspace/role/member";

const meetingService = new WorkspaceMeetingManager();
const workspaceService = new WorkspaceMemberManager();
const userService = new User();


const user = await userService.createUser({
  name: "Steve Rogers",
  userName: "captainamerica",
  email: "steve.rogers@example.com",
  password: "supersecretpassword",
});

const steveWorkspace = await workspaceService.createWorkspace({
  name: "Avengers Headquarters",
  description: "The main base of operations for the Avengers.",
  ownerId: user.id,
  slug: "avengers",
  subscription: "enterprise",
});

streamClient.upsertUsers([{
  id: String(user.id),
  name: user.name,
  custom: {
    email: user.email,
    userName: user.userName,
  },
  image: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
  role: steveWorkspace.ownerDetail.role,
  teams: [steveWorkspace.slug],
}])

const meeting = await meetingService.createMeeting({
  createdBy: steveWorkspace.ownerDetail.id,
  workspaceId: steveWorkspace.id,
  title: "Weekly Avengers Meeting",
  description: "Discussing the latest threats and missions.",
  meetingType: "Instant",
  callerDetail: {
    ...steveWorkspace.ownerDetail
  }
});

type TSreamMemberDTO = {
  user_id: string;
  role: IMemberDTO["role"];
  custom: {
    memberId: string;
    workspaceId: string;
    slug: string;
    name: string;
  }
}

type TCallData = GetOrCreateCallRequest & { 
  data: {
    members: TSreamMemberDTO[];
  }
};

const DEFAULT_CALL_SETTING = {
  ring: true,
  video: true,
}

const callData: TCallData = {
  data: {
    created_by: {
      id: String(steveWorkspace.ownerDetail.userId),
      name: steveWorkspace.ownerDetail.name,
      custom: {
        email: user.email,
        userName: user.userName,
      }
    },
    members: [{
      user_id: String(steveWorkspace.ownerDetail.userId),
      role: steveWorkspace.ownerDetail.role,
      custom: {
        memberId: String(steveWorkspace.ownerDetail.id),
        workspaceId: String(steveWorkspace.id),
        slug: steveWorkspace.slug,
        name: steveWorkspace.ownerDetail.name,
      }
    }]
  },
  ...DEFAULT_CALL_SETTING,
}

const call = await streamClient.video.call(meeting.meetingType, String(meeting.id));

streamClient.updateApp({
  multi_tenant_enabled: true,
})
  
await call.getOrCreate(callData);

const userTony = await userService.createUser({
  name: "Tony Stark",
  userName: "ironman",
  email: "tony@avengers.com",
  password: "iamironman",
});

await workspaceService.requestWorkspace(steveWorkspace.id, userTony.id);
const requests = await workspaceService.listRequests(steveWorkspace.id);
const tonyMember = await workspaceService.approveJoinRequest(requests[0]!.id, steveWorkspace.ownerDetail.id);

// Stream Client Upsert User for Tony
await secondStreamClient.upsertUsers([{
  id: String(tonyMember.userId),
  name: tonyMember.name,
  custom: {
    email: userTony.email,
    userName: userTony.userName,
  },
  image: `https://ui-avatars.com/api/?name=${encodeURIComponent(tonyMember.name)}&background=random`,
  role: tonyMember.role,
  teams: [steveWorkspace.slug],
}]);

await call.updateCallMembers({
  update_members: [{
    user_id: String(tonyMember.userId),
    role: tonyMember.role,
    custom: {
      memberId: String(tonyMember.id),
      workspaceId: String(steveWorkspace.id),
      slug: steveWorkspace.slug,
      name: tonyMember.name,
    }
  }]
})

await call.ring({
  members_ids: [String(tonyMember.userId)],
})

await meetingService.joinMeeting(meeting.id, tonyMember.id);

// ============================================
// STEP 1: Server generates call token for Tony
// ============================================
const tonyCallToken = streamClient.generateCallToken({
  user_id: String(tonyMember.userId),
  call_cids: [`Instant:${meeting.id}`],
  validity_in_seconds: 3600,
});

/**
 * ============================================
 * STEP 2: Send to client (via API response)
 * ============================================
 * 
 * In a real Express/Next.js endpoint:
 * 
 * res.json({
 *   success: true,
 *   data: {
 *     callToken: tonyCallToken,
 *     callId: String(meeting.id),
 *     callType: meeting.meetingType,
 *     userId: String(tonyMember.userId),
 *     apiKey: process.env.STREAM_API_KEY, // Public API key
 *   }
 * })
 */

console.log("Token sent to Tony's client:", {
  callToken: tonyCallToken,
  callId: String(meeting.id),
  callType: meeting.meetingType,
  userId: String(tonyMember.userId),
})

/**
 * ============================================
 * STEP 3: Client-side Tony joins with token
 * ============================================
 * 
 * Tony's browser receives the response and:
 * 
 * import { joinCall } from '@collaro/stream/client-join-call'
 * 
 * const { client, call } = await joinCall({
 *   callToken,
 *   callType,
 *   callId,
 *   userId,
 *   apiKey: process.env.REACT_APP_STREAM_API_KEY,
 * })
 * 
 * Then render with:
 * <StreamProvider
 *   apiKey={apiKey}
 *   userId={userId}
 *   callToken={callToken}
 *   callType={callType}
 *   callId={callId}
 * >
 *   <DefaultCallLayout />
 * </StreamProvider>
 */