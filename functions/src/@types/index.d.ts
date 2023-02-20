declare type AnyObject = {
  [key: string]: any;
};

declare type UserDataSchema = {
  username: string;
  deviceToken: string | null;
  platform?: string;
};

declare type SaveDeviceTokenRequest = {
  username: string;
  deviceToken: string | null;
};

declare type SendPushCallRequest = {
  uuid: string;
  callerUsername: string;
  recipientUsername: string;
};

declare type TUserSignUp = {
  username: string;
};
