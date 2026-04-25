import { TWorkspaceId } from "@collaro/meeting";
import { VoiceAgent } from "./class";

const voiceAgent = new VoiceAgent(true);

async function testVoiceAgent() {
  const workspaceId = "workspace_123" as unknown as TWorkspaceId;
  const agentConfig = await voiceAgent.createAgent(workspaceId, {
    name: "Test Agent",
    enabled: true,
    workspaceId,
    role: "note-taker",
    voiceProvider: "elevenlabs",
    voiceModel: "gpt-4.1",
    language: "en-US",
    systemPrompt: "You are a helpful assistant that summarizes meetings and extracts action items.",
  });
  console.log("Created Agent Config:", agentConfig);
}

testVoiceAgent();