"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractPublicId = extractPublicId;
exports.extractPublicIds = extractPublicIds;
function extractPublicId(folderName, url) {
    const parts = url.split('/');
    return `${folderName}/${parts[parts.length - 1].split('.')[0]}`;
}
function extractPublicIds(folderName, urls) {
    return urls.map((url) => {
        const parts = url.split('/');
        return `${folderName}/${parts[parts.length - 1].split('.')[0]}`;
    });
}
//# sourceMappingURL=extract-public-id.js.map