export const UZ_PHONE_REGEX = /^\+998\d{9}$/;

export function cleanUzPhone(phone: string): string {
  return phone.replace(/[\s\-()]/g, "");
}

export function isValidUzPhone(phone: string): boolean {
  return UZ_PHONE_REGEX.test(cleanUzPhone(phone));
}
