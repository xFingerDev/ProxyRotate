import { AUTH_PASS, AUTH_USER } from "../config.js";
import { parseAuth } from "./parse.js";
export function validateAuth(credentialToken) {
  const credentials = parseAuth(credentialToken);
  return (
    !!credentials &&
    credentials.user === AUTH_USER &&
    credentials.pass === AUTH_PASS
  );
}
