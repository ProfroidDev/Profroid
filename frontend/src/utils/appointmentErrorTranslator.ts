import i18n from "../i18n/config";

/**
 * Translates error codes from backend to user-friendly messages
 */
export function translateAppointmentError(errorMessage: string): string {
  const { t } = i18n;

  // Simple error code to translation key mapping
  const errorCodeMap: { [key: string]: string } = {
    ERROR_QUOTATION_EXISTS: "error.appointment.quotationAlreadyExists",
    ERROR_QUOTATION_SCHEDULED_AFTER:
      "error.appointment.quotationScheduledAfter",
    ERROR_SERVICE_EXISTS: "error.appointment.serviceAlreadyExists",
    ERROR_APPOINTMENT_ENDS_AFTER_CLOSING:
      "error.appointment.appointmentEndsAfterClosing",
    TIME_CONFLICT: "pages.appointments.timeConflict",
  };

  // Check each error code
  for (const [errorCode, translationKey] of Object.entries(errorCodeMap)) {
    if (errorMessage.includes(errorCode)) {
      return t(translationKey);
    }
  }

  // Check for "Not enough remaining time" error pattern
  const notEnoughTimePattern =
    /Not enough remaining time on this day for the requested service at (\d{2}:\d{2}) \(requires (\d+) slot\(s\)\)/;
  const timeMatch = errorMessage.match(notEnoughTimePattern);
  if (timeMatch) {
    const time = timeMatch[1];
    const slots = timeMatch[2];
    return t("error.appointment.notEnoughRemainingTime", { time, slots });
  }

  // Default: return original message if no error code matched
  return errorMessage;
}
