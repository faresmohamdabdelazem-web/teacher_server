"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCanceledDealNotificationMessage = exports.ACCEPTED_DEAL_NOTIFICATION = exports.getRejectedDealNotificationMessage = exports.PROFILE_PHOTO_FILE = exports.PASSPORT_PHOTO_FILE = exports.TICKET_FOLDER_NAME = exports.ITEM_FOLDER_NAME = exports.FORGET_PASS_EN = exports.FORGET_PASS_AR = exports.OTP_TOKEN_EXPIRE = exports.REFRESH_TTL = void 0;
exports.REFRESH_TTL = 604800000;
exports.OTP_TOKEN_EXPIRE = Date.now() + (60000 * 15);
exports.FORGET_PASS_AR = './otp_ar';
exports.FORGET_PASS_EN = './otp';
exports.ITEM_FOLDER_NAME = 'itemsPhotos';
exports.TICKET_FOLDER_NAME = 'tickets';
exports.PASSPORT_PHOTO_FILE = 'users/passport';
exports.PROFILE_PHOTO_FILE = 'users/profile';
const getRejectedDealNotificationMessage = (name) => `Unfortunately, ${name} has rejected the deal with you`;
exports.getRejectedDealNotificationMessage = getRejectedDealNotificationMessage;
const ACCEPTED_DEAL_NOTIFICATION = (name) => `Congratulations, ${name} has accepted the deal with you`;
exports.ACCEPTED_DEAL_NOTIFICATION = ACCEPTED_DEAL_NOTIFICATION;
const getCanceledDealNotificationMessage = (name) => `Unfortunately, ${name} has canceled the deal with you`;
exports.getCanceledDealNotificationMessage = getCanceledDealNotificationMessage;
//# sourceMappingURL=hatly.constants.js.map