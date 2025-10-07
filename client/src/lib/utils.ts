import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function readableAuthError(err: any) {
  const code = err?.name || err?.code;
  switch (code) {
    case "UsernameExistsException":
      return "An account with this email already exists.";
    case "InvalidPasswordException":
      return "Password does not meet the policy.";
    case "CodeMismatchException":
      return "Incorrect verification code.";
    case "ExpiredCodeException":
      return "Code expired. Please request a new one.";
    default:
      return err?.message || "Something went wrong. Please try again.";
  }
}

