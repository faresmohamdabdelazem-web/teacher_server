import * as bcrypt from 'bcrypt';

export function hashPasswordSync(
  value: string,
  salt: string = bcrypt.genSaltSync(),
): string {
  return bcrypt.hashSync(value, salt);
}

export async function comparePassword(
  value: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(value, hash);
}
