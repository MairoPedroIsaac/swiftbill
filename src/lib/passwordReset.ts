import crypto from "crypto";

/** Reset links last one hour. */
export const RESET_TTL_MS = 60 * 60 * 1000;

/** Tokens are stored in the VerificationToken table under this prefix. */
export const resetIdentifier = (email: string) => `password-reset:${email.toLowerCase()}`;

/** Only a hash is stored, so a leaked database row cannot be used as a link. */
export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

export const newToken = () => crypto.randomBytes(32).toString("hex");
