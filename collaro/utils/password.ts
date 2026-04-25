import { password } from "bun";

export async function hashPassword(plainPassword: string): Promise<string> {
  return await password.hash(plainPassword);
}