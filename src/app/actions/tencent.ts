
'use server';

import crypto from 'crypto';

/**
 * @fileOverview Server action to generate Tencent Cloud TRTC UserSig.
 * Uses the SDKAppID and SecretKey to sign user sessions.
 */

const SDKAPPID = Number(process.env.NEXT_PUBLIC_TENCENT_SDK_APP_ID);
const SECRETKEY = process.env.TENCENT_SECRET_KEY;

export async function getTencentUserSig(userId: string) {
  if (!SDKAPPID || !SECRETKEY) {
    throw new Error('Tencent Cloud configuration is missing on the server.');
  }

  // EXPIRE_TIME set to 24 hours (86400 seconds)
  const EXPIRE_TIME = 86400;
  const currTime = Math.floor(Date.now() / 1000);
  
  // Base64Url helper
  const base64url = (str: string) => {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const version = 2;
  const userSigContent = {
    'TLS.identifier': userId,
    'TLS.sdkappid': SDKAPPID,
    'TLS.expire': EXPIRE_TIME,
    'TLS.time': currTime,
    'TLS.version': version,
  };

  // Stringify content
  const contentStr = JSON.stringify(userSigContent);
  
  // Create HMAC-SHA256 signature
  const hmac = crypto.createHmac('sha256', SECRETKEY);
  hmac.update(`TLS.identifier:${userId}\nTLS.sdkappid:${SDKAPPID}\nTLS.expire:${EXPIRE_TIME}\nTLS.time:${currTime}\n`);
  const signature = hmac.digest('base64');

  const finalSigObj = {
    'TLS.ver': '2.0',
    'TLS.identifier': userId,
    'TLS.sdkappid': SDKAPPID,
    'TLS.expire': EXPIRE_TIME,
    'TLS.time': currTime,
    'TLS.sig': signature,
  };

  const finalSig = Buffer.from(JSON.stringify(finalSigObj)).toString('base64');
  
  return {
    userSig: base64url(finalSig),
    sdkAppId: SDKAPPID,
  };
}
