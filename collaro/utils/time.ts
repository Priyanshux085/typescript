type params = "1h" | "1d" | "7d"

export function expirationTimeMap(time: params): Date {
  switch (time) {
    case "1h":
      return new Date(Date.now() + 60 * 60 * 1000);
    case "1d":
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    case "7d":
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    default:
      throw new Error("Invalid time parameter");
  }
}