"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const common_1 = require("@nestjs/common");
const cloudinary_1 = require("cloudinary");
let CloudinaryService = class CloudinaryService {
    async uploadBase64(image, folder, publicId) {
        try {
            const result = await cloudinary_1.v2.uploader.upload('data:image/jpg;base64,' + image, {
                folder,
                public_id: publicId,
                use_filename: true,
                quality: 'auto:good',
                fetch_format: 'auto',
            });
            common_1.Logger.log('UPLOAD PHOTO SUCCESS');
            return result.secure_url;
        }
        catch (error) {
            common_1.Logger.error(`UPLOAD PHOTO => `, error);
            throw error;
        }
    }
    async deletePhoto(publicId) {
        try {
            const res = await cloudinary_1.v2.api.delete_resources([publicId]);
            common_1.Logger.log('DELETE PHOTO SUCCESS');
            return res;
        }
        catch (error) {
            common_1.Logger.error('DELETE PHOTO => ', error);
        }
    }
    async deletePhotos(fileName, publicIds) {
        try {
            publicIds = publicIds.map((publicId) => `${fileName}/${publicId}`);
            const res = await cloudinary_1.v2.api.delete_resources(publicIds);
            common_1.Logger.log('DELETE PHOTOS SUCCESS');
            return res;
        }
        catch (error) {
            common_1.Logger.error('DELETE PHOTOS => ');
            console.error(error);
        }
    }
    async updatePhoto(publicId, newPhotoString) {
        try {
            const res = await cloudinary_1.v2.uploader.upload('data:image/jpg;base64,' + newPhotoString, {
                public_id: publicId,
            });
            common_1.Logger.log('UPDATE PHOTOS SUCCESS');
            return res;
        }
        catch (error) {
            common_1.Logger.error('UPDATE  PHOTOS => ', error);
        }
    }
    async isValidPublicId(publicId) {
        try {
            const exist = await cloudinary_1.v2.api.resource(publicId);
            return exist.error ? false : true;
        }
        catch (error) {
            return false;
        }
    }
};
exports.CloudinaryService = CloudinaryService;
exports.CloudinaryService = CloudinaryService = __decorate([
    (0, common_1.Injectable)()
], CloudinaryService);
//# sourceMappingURL=cloudinary.service.js.map