export const REFRESH_TTL = 604800000;
export const OTP_TOKEN_EXPIRE = Date.now() + (60000 * 15); // 15 minutes
export const FORGET_PASS_AR = './otp_ar';
export const FORGET_PASS_EN = './otp';
export const ITEM_FOLDER_NAME = 'itemsPhotos';
export const TICKET_FOLDER_NAME = 'tickets';
export const PASSPORT_PHOTO_FILE = 'users/passport';
export const PROFILE_PHOTO_FILE = 'users/profile';
export const getRejectedDealNotificationMessage = (name: string) =>
  `Unfortunately, ${name} has rejected the deal with you`;
export const ACCEPTED_DEAL_NOTIFICATION = (name: string) =>
  `Congratulations, ${name} has accepted the deal with you`;
export const getCanceledDealNotificationMessage = (name: string) =>
  `Unfortunately, ${name} has canceled the deal with you`;
