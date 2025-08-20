/**
 * TrackRecord GitHub API Integration
 * Handles all GitHub API operations for reading and writing CSV data
 */

class GitHubAPI {
  constructor() {
    this.owner = GITHUB_OWNER;
    this.repo = GITHUB_REPO;
    this.csvPath = CSV_FILE_PATH;
    this.base64Content = null;
    this.sha = null;
    this.lastFetch = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if GitHub configuration is valid
   * @returns {boolean} True if configuration is valid
   */
  isConfigured() {
    return (
      this.owner &&
      this.repo &&
      this.owner !== "1Mangesh1" &&
      this.repo !== "trackrecord"
    );
  }

  /**
   * Get GitHub Personal Access Token from environment
   * @returns {string|null} GitHub PAT or null if not available
   */
  getAuthToken() {
    // In a real deployment, this would come from environment variables
    // For GitHub Pages, this would typically be stored in repository secrets
    // and accessed through a backend service or GitHub Actions
    return null; // Will be set by the user in the UI
  }

  /**
   * Make authenticated GitHub API request
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async makeRequest(endpoint, options = {}) {
    if (!this.isConfigured()) {
      throw new Error(ERROR_MESSAGES.GITHUB_NOT_CONFIGURED);
    }

    const token = this.getAuthToken();
    const url = `${GITHUB_API_BASE}${endpoint}`;

    const requestOptions = {
      method: "GET",
      headers: {
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "TrackRecord-App",
      },
      ...options,
    };

    if (token) {
      requestOptions.headers["Authorization"] = `token ${token}`;
    }

    try {
      Utils.log(`Making GitHub API request to: ${endpoint}`);
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.GITHUB_AUTH_ERROR);
        } else if (response.status === 403) {
          throw new Error(ERROR_MESSAGES.GITHUB_RATE_LIMIT);
        } else {
          throw new Error(
            `GitHub API error: ${response.status} ${response.statusText}`
          );
        }
      }

      const data = await response.json();
      Utils.log(`GitHub API request successful: ${endpoint}`);
      return data;
    } catch (error) {
      Utils.log(
        `GitHub API request failed: ${endpoint} - ${error.message}`,
        "error"
      );
      throw error;
    }
  }

  /**
   * Get CSV file content from repository
   * @param {boolean} forceRefresh - Force refresh cache
   * @returns {Promise<string>} CSV content
   */
  async getCSVContent(forceRefresh = false) {
    if (
      !forceRefresh &&
      this.base64Content &&
      this.lastFetch &&
      Date.now() - this.lastFetch < this.cacheTimeout
    ) {
      Utils.log("Returning cached CSV content");
      return atob(this.base64Content);
    }

    try {
      Utils.log("Fetching CSV content from GitHub repository");
      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${this.csvPath}`;
      const data = await this.makeRequest(endpoint);

      if (data.type !== "file") {
        throw new Error("Repository path does not point to a file");
      }

      this.base64Content = data.content;
      this.sha = data.sha;
      this.lastFetch = Date.now();

      Utils.log("CSV content fetched successfully");
      return atob(data.content);
    } catch (error) {
      if (error.message.includes("404")) {
        Utils.log("CSV file not found, creating new file");
        return this.createInitialCSV();
      }
      throw error;
    }
  }

  /**
   * Create initial CSV file with headers
   * @returns {Promise<string>} Initial CSV content
   */
  async createInitialCSV() {
    const initialContent = APP_CONFIG.CSV_HEADERS.join(",") + "\n";
    await this.updateCSVContent(initialContent, "Initial CSV file creation");
    return initialContent;
  }

  /**
   * Update CSV file content in repository
   * @param {string} content - New CSV content
   * @param {string} commitMessage - Git commit message
   * @returns {Promise<boolean>} Success status
   */
  async updateCSVContent(content, commitMessage) {
    try {
      Utils.log("Updating CSV content in GitHub repository");

      const endpoint = `/repos/${this.owner}/${this.repo}/contents/${this.csvPath}`;
      const encodedContent = btoa(content);

      const requestBody = {
        message: commitMessage,
        content: encodedContent,
        sha: this.sha,
      };

      const data = await this.makeRequest(endpoint, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      // Update local cache
      this.base64Content = encodedContent;
      this.sha = data.content.sha;
      this.lastFetch = Date.now();

      Utils.log("CSV content updated successfully");
      return true;
    } catch (error) {
      Utils.log(`Failed to update CSV content: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Append new entry to CSV file
   * @param {Object} entry - New entry data
   * @returns {Promise<boolean>} Success status
   */
  async appendEntry(entry) {
    try {
      Utils.log("Appending new entry to CSV file");

      // Get current CSV content
      const currentContent = await this.getCSVContent();
      const currentData = Utils.csvToArray(currentContent);

      // Add new entry
      currentData.push(entry);

      // Convert back to CSV
      const newContent = Utils.arrayToCSV(currentData);

      // Update repository
      const commitMessage = `Add track record entry: ${entry["Project/Task"]} - ${entry.Date}`;
      await this.updateCSVContent(newContent, commitMessage);

      Utils.log("Entry appended successfully");
      return true;
    } catch (error) {
      Utils.log(`Failed to append entry: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Get repository information
   * @returns {Promise<Object>} Repository information
   */
  async getRepositoryInfo() {
    try {
      const endpoint = `/repos/${this.owner}/${this.repo}`;
      return await this.makeRequest(endpoint);
    } catch (error) {
      Utils.log(`Failed to get repository info: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Check if user has write access to repository
   * @returns {Promise<boolean>} True if user has write access
   */
  async hasWriteAccess() {
    try {
      const repoInfo = await this.getRepositoryInfo();
      return repoInfo.permissions && repoInfo.permissions.push;
    } catch (error) {
      Utils.log(`Failed to check write access: ${error.message}`, "error");
      return false;
    }
  }

  /**
   * Get user's GitHub profile information
   * @returns {Promise<Object>} User profile information
   */
  async getUserProfile() {
    try {
      const endpoint = "/user";
      return await this.makeRequest(endpoint);
    } catch (error) {
      Utils.log(`Failed to get user profile: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Test GitHub API connection
   * @returns {Promise<Object>} Test result
   */
  async testConnection() {
    try {
      Utils.log("Testing GitHub API connection");

      const result = {
        configured: this.isConfigured(),
        authenticated: false,
        repositoryAccess: false,
        writeAccess: false,
        errors: [],
      };

      if (!result.configured) {
        result.errors.push(ERROR_MESSAGES.GITHUB_NOT_CONFIGURED);
        return result;
      }

      // Test authentication
      try {
        await this.getUserProfile();
        result.authenticated = true;
      } catch (error) {
        result.errors.push(`Authentication failed: ${error.message}`);
      }

      // Test repository access
      try {
        await this.getRepositoryInfo();
        result.repositoryAccess = true;
      } catch (error) {
        result.errors.push(`Repository access failed: ${error.message}`);
      }

      // Test write access
      if (result.authenticated && result.repositoryAccess) {
        try {
          result.writeAccess = await this.hasWriteAccess();
        } catch (error) {
          result.errors.push(`Write access check failed: ${error.message}`);
        }
      }

      Utils.log("GitHub API connection test completed");
      return result;
    } catch (error) {
      Utils.log(`GitHub API connection test failed: ${error.message}`, "error");
      return {
        configured: this.isConfigured(),
        authenticated: false,
        repositoryAccess: false,
        writeAccess: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Clear local cache
   */
  clearCache() {
    this.base64Content = null;
    this.sha = null;
    this.lastFetch = null;
    Utils.log("GitHub API cache cleared");
  }

  /**
   * Get raw CSV URL for direct access
   * @returns {string} Raw CSV URL
   */
  getRawCSVURL() {
    if (!this.isConfigured()) {
      return null;
    }
    return `${GITHUB_RAW_BASE}/${this.owner}/${this.repo}/main/${this.csvPath}`;
  }

  /**
   * Get repository URL
   * @returns {string} Repository URL
   */
  getRepositoryURL() {
    if (!this.isConfigured()) {
      return null;
    }
    return `https://github.com/${this.owner}/${this.repo}`;
  }
}

// Create global instance
const githubAPI = new GitHubAPI();

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = GitHubAPI;
}
