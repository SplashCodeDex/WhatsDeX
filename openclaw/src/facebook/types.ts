export interface FacebookCredentials {
  pageAccessToken: string;
  appSecret: string;
  verifyToken: string;
}

export interface FacebookSendResult {
  message_id: string;
  recipient_id: string;
}
