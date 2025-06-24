export function extractPublicId(folderName: string, url: string): string {
  const parts = url.split('/');
  return `${folderName}/${parts[parts.length - 1].split('.')[0]}`;
}

export function extractPublicIds(folderName: string, urls: string[]): string[] {
  return urls.map((url) => {
    const parts = url.split('/');
    return `${folderName}/${parts[parts.length - 1].split('.')[0]}`;
  });
}
