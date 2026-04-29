import { ServerSandbox, ServerProduction, HTTPClient, SDKOptions } from "@polar-sh/sdk";

type TPolarConfig = SDKOptions;

export interface IPolarConfig {
  accessToken: string;
  server: typeof ServerProduction | typeof ServerSandbox;
  httpClient?: HTTPClient;
  retryConfig?: TPolarConfig["retryConfig"];
  timeoutMs?: number;
}

export interface IPolarClient {
  config: IPolarConfig;
}