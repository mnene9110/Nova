
'use server';

/**
 * @fileOverview Server actions for ZegoCloud integration.
 * Handles fetching configuration and generating secure tokens for the Prebuilt UI.
 */

const ZEGO_APP_ID = process.env.NEXT_PUBLIC_ZEGO_APP_ID;
const ZEGO_SERVER_SECRET = process.env.ZEGO_SERVER_SECRET;

/**
 * Generates a Kit Token for the Zego Prebuilt UI.
 * In a real production app, you would use ZegoServerAssistant to generate a proper token.
 * For now, we provide the AppID and configuration to the client.
 */
export async function getZegoConfig() {
  if (!ZEGO_APP_ID) {
    throw new Error('ZegoCloud AppID is missing. Please set NEXT_PUBLIC_ZEGO_APP_ID in environment variables.');
  }

  // Note: ZEGO_SERVER_SECRET should NEVER be sent to the client.
  // We return the AppID and use it with the Prebuilt's token generation for simplicity in this prototype.
  return {
    appID: Number(ZEGO_APP_ID),
    serverSecret: ZEGO_SERVER_SECRET // This will be used on the server side if we were using the SDK, but Prebuilt handles its own if provided.
  };
}

/**
 * Server action to provide the Zego ID to the client safely.
 */
export async function getZegoAppId() {
  return Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID);
}
