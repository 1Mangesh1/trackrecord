/**
 * TrackRecord Application Configuration
 *
 * IMPORTANT: Update these values with your GitHub repository information
 * before deploying the application.
 */

// GitHub Configuration
const GITHUB_OWNER = "1Mangesh1"; // Your GitHub username
const GITHUB_REPO = "trackrecord"; // Your repository name
const CSV_FILE_PATH = "track_records.csv"; // CSV file path in the repository

// GitHub API Configuration
const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";

// Application Configuration
const APP_CONFIG = {
  // CSV Headers - DO NOT CHANGE unless you modify the CSV structure
  CSV_HEADERS: [
    "Date",
    "Context",
    "Project/Task",
    "Skills & Tools",
    "Outcome/Deliverable",
    "Time Spent",
    "Key Learnings/Challenges",
    "Next Steps",
    "Status",
    "Tags",
  ],

  // Status options for the form
  STATUS_OPTIONS: [
    "In Progress",
    "Completed",
    "On Hold",
    "Cancelled",
    "Planning",
  ],

  // Default date (today)
  DEFAULT_DATE: new Date().toISOString().split("T")[0],

  // Table pagination
  ITEMS_PER_PAGE: 50,

  // Export options
  EXPORT_FORMATS: ["csv", "json"],

  // Notification settings
  NOTIFICATION_TIMEOUT: 5000, // 5 seconds

  // API rate limiting (GitHub allows 5000 requests per hour for authenticated users)
  API_RATE_LIMIT: 5000,
  API_RATE_LIMIT_WINDOW: 3600000, // 1 hour in milliseconds
};

// Validation rules for form fields
const VALIDATION_RULES = {
  date: {
    required: true,
    type: "date",
  },
  context: {
    required: true,
    minLength: 10,
    maxLength: 500,
  },
  project: {
    required: true,
    minLength: 3,
    maxLength: 200,
  },
  skills: {
    required: false,
    maxLength: 300,
  },
  outcome: {
    required: false,
    maxLength: 500,
  },
  timeSpent: {
    required: false,
    maxLength: 100,
  },
  tags: {
    required: false,
    maxLength: 200,
  },
  learnings: {
    required: false,
    maxLength: 500,
  },
  nextSteps: {
    required: false,
    maxLength: 500,
  },
  status: {
    required: true,
    allowedValues: APP_CONFIG.STATUS_OPTIONS,
  },
};

// Error messages
const ERROR_MESSAGES = {
  GITHUB_NOT_CONFIGURED:
    "GitHub configuration is missing. Please update config.js with your repository details.",
  GITHUB_API_ERROR:
    "Error connecting to GitHub API. Please check your configuration and try again.",
  GITHUB_AUTH_ERROR:
    "Authentication failed. Please check your GitHub Personal Access Token.",
  GITHUB_RATE_LIMIT: "GitHub API rate limit exceeded. Please try again later.",
  CSV_READ_ERROR: "Error reading CSV file from repository.",
  CSV_WRITE_ERROR: "Error writing CSV file to repository.",
  VALIDATION_ERROR: "Please check your input and try again.",
  NETWORK_ERROR: "Network error. Please check your internet connection.",
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
};

// Success messages
const SUCCESS_MESSAGES = {
  ENTRY_ADDED: "Track record entry added successfully!",
  CSV_EXPORTED: "CSV file exported successfully!",
  JSON_EXPORTED: "JSON file exported successfully!",
  FORM_CLEARED: "Form cleared successfully!",
  FILTERS_CLEARED: "Filters cleared successfully!",
};

// Console logging configuration
const DEBUG_MODE = true; // Set to false in production

// Export configuration for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    GITHUB_OWNER,
    GITHUB_REPO,
    CSV_FILE_PATH,
    GITHUB_API_BASE,
    GITHUB_RAW_BASE,
    APP_CONFIG,
    VALIDATION_RULES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    DEBUG_MODE,
  };
}
