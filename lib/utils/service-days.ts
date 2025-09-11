/**
 * Utility functions for handling ServiceDays data
 * Handles text format with comma-separated values and null cases
 */

export interface ServiceDaysResult {
  days: string[];
  isValid: boolean;
  error?: string;
}

/**
 * Parses ServiceDays text into an array of days
 * Handles comma-separated values, null, undefined, and empty strings
 * 
 * @param serviceDays - The ServiceDays value (can be string, null, undefined, or array)
 * @returns ServiceDaysResult with parsed days and validation status
 */
export function parseServiceDays(serviceDays: any): ServiceDaysResult {
  // Handle null, undefined, or empty values
  if (!serviceDays) {
    return {
      days: [],
      isValid: false,
      error: 'ServiceDays is null or undefined'
    };
  }

  // If it's already an array, return as-is
  if (Array.isArray(serviceDays)) {
    return {
      days: serviceDays.filter(day => typeof day === 'string' && day.trim().length > 0),
      isValid: true
    };
  }

  // If it's not a string, try to convert it
  if (typeof serviceDays !== 'string') {
    return {
      days: [],
      isValid: false,
      error: `ServiceDays is not a string, got ${typeof serviceDays}`
    };
  }

  // Handle empty string
  if (serviceDays.trim() === '') {
    return {
      days: [],
      isValid: false,
      error: 'ServiceDays is empty'
    };
  }

  try {
    // Split by comma and clean up each day
    const days = serviceDays
      .split(',')
      .map(day => day.trim())
      .filter(day => day.length > 0);

    return {
      days,
      isValid: days.length > 0
    };
  } catch (error) {
    return {
      days: [],
      isValid: false,
      error: `Failed to parse ServiceDays: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Checks if a specific day is included in ServiceDays
 * 
 * @param serviceDays - The ServiceDays value
 * @param targetDay - The day to check for
 * @returns boolean indicating if the day is found
 */
export function hasServiceDay(serviceDays: any, targetDay: string): boolean {
  const result = parseServiceDays(serviceDays);
  
  if (!result.isValid || !targetDay) {
    return false;
  }

  return result.days.some(day => 
    day.toLowerCase() === targetDay.toLowerCase()
  );
}

/**
 * Formats ServiceDays for display
 * 
 * @param serviceDays - The ServiceDays value
 * @param maxLength - Maximum length before truncation (default: 50)
 * @returns Formatted string for display
 */
export function formatServiceDaysForDisplay(
  serviceDays: any, 
  maxLength: number = 50
): string {
  const result = parseServiceDays(serviceDays);
  
  if (!result.isValid) {
    return 'No service days';
  }

  const displayText = result.days.join(', ');
  
  if (displayText.length <= maxLength) {
    return displayText;
  }

  return `${displayText.substring(0, maxLength)}...`;
}

/**
 * Gets the count of service days
 * 
 * @param serviceDays - The ServiceDays value
 * @returns Number of service days
 */
export function getServiceDaysCount(serviceDays: any): number {
  const result = parseServiceDays(serviceDays);
  return result.isValid ? result.days.length : 0;
}

/**
 * Validates if ServiceDays contains valid day names
 * 
 * @param serviceDays - The ServiceDays value
 * @returns boolean indicating if all days are valid
 */
export function isValidServiceDays(serviceDays: any): boolean {
  const validDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
    'Friday', 'Saturday', 'Sunday'
  ];
  
  const result = parseServiceDays(serviceDays);
  
  if (!result.isValid) {
    return false;
  }

  return result.days.every(day => 
    validDays.some(validDay => 
      validDay.toLowerCase() === day.toLowerCase()
    )
  );
}
