export declare class CloudinaryService {
    uploadBase64(image: string, folder: string, publicId: string): Promise<string>;
    deletePhoto(publicId: string): Promise<any>;
    deletePhotos(fileName: string, publicIds: string[]): Promise<any>;
    updatePhoto(publicId: string, newPhotoString: string): Promise<import("cloudinary").UploadApiResponse>;
    isValidPublicId(publicId: string): Promise<boolean>;
}
