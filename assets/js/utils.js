/**
 * TrackRecord Utility Functions
 * Common utility functions used throughout the application
 */

class Utils {
  /**
   * Log messages to console (only in debug mode)
   * @param {string} message - Message to log
   * @param {string} level - Log level (log, warn, error)
   */
  static log(message, level = "log") {
    if (DEBUG_MODE) {
      console[level](`[TrackRecord] ${message}`);
    }
  }

  /**
   * Show notification to user
   * @param {string} message - Message to display
   * @param {string} type - Notification type (success, error, info)
   * @param {number} timeout - Auto-hide timeout in milliseconds
   */
  static showNotification(
    message,
    type = "info",
    timeout = APP_CONFIG.NOTIFICATION_TIMEOUT
  ) {
    const container = document.getElementById("notificationContainer");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${this.capitalizeFirst(
                  type
                )}</span>
                <button class="notification-close">&times;</button>
            </div>
            <div class="notification-message">${message}</div>
        `;

    // Add close button functionality
    const closeBtn = notification.querySelector(".notification-close");
    closeBtn.addEventListener("click", () => {
      notification.remove();
    });

    container.appendChild(notification);

    // Auto-remove notification after timeout
    if (timeout > 0) {
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, timeout);
    }

    Utils.log(`Notification shown: ${type} - ${message}`);
  }

  /**
   * Capitalize first letter of string
   * @param {string} str - Input string
   * @returns {string} String with first letter capitalized
   */
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  static formatDate(dateString) {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      Utils.log(`Error formatting date: ${error}`, "error");
      return dateString;
    }
  }

  /**
   * Format date for input field (YYYY-MM-DD)
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string for input
   */
  static formatDateForInput(dateString) {
    if (!dateString) return "";

    try {
      const date = new Date(dateString);
      return date.toISOString().split("T")[0];
    } catch (error) {
      Utils.log(`Error formatting date for input: ${error}`, "error");
      return dateString;
    }
  }

  /**
   * Truncate text to specified length
   * @param {string} text - Input text
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  static truncateText(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  }

  /**
   * Escape HTML special characters
   * @param {string} text - Input text
   * @returns {string} Escaped text
   */
  static escapeHtml(text) {
    if (!text) return "";

    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Create status badge element
   * @param {string} status - Status text
   * @returns {HTMLElement} Status badge element
   */
  static createStatusBadge(status) {
    const badge = document.createElement("span");
    badge.className = `status-badge status-${status
      .toLowerCase()
      .replace(/\s+/g, "-")}`;
    badge.textContent = status;
    return badge;
  }

  /**
   * Show loading overlay
   */
  static showLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.classList.add("show");
    }
  }

  /**
   * Hide loading overlay
   */
  static hideLoading() {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) {
      overlay.classList.remove("show");
    }
  }

  /**
   * Validate form data against validation rules
   * @param {Object} formData - Form data object
   * @returns {Object} Validation result with isValid and errors
   */
  static validateFormData(formData) {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(VALIDATION_RULES)) {
      const value = formData[field];

      // Check required fields
      if (rules.required && (!value || value.trim() === "")) {
        errors[field] = `${this.capitalizeFirst(field)} is required`;
        isValid = false;
        continue;
      }

      // Skip validation for empty optional fields
      if (!rules.required && (!value || value.trim() === "")) {
        continue;
      }

      // Check minimum length
      if (rules.minLength && value.length < rules.minLength) {
        errors[field] = `${this.capitalizeFirst(field)} must be at least ${
          rules.minLength
        } characters`;
        isValid = false;
      }

      // Check maximum length
      if (rules.maxLength && value.length > rules.maxLength) {
        errors[field] = `${this.capitalizeFirst(field)} must be no more than ${
          rules.maxLength
        } characters`;
        isValid = false;
      }

      // Check allowed values for select fields
      if (rules.allowedValues && !rules.allowedValues.includes(value)) {
        errors[field] = `${this.capitalizeFirst(
          field
        )} must be one of: ${rules.allowedValues.join(", ")}`;
        isValid = false;
      }

      // Check date type
      if (rules.type === "date" && value) {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          errors[field] = `${this.capitalizeFirst(field)} must be a valid date`;
          isValid = false;
        }
      }
    }

    return { isValid, errors };
  }

  /**
   * Convert CSV string to array of objects
   * @param {string} csvString - CSV string content
   * @returns {Array} Array of objects with CSV data
   */
  static csvToArray(csvString) {
    if (!csvString || csvString.trim() === "") {
      return [];
    }

    try {
      const lines = csvString.trim().split("\n");
      const headers = lines[0].split(",").map((header) => header.trim());
      const result = [];

      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim() === "") continue;

        const values = this.parseCSVLine(lines[i]);
        const obj = {};

        headers.forEach((header, index) => {
          obj[header] = values[index] || "";
        });

        result.push(obj);
      }

      return result;
    } catch (error) {
      Utils.log(`Error parsing CSV: ${error}`, "error");
      return [];
    }
  }

  /**
   * Parse CSV line handling quoted values
   * @param {string} line - CSV line
   * @returns {Array} Array of values
   */
  static parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  /**
   * Convert array of objects to CSV string
   * @param {Array} data - Array of objects
   * @returns {string} CSV string
   */
  static arrayToCSV(data) {
    if (!data || data.length === 0) {
      return APP_CONFIG.CSV_HEADERS.join(",") + "\n";
    }

    try {
      const headers = APP_CONFIG.CSV_HEADERS;
      const csvLines = [headers.join(",")];

      data.forEach((row) => {
        const values = headers.map((header) => {
          const value = row[header] || "";
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = value.toString().replace(/"/g, '""');
          return escaped.includes(",") || escaped.includes("\n")
            ? `"${escaped}"`
            : escaped;
        });
        csvLines.push(values.join(","));
      });

      return csvLines.join("\n");
    } catch (error) {
      Utils.log(`Error converting to CSV: ${error}`, "error");
      return "";
    }
  }

  /**
   * Convert array of objects to JSON string
   * @param {Array} data - Array of objects
   * @returns {string} JSON string
   */
  static arrayToJSON(data) {
    try {
      return JSON.stringify(data, null, 2);
    } catch (error) {
      Utils.log(`Error converting to JSON: ${error}`, "error");
      return "[]";
    }
  }

  /**
   * Download file with specified content and filename
   * @param {string} content - File content
   * @param {string} filename - Filename
   * @param {string} mimeType - MIME type
   */
  static downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  /**
   * Debounce function calls
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get unique values from array
   * @param {Array} array - Input array
   * @returns {Array} Array of unique values
   */
  static getUniqueValues(array) {
    return [...new Set(array.filter((item) => item && item.trim() !== ""))];
  }

  /**
   * Filter array by search term
   * @param {Array} array - Input array
   * @param {string} searchTerm - Search term
   * @param {Array} searchFields - Fields to search in
   * @returns {Array} Filtered array
   */
  static filterArray(array, searchTerm, searchFields) {
    if (!searchTerm || searchTerm.trim() === "") {
      return array;
    }

    const term = searchTerm.toLowerCase().trim();
    return array.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    });
  }

  /**
   * Sort array by field
   * @param {Array} array - Input array
   * @param {string} field - Field to sort by
   * @param {string} direction - Sort direction (asc or desc)
   * @returns {Array} Sorted array
   */
  static sortArray(array, field, direction = "desc") {
    return [...array].sort((a, b) => {
      let aVal = a[field] || "";
      let bVal = b[field] || "";

      // Handle date sorting
      if (field === "Date") {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      } else {
        // Handle string sorting
        aVal = aVal.toString().toLowerCase();
        bVal = bVal.toString().toLowerCase();
      }

      if (direction === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }
}

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = Utils;
}
