import { BookingInput } from "@/types/db";

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validateBookingInput(data: unknown): ValidationResult {
  const errors: Record<string, string> = {};

  // safely check if data is an object
  if (!data || typeof data !== "object") {
    return {
      valid: false,
      errors: { general: "Invalid request body format." },
    };
  }

  const obj = data as Partial<BookingInput>;

  // name
  if (!obj.name || typeof obj.name !== "string" || obj.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  // email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (
    !obj.email ||
    typeof obj.email !== "string" ||
    !emailRegex.test(obj.email)
  ) {
    errors.email = "Invalid email format.";
  }

  // moving address
  if (
    !obj.moving_address ||
    typeof obj.moving_address !== "string" ||
    obj.moving_address.trim().length < 5
  ) {
    errors.moving_address = "Moving address must be at least 5 characters.";
  }

  // date validation
  if (!obj.move_date || typeof obj.move_date !== "string") {
    errors.move_date = "Move date is required.";
  } else {
    const date = new Date(obj.move_date);
    if (isNaN(date.getTime())) {
      errors.move_date = "Invalid move date format.";
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        errors.move_date = "Move date must be in the future.";
      }
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
