const msal = require('@azure/msal-node');
const admin = require('firebase-admin');

const msalConfig = {
  auth: {
    clientId: process.env.AZURE_CLIENT_ID,
    authority: `https://login.microsoftonline.com/common`,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
  }
};

const pca = new msal.ConfidentialClientApplication(msalConfig);

/**
 * Generates the Outlook Auth URL
 */
const getAuthUrl = async (teacherId) => {
  const authCodeUrlParameters = {
    scopes: ["https://graph.microsoft.com/Calendars.ReadWrite", "offline_access"],
    redirectUri: process.env.OUTLOOK_REDIRECT_URI,
    state: teacherId,
  };

  return await pca.getAuthCodeUrl(authCodeUrlParameters);
};

/**
 * Acquires token by code and saves to Firestore
 */
const acquireTokenByCode = async (code, teacherId) => {
  const tokenRequest = {
    code: code,
    scopes: ["https://graph.microsoft.com/Calendars.ReadWrite", "offline_access"],
    redirectUri: process.env.OUTLOOK_REDIRECT_URI,
  };

  const response = await pca.acquireTokenByCode(tokenRequest);
  
  await admin.firestore().collection('teachers').doc(teacherId).set({
    outlookAccessToken: response.accessToken,
    outlookRefreshToken: response.refreshToken,
    outlookTokenExpiry: response.expiresOn.getTime(),
    outlookCalendarConnected: true,
    outlookCalendarConnectedAt: admin.firestore.FieldValue.serverTimestamp()
  }, { merge: true });

  return response;
};

/**
 * Gets authenticated access token for a teacher, refreshing if necessary
 */
const getAccessToken = async (teacherId) => {
  const teacherDoc = await admin.firestore().collection('teachers').doc(teacherId).get();
  const data = teacherDoc.data();

  if (!data || !data.outlookRefreshToken) {
    throw new Error("Outlook calendar not connected.");
  }

  // MSAL-node doesn't automatically handle refresh tokens for custom storage easily in this way
  // but acquireTokenByRefreshToken is what we need. 
  // Note: msal-node's acquireTokenSilent is preferred if we have a cache.
  // For simplicity here, we use the refresh token.
  
  const refreshTokenRequest = {
    refreshToken: data.outlookRefreshToken,
    scopes: ["https://graph.microsoft.com/Calendars.ReadWrite"],
  };

  const response = await pca.acquireTokenByRefreshToken(refreshTokenRequest);
  
  // Update tokens in Firestore if they changed
  await admin.firestore().collection('teachers').doc(teacherId).update({
    outlookAccessToken: response.accessToken,
    outlookRefreshToken: response.refreshToken || data.outlookRefreshToken,
    outlookTokenExpiry: response.expiresOn.getTime(),
  });

  return response.accessToken;
};

module.exports = {
  getAuthUrl,
  acquireTokenByCode,
  getAccessToken
};
