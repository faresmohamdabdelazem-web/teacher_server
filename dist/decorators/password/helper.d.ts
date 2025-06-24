export declare function hashPasswordSync(value: string, salt?: string): string;
export declare function comparePassword(value: string, hash: string): Promise<boolean>;
