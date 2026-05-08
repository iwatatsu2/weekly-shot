import { messagingApi, validateSignature } from "@line/bot-sdk";

export const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || "",
});

export function verifySignature(body: string, signature: string): boolean {
  return validateSignature(body, process.env.LINE_CHANNEL_SECRET!, signature);
}
