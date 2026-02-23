import * as msal from '@azure/msal-node';
import { admin, db } from './firebase-admin';

const msalConfig: msal.Configuration = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID || '',
    authority: `https://login.microsoftonline.com/common`,
    clientSecret: process.env.AZURE_CLIENT_SECRET || '',
  }
};

const pca = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Generates the Outlook Auth URL
 */
export const getAuthUrl = async (teacherId: string) => {
  const authCodeUrlParameters = {
    scopes: ["https://graph.microsoft.com/Calendars.ReadWrite", "offline_access"],
    redirectUri: process.env.OUTLOOK_REDIRECT_URI || '',
    state: teacherId,
  };

  return await pca.getAuthCodeUrl(authCodeUrlParameters);
};

/**
 * Acquires token by code and saves to Firestore
 */
export const acquireTokenByCode = async (code: string, teacherId: string) => {
  const tokenRequest = {
    code: code,
    scopes: ["https://graph.microsoft.com/Calendars.ReadWrite", "offline_access"],
    redirectUri: process.env.OUTLOOK_REDIRECT_URI || '',
  };

  const response = await pca.acquireTokenByCode(tokenRequest);
  
  await db.collection('teachers').doc(teacherId).set({
    outlookAccessToken: response.accessToken,
    outlookRefreshToken: (response as any).refreshToken, // MSAL response might have it if offline_access was requested
    outlookTokenExpiry: response.expiresOn ? response.expiresOn.getTime() : 0,
    outlookCalendarConnected: true,
    outlookCalendarConnectedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return response;
};

/**
 * Gets authenticated access token for a teacher, refreshing if necessary
 */
export const getAccessToken = async (teacherId: string) => {
  const teacherDoc = await db.collection('teachers').doc(teacherId).get();
  const data = teacherDoc.data();

  if (!data || !data.outlookRefreshToken) {
    throw new Error("Outlook calendar not connected.");
  }

  const refreshTokenRequest = {
    refreshToken: data.outlookRefreshToken,
    scopes: ["https://graph.microsoft.com/Calendars.ReadWrite"],
  };

  const response = await pca.acquireTokenByRefreshToken(refreshTokenRequest);
  
  if (response) {
    await db.collection('teachers').doc(teacherId).update({
      outlookAccessToken: response.accessToken,
      outlookRefreshToken: (response as any).refreshToken || data.outlookRefreshToken,
      outlookTokenExpiry: response.expiresOn ? response.expiresOn.getTime() : 0,
    });

    return response.accessToken;
  }
  
  throw new Error("Failed to refresh Outlook token.");
};
