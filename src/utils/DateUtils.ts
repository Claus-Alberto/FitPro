/**
 * @description Utility class for date manipulation and formatting aligned with the app's pt-BR requirements.
 */
export class DateUtils {
  /**
   * @description Returns the current date formatted as "DD MMM" (e.g., "21 MAR") in Brazilian Portuguese.
   * @returns {string} The formatted date string.
   */
  static getFormattedShortDate(): string {
    const today = new Date();
    const months = [
      'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 
      'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
    ];
    const day = String(today.getDate()).padStart(2, '0');
    const month = months[today.getMonth()];
    
    return `${day} ${month}`;
  }
}
