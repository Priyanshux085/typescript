import { Polar, HTTPClient, Fetcher, ServerSandbox, ServerProduction } from "@polar-sh/sdk";
import { polarEnv } from "./env";
import { IPolarConfig } from "./interface";

const client = new HTTPClient({
  fetcher: async (url, options) => {
    console.log("Fetching URL:", url);
    console.log("Options:", options);
    const fetcher: Fetcher = (input, init) => {
      if (!init) {
        return fetch(input);
      } else {
        return fetch(input, init);
      }
    }
    
    return fetcher(url, options);
  }
});

const isProduction = process.env.NODE_ENV === "production";

export const defaultProductId = polarEnv.products.freePlan;

export const config: IPolarConfig = {
  accessToken: polarEnv.accessToken,
  server: isProduction ? ServerProduction : ServerSandbox,
  httpClient: client,
  retryConfig: {
    strategy: "backoff",
    backoff: {
      maxInterval: 10000,
      initialInterval: 1000,
      exponent: 2,
      maxElapsedTime: 60000,
    },
  },
  timeoutMs: 30000,
}

export const polar = new Polar(config);