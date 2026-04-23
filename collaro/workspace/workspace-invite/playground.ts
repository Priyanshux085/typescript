import { justiceLeagueWorkspace, workspaceService } from "../playground";
import { User } from "@collaro/user";

const newMemberEmail = "tony.stark@marvel.com";

const emailInvite = await workspaceService.createInvite({
  workspaceId: justiceLeagueWorkspace.id,
  type: "email",
  invitedEmail: newMemberEmail,
  role: "member",
  expirationTime: "7d",
});

await workspaceService.createInvite({
  workspaceId: justiceLeagueWorkspace.id,
  type: "email",
  invitedEmail: "peter.parker@marvel.com",
  role: "admin",
  expirationTime: "1d",
  reason: "Team Lead"
});

const userService = new User();
const newColluroUser = userService.createUser({
  name: "Stark Industries CEO",
  userName: "tony.stark",
  email: "tony.stark.collaro@marvel.com",
  password: "ironman123",
});

const userIdInvite = await workspaceService.createInvite({
  workspaceId: justiceLeagueWorkspace.id,
  type: "userId",
  invitedUserId: newColluroUser.id,
  role: "member",
  expirationTime: "7d",
});

const ironManUser = userService.createUser({
  name: "Tony Stark",
  userName: "ironman",
  email: "tony.stark@marvel.com",
  password: "ironman456",
});

try {
  const acceptedMember = await workspaceService.acceptInvite(
    userIdInvite.id,
    newColluroUser.id
  );

  console.log("✓ UserId invite accepted successfully \n", acceptedMember);
} catch (error) {
  console.log("✗ Error accepting userId invite:", (error as Error).cause);
}

try {
  const acceptedEmailMember = await workspaceService.acceptInviteByEmail(
    emailInvite.id,
    newMemberEmail,
    ironManUser.id
  );

  console.log("✓ Email invite accepted successfully \n", acceptedEmailMember);
} catch (error) {
  console.log("✗ Error accepting email invite:", (error as Error).cause);
}

const anotherUser = userService.createUser({
  name: "Steve Rogers",
  userName: "captain_america",
  email: "steve.rogers@marvel.com",
  password: "shield123",
});

await workspaceService.createInvite({
  workspaceId: justiceLeagueWorkspace.id,
  type: "userId",
  invitedUserId: anotherUser.id,
  role: "member",
  expirationTime: "7d",
});