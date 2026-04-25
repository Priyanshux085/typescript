import { envConfig } from "@collaro/env";
import { VapiClient } from "./client";

const testAgent = new VapiClient({
  apiKey: envConfig.VAPI_API_KEY,
  publicKey: envConfig.VAPI_PUBLIC_KEY,
})

async function testVapi() {
  const token = await testAgent.generateMeetingToken("test-meeting-id", "test-workspace-id");
  console.log("Generated Meeting Token:", token);
}

testVapi();