import { StreamClient } from "@stream-io/node-sdk";
import { config, type TStreamClientParams } from "./env";

const params: TStreamClientParams = [config.apiKey, config.secret];

export const streamClient = new StreamClient(...params);

// Client-side utilities
export type TClientStreamParams = {
  apiKey: string;
  userId: string;
  callToken: string;
};

/**
 * Creates a client-side video client configuration
 * This should be called client-side with the token from the server
 */
export const createClientVideoConfig = (params: TClientStreamParams) => ({
  apiKey: params.apiKey,
  user: { id: params.userId },
  token: params.callToken,
});