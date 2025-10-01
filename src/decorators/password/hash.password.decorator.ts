import { Transform } from 'class-transformer';
import { hashPasswordSync } from './helper';

/**
 * Decorator that hashes the password value.
 * @returns The transformed hashed password value.
 */
export function HashPassword() {
  return Transform(({ value }) => {
    if (!value) return value;

    // Check if the value is already a bcrypt hash
    if (typeof value === 'string' && value.startsWith('$2b$')) {

      return value;
    }


    const hashedPassword = hashPasswordSync(value);

    return hashedPassword;
  });
}
