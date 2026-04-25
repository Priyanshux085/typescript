import { MeetingType } from "@collaro/meeting";
import { streamClient } from "./stream";
import { StreamClient, CallRequest } from "@stream-io/node-sdk";
import { ID } from "@collaro/utils";
import { User } from "@collaro/user";

type TCallType = Parameters<StreamClient["video"]["call"]>[0] & MeetingType;


const callType: TCallType = "Instant" as TCallType;

const CallId = ID.meetingId()

const call = streamClient.video.call(callType, String(CallId));

const userService = new User()

const user = userService.createUser({
  name: "Jack Landers",
  userName: "spd_red",
  email: "jack.landers@spdpowerrangers.com",
  password: "morphintime",
})

type GetCallData = CallRequest["created_by"]

const createCall: GetCallData = {
  id: String(user.id),
  name: user.name,
  image: user.userName,
  custom: {
    email: user.email,
  }
}

call.create({
  data: {
    created_by: createCall
  },
  notify: true,
  ring: true,
  video: true
})