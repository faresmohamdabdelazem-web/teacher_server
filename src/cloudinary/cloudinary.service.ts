import { Injectable, Logger } from '@nestjs/common';
import { v2 } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  public async uploadBase64(image: string, folder: string, publicId: string) {
    try {
      const result = await v2.uploader.upload(
        'data:image/jpg;base64,' + image,
        {
          folder,
          public_id: publicId,
          use_filename: true,
          quality: 'auto:good',
          fetch_format: 'auto',
        },
      );

      Logger.log('UPLOAD PHOTO SUCCESS');
      return result.secure_url;
    } catch (error: any) {
      Logger.error(`UPLOAD PHOTO => `, error);
      throw error;
    }
  }

  public async deletePhoto(publicId: string) {
    try {
      const res = await v2.api.delete_resources([publicId]);

      Logger.log('DELETE PHOTO SUCCESS');

      return res;
    } catch (error) {
      Logger.error('DELETE PHOTO => ', error);
    }
  }

  public async deletePhotos(fileName: string, publicIds: string[]) {
    try {
      publicIds = publicIds.map((publicId) => `${fileName}/${publicId}`);

      const res = await v2.api.delete_resources(publicIds);

      Logger.log('DELETE PHOTOS SUCCESS');

      return res;
    } catch (error) {
      Logger.error('DELETE PHOTOS => ');
      console.error(error);
    }
  }

  public async updatePhoto(publicId: string, newPhotoString: string) {
    try {
      const res = await v2.uploader.upload(
        'data:image/jpg;base64,' + newPhotoString,
        {
          public_id: publicId,
        },
      );
      Logger.log('UPDATE PHOTOS SUCCESS');

      return res;
    } catch (error) {
      Logger.error('UPDATE  PHOTOS => ', error);
    }
  }

  public async isValidPublicId(publicId: string) {
    try {
      const exist = await v2.api.resource(publicId);
      return exist.error ? false : true;
    } catch (error) {
      return false;
    }
  }
}
