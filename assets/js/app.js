/**
 * TrackRecord Main Application
 * Handles the main application logic, form submission, and data management
 */

class TrackRecordApp {
  constructor() {
    this.trackRecords = [];
    this.filteredRecords = [];
    this.currentFilters = {};
    this.searchTerm = "";
    this.sortField = "Date";
    this.sortDirection = "desc";

    // Pagination
    this.currentPage = 1;
    this.pageSize = 50;

    // Modal state
    this.currentEditIndex = -1;
    this.isEditMode = false;

    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    Utils.log("Initializing TrackRecord application");

    try {
      // Check GitHub configuration
      if (!githubAPI.isConfigured()) {
        this.showConfigurationWarning();
        return;
      }

      // Set default date to today
      this.setDefaultDate();

      // Initialize event listeners
      this.initializeEventListeners();
      this.initializeModalListeners();
      this.initializePaginationListeners();
      this.initializeViewToggle();

      // Load initial data
      await this.loadTrackRecords();

      // Update filter options
      this.updateFilterOptions();

      Utils.log("Application initialized successfully");
    } catch (error) {
      Utils.log(`Application initialization failed: ${error.message}`, "error");
      Utils.showNotification(ERROR_MESSAGES.UNKNOWN_ERROR, "error");
    }
  }

  /**
   * Show configuration warning
   */
  showConfigurationWarning() {
    const warningHtml = `
            <div class="notification error">
                <div class="notification-header">
                    <span class="notification-title">Configuration Required</span>
                </div>
                <div class="notification-message">
                    <p>Please update the GitHub configuration in <code>assets/js/config.js</code>:</p>
                    <ul>
                        <li>Set <code>GITHUB_OWNER</code> to your GitHub username</li>
                        <li>Set <code>GITHUB_REPO</code> to your repository name</li>
                        <li>Create a CSV file named <code>track_records.csv</code> in your repository</li>
                    </ul>
                    <p>After updating the configuration, refresh this page.</p>
                </div>
            </div>
        `;

    document
      .querySelector(".main-content")
      .insertAdjacentHTML("afterbegin", warningHtml);
  }

  /**
   * Set default date to today
   */
  setDefaultDate() {
    const dateInput = document.getElementById("date");
    if (dateInput) {
      dateInput.value = APP_CONFIG.DEFAULT_DATE;
    }
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Form submission
    const form = document.getElementById("trackRecordForm");
    if (form) {
      form.addEventListener("submit", (e) => this.handleFormSubmit(e));
    }

    // Clear form button
    const clearFormBtn = document.getElementById("clearForm");
    if (clearFormBtn) {
      clearFormBtn.addEventListener("click", () => this.clearForm());
    }

    // Export buttons
    const exportCSVBtn = document.getElementById("exportCSV");
    if (exportCSVBtn) {
      exportCSVBtn.addEventListener("click", () => this.exportData("csv"));
    }

    const exportJSONBtn = document.getElementById("exportJSON");
    if (exportJSONBtn) {
      exportJSONBtn.addEventListener("click", () => this.exportData("json"));
    }

    // Search and filter controls
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
      searchInput.addEventListener(
        "input",
        Utils.debounce((e) => {
          this.searchTerm = e.target.value;
          this.applyFilters();
        }, 300)
      );
    }

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) {
      statusFilter.addEventListener("change", (e) => {
        this.currentFilters.status = e.target.value;
        this.applyFilters();
      });
    }

    const projectFilter = document.getElementById("projectFilter");
    if (projectFilter) {
      projectFilter.addEventListener("change", (e) => {
        this.currentFilters.project = e.target.value;
        this.applyFilters();
      });
    }

    const dateFilter = document.getElementById("dateFilter");
    if (dateFilter) {
      dateFilter.addEventListener("change", (e) => {
        this.currentFilters.date = e.target.value;
        this.applyFilters();
      });
    }

    const clearFiltersBtn = document.getElementById("clearFilters");
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener("click", () => this.clearFilters());
    }

    // Table sorting
    this.initializeTableSorting();
  }

  /**
   * Initialize table sorting
   */
  initializeTableSorting() {
    const table = document.getElementById("trackRecordsTable");
    if (!table) return;

    const headers = table.querySelectorAll("th");
    headers.forEach((header, index) => {
      header.style.cursor = "pointer";
      header.addEventListener("click", () => {
        const field = this.getFieldNameByIndex(index);
        if (field) {
          this.sortByField(field);
        }
      });
    });
  }

  /**
   * Get field name by table column index
   * @param {number} index - Column index
   * @returns {string} Field name
   */
  getFieldNameByIndex(index) {
    const fieldMap = {
      0: "Date",
      1: "Project/Task",
      2: "Status",
      3: "Context",
      4: "Skills & Tools",
      5: "Outcome/Deliverable",
      6: "Time Spent",
      7: "Tags",
      8: "Key Learnings/Challenges",
      9: "Next Steps",
    };
    return fieldMap[index];
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async handleFormSubmit(e) {
    e.preventDefault();

    try {
      Utils.showLoading();

      // Get form data
      const formData = this.getFormData();

      // Validate form data
      const validation = Utils.validateFormData(formData);
      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors).join("\n");
        Utils.showNotification(errorMessage, "error");
        return;
      }

      // Add entry to GitHub repository
      await githubAPI.appendEntry(formData);

      // Show success message
      Utils.showNotification(SUCCESS_MESSAGES.ENTRY_ADDED, "success");

      // Clear form
      this.clearForm();

      // Reload data
      await this.loadTrackRecords();

      // Update filter options
      this.updateFilterOptions();
    } catch (error) {
      Utils.log(`Form submission failed: ${error.message}`, "error");
      Utils.showNotification(error.message, "error");
    } finally {
      Utils.hideLoading();
    }
  }

  /**
   * Get field name by CSV header
   * @param {string} header - CSV header
   * @returns {string} Field name
   */
  getFieldNameByHeader(header) {
    const fieldMap = {
      Date: "date",
      Context: "context",
      "Project/Task": "project",
      "Skills & Tools": "skills",
      "Outcome/Deliverable": "outcome",
      "Time Spent": "timeSpent",
      "Key Learnings/Challenges": "learnings",
      "Next Steps": "nextSteps",
      Status: "status",
      Tags: "tags",
    };
    return fieldMap[header];
  }

  /**
   * Get form data from the main form
   */
  getFormData() {
    const form = document.getElementById("trackRecordForm");
    const formData = new FormData(form);

    // Map form field names to CSV headers
    const data = {};
    APP_CONFIG.CSV_HEADERS.forEach((header) => {
      const fieldName = this.getFieldNameByHeader(header);
      data[header] = formData.get(fieldName) || "";
    });

    return data;
  }

  /**
   * Clear form
   */
  clearForm() {
    const form = document.getElementById("trackRecordForm");
    if (form) {
      form.reset();
      this.setDefaultDate();
      Utils.showNotification(SUCCESS_MESSAGES.FORM_CLEARED, "success");
    }
  }

  /**
   * Load track records from GitHub repository
   */
  async loadTrackRecords() {
    try {
      Utils.log("Loading track records from GitHub repository");

      const csvContent = await githubAPI.getCSVContent();
      this.trackRecords = Utils.csvToArray(csvContent);

      // Sort by date (newest first)
      this.trackRecords = Utils.sortArray(this.trackRecords, "Date", "desc");

      // Apply current filters
      this.applyFilters();

      Utils.log(`Loaded ${this.trackRecords.length} track records`);
    } catch (error) {
      Utils.log(`Failed to load track records: ${error.message}`, "error");
      Utils.showNotification(error.message, "error");
    }
  }

  /**
   * Apply filters and search
   */
  applyFilters() {
    let filtered = [...this.trackRecords];

    // Apply search
    if (this.searchTerm) {
      const searchFields = [
        "Context",
        "Project/Task",
        "Skills & Tools",
        "Outcome/Deliverable",
        "Tags",
        "Key Learnings/Challenges",
      ];
      filtered = Utils.filterArray(filtered, this.searchTerm, searchFields);
    }

    // Apply filters
    Object.entries(this.currentFilters).forEach(([field, value]) => {
      if (value) {
        filtered = filtered.filter((record) => {
          const recordValue = record[field];
          if (field === "date") {
            return recordValue === value;
          }
          return (
            recordValue &&
            recordValue.toLowerCase().includes(value.toLowerCase())
          );
        });
      }
    });

    // Apply sorting
    filtered = Utils.sortArray(filtered, this.sortField, this.sortDirection);

    this.filteredRecords = filtered;
    this.renderTable();
    this.updateCounts();
  }

  /**
   * Clear all filters
   */
  clearFilters() {
    this.currentFilters = {};
    this.searchTerm = "";

    // Clear filter inputs
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = "";

    const statusFilter = document.getElementById("statusFilter");
    if (statusFilter) statusFilter.value = "";

    const projectFilter = document.getElementById("projectFilter");
    if (projectFilter) projectFilter.value = "";

    const dateFilter = document.getElementById("dateFilter");
    if (dateFilter) dateFilter.value = "";

    // Reapply filters
    this.applyFilters();

    Utils.showNotification(SUCCESS_MESSAGES.FILTERS_CLEARED, "success");
  }

  /**
   * Sort by field
   * @param {string} field - Field to sort by
   */
  sortByField(field) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDirection = "desc";
    }

    this.applyFilters();
  }

  /**
   * Update filter options based on current data
   */
  updateFilterOptions() {
    // Update project filter options
    const projectFilter = document.getElementById("projectFilter");
    if (projectFilter) {
      const projects = Utils.getUniqueValues(
        this.trackRecords.map((record) => record["Project/Task"])
      );

      // Clear existing options except "All Projects"
      projectFilter.innerHTML = '<option value="">All Projects</option>';

      projects.forEach((project) => {
        const option = document.createElement("option");
        option.value = project;
        option.textContent = project;
        projectFilter.appendChild(option);
      });
    }
  }

  /**
   * Render the data table
   */
  renderTable() {
    const tableBody = document.getElementById("tableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    if (this.filteredRecords.length === 0) {
      const noDataRow = document.createElement("tr");
      noDataRow.innerHTML = `
                <td colspan="11" class="text-center text-muted">
                  No track records found matching your criteria.
                </td>
              `;
      tableBody.appendChild(noDataRow);
      return;
    }

    // Get paginated data
    const paginatedData = this.getPaginatedData();

    paginatedData.forEach((record, index) => {
      const actualIndex = (this.currentPage - 1) * this.pageSize + index;
      const row = this.createTableRow(record, actualIndex);
      tableBody.appendChild(row);
    });

    // Update pagination and Kanban view
    this.updatePagination();
    this.updateKanbanView();
  }

  /**
   * Create table row for a record
   * @param {Object} record - Track record data
   * @param {number} index - Record index
   * @returns {HTMLElement} Table row element
   */
  createTableRow(record, index) {
    const row = document.createElement("tr");

    row.innerHTML = `
              <td data-label="Date">${Utils.formatDate(record.Date)}</td>
              <td data-label="Project/Task" title="${Utils.escapeHtml(
                record["Project/Task"]
              )}">${Utils.truncateText(
      Utils.escapeHtml(record["Project/Task"]),
      30
    )}</td>
              <td data-label="Status">${
                Utils.createStatusBadge(record.Status).outerHTML
              }</td>
              <td data-label="Context" title="${Utils.escapeHtml(
                record.Context
              )}">${Utils.truncateText(
      Utils.escapeHtml(record.Context),
      50
    )}</td>
              <td data-label="Skills & Tools" title="${Utils.escapeHtml(
                record["Skills & Tools"]
              )}">${Utils.truncateText(
      Utils.escapeHtml(record["Skills & Tools"]),
      30
    )}</td>
              <td data-label="Outcome" title="${Utils.escapeHtml(
                record["Outcome/Deliverable"]
              )}">${Utils.truncateText(
      Utils.escapeHtml(record["Outcome/Deliverable"]),
      50
    )}</td>
              <td data-label="Time Spent">${Utils.escapeHtml(
                record["Time Spent"]
              )}</td>
              <td data-label="Tags" title="${Utils.escapeHtml(
                record.Tags
              )}">${Utils.truncateText(Utils.escapeHtml(record.Tags), 30)}</td>
              <td data-label="Learnings" title="${Utils.escapeHtml(
                record["Key Learnings/Challenges"]
              )}">${Utils.truncateText(
      Utils.escapeHtml(record["Key Learnings/Challenges"]),
      50
    )}</td>
              <td data-label="Next Steps" title="${Utils.escapeHtml(
                record["Next Steps"]
              )}">${Utils.truncateText(
      Utils.escapeHtml(record["Next Steps"]),
      50
    )}</td>
              <td class="table-actions" data-label="Actions">
                <button class="edit-btn" onclick="trackRecordApp.showEditModal(${index})" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="trackRecordApp.confirmDelete(${index})" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            `;

    return row;
  }

  /**
   * Update entry counts
   */
  updateCounts() {
    const entryCount = document.getElementById("entryCount");
    const filteredCount = document.getElementById("filteredCount");

    if (entryCount) {
      entryCount.textContent = `${this.trackRecords.length} entries`;
    }

    if (filteredCount) {
      if (this.filteredRecords.length !== this.trackRecords.length) {
        filteredCount.textContent = `Showing ${this.filteredRecords.length} filtered entries`;
      } else {
        filteredCount.textContent = "";
      }
    }
  }

  /**
   * Export data in specified format
   * @param {string} format - Export format (csv or json)
   */
  exportData(format) {
    try {
      const data =
        this.filteredRecords.length > 0
          ? this.filteredRecords
          : this.trackRecords;
      let content, filename, mimeType;

      if (format === "csv") {
        content = Utils.arrayToCSV(data);
        filename = `track_records_${
          new Date().toISOString().split("T")[0]
        }.csv`;
        mimeType = "text/csv";
        Utils.showNotification(SUCCESS_MESSAGES.CSV_EXPORTED, "success");
      } else if (format === "json") {
        content = Utils.arrayToJSON(data);
        filename = `track_records_${
          new Date().toISOString().split("T")[0]
        }.json`;
        mimeType = "application/json";
        Utils.showNotification(SUCCESS_MESSAGES.JSON_EXPORTED, "success");
      } else {
        throw new Error("Unsupported export format");
      }

      Utils.downloadFile(content, filename, mimeType);
    } catch (error) {
      Utils.log(`Export failed: ${error.message}`, "error");
      Utils.showNotification(`Export failed: ${error.message}`, "error");
    }
  }

  /**
   * Refresh data from repository
   */
  async refreshData() {
    try {
      Utils.showLoading();
      await this.loadTrackRecords();
      Utils.showNotification("Data refreshed successfully", "success");
    } catch (error) {
      Utils.log(`Data refresh failed: ${error.message}`, "error");
      Utils.showNotification(`Data refresh failed: ${error.message}`, "error");
    } finally {
      Utils.hideLoading();
    }
  }

  /**
   * Test GitHub connection
   */
  async testConnection() {
    try {
      Utils.showLoading();
      const result = await githubAPI.testConnection();

      let message = "GitHub connection test completed:\n";
      message += `• Configured: ${result.configured ? "Yes" : "No"}\n`;
      message += `• Authenticated: ${result.authenticated ? "Yes" : "No"}\n`;
      message += `• Repository Access: ${
        result.repositoryAccess ? "Yes" : "No"
      }\n`;
      message += `• Write Access: ${result.writeAccess ? "Yes" : "No"}`;

      if (result.errors.length > 0) {
        message += "\n\nErrors:\n" + result.errors.join("\n");
      }

      Utils.showNotification(
        message,
        result.errors.length > 0 ? "error" : "success",
        10000
      );
    } catch (error) {
      Utils.log(`Connection test failed: ${error.message}`, "error");
      Utils.showNotification(
        `Connection test failed: ${error.message}`,
        "error"
      );
    } finally {
      Utils.hideLoading();
    }
  }

  /**
   * Show edit modal
   */
  showEditModal(index = -1) {
    this.currentEditIndex = index;
    this.isEditMode = index >= 0;

    const modal = document.getElementById("entryModal");
    const modalTitle = document.getElementById("modalTitle");

    if (this.isEditMode) {
      // Edit mode
      modalTitle.textContent = "Edit Entry";
      this.populateEditForm(index);
    } else {
      // Add mode
      modalTitle.textContent = "Add New Entry";
      this.clearEditForm();
    }

    modal.classList.add("show");
  }

  /**
   * Hide edit modal
   */
  hideEditModal() {
    const modal = document.getElementById("entryModal");
    modal.classList.remove("show");
    this.currentEditIndex = -1;
    this.isEditMode = false;
  }

  /**
   * Populate edit form with data
   */
  populateEditForm(index) {
    const record = this.trackRecords[index];
    if (!record) return;

    document.getElementById("editDate").value = record.Date || "";
    document.getElementById("editStatus").value = record.Status || "";
    document.getElementById("editContext").value = record.Context || "";
    document.getElementById("editProject").value = record["Project/Task"] || "";
    document.getElementById("editSkills").value =
      record["Skills & Tools"] || "";
    document.getElementById("editOutcome").value =
      record["Outcome/Deliverable"] || "";
    document.getElementById("editTimeSpent").value = record["Time Spent"] || "";
    document.getElementById("editTags").value = record.Tags || "";
    document.getElementById("editLearnings").value =
      record["Key Learnings/Challenges"] || "";
    document.getElementById("editNextSteps").value = record["Next Steps"] || "";
  }

  /**
   * Clear edit form
   */
  clearEditForm() {
    document.getElementById("editDate").value = APP_CONFIG.DEFAULT_DATE;
    document.getElementById("editStatus").value = "";
    document.getElementById("editContext").value = "";
    document.getElementById("editProject").value = "";
    document.getElementById("editSkills").value = "";
    document.getElementById("editOutcome").value = "";
    document.getElementById("editTimeSpent").value = "";
    document.getElementById("editTags").value = "";
    document.getElementById("editLearnings").value = "";
    document.getElementById("editNextSteps").value = "";
  }

  /**
   * Handle edit form submission
   */
  async handleEditFormSubmit(e) {
    e.preventDefault();

    try {
      Utils.showLoading();

      const formData = this.getEditFormData();

      // Validate form data
      const validation = Utils.validateFormData(formData);
      if (!validation.isValid) {
        const errorMessage = Object.values(validation.errors).join("\n");
        Utils.showNotification(errorMessage, "error");
        return;
      }

      if (this.isEditMode) {
        // Update existing entry
        await this.updateEntry(this.currentEditIndex, formData);
        Utils.showNotification("Entry updated successfully!", "success");
      } else {
        // Add new entry
        await githubAPI.appendEntry(formData);
        Utils.showNotification(SUCCESS_MESSAGES.ENTRY_ADDED, "success");
      }

      // Hide modal and reload data
      this.hideEditModal();
      await this.loadTrackRecords();
      this.updateFilterOptions();
    } catch (error) {
      Utils.log(`Edit form submission failed: ${error.message}`, "error");
      Utils.showNotification(error.message, "error");
    } finally {
      Utils.hideLoading();
    }
  }

  /**
   * Get edit form data
   */
  getEditFormData() {
    const form = document.getElementById("editForm");
    const formData = new FormData(form);

    const data = {};
    APP_CONFIG.CSV_HEADERS.forEach((header) => {
      const fieldName = this.getFieldNameByHeader(header);
      data[header] = formData.get(fieldName) || "";
    });

    return data;
  }

  /**
   * Update existing entry
   */
  async updateEntry(index, newData) {
    try {
      // Get current CSV content
      const currentContent = await githubAPI.getCSVContent();
      const currentData = Utils.csvToArray(currentContent);

      // Update the entry
      currentData[index] = newData;

      // Convert back to CSV
      const newContent = Utils.arrayToCSV(currentData);

      // Update repository
      const commitMessage = `Update track record entry: ${newData["Project/Task"]} - ${newData.Date}`;
      await githubAPI.updateCSVContent(newContent, commitMessage);

      Utils.log("Entry updated successfully");
      return true;
    } catch (error) {
      Utils.log(`Failed to update entry: ${error.message}`, "error");
      throw error;
    }
  }

  /**
   * Delete entry
   */
  async deleteEntry(index) {
    try {
      Utils.showLoading();

      // Get current CSV content
      const currentContent = await githubAPI.getCSVContent();
      const currentData = Utils.csvToArray(currentContent);

      // Remove the entry
      const deletedEntry = currentData.splice(index, 1)[0];

      // Convert back to CSV
      const newContent = Utils.arrayToCSV(currentData);

      // Update repository
      const commitMessage = `Delete track record entry: ${deletedEntry["Project/Task"]} - ${deletedEntry.Date}`;
      await githubAPI.updateCSVContent(newContent, commitMessage);

      Utils.showNotification("Entry deleted successfully!", "success");

      // Reload data
      await this.loadTrackRecords();
      this.updateFilterOptions();
    } catch (error) {
      Utils.log(`Failed to delete entry: ${error.message}`, "error");
      Utils.showNotification(error.message, "error");
    } finally {
      Utils.hideLoading();
    }
  }

  /**
   * Update pagination
   */
  updatePagination() {
    const totalEntries = this.filteredRecords.length;
    const totalPages = Math.ceil(totalEntries / this.pageSize);

    // Update pagination info
    document.getElementById("totalEntries").textContent = totalEntries;
    document.getElementById("startIndex").textContent =
      (this.currentPage - 1) * this.pageSize + 1;
    document.getElementById("endIndex").textContent = Math.min(
      this.currentPage * this.pageSize,
      totalEntries
    );

    // Update pagination controls
    document.getElementById("firstPage").disabled = this.currentPage === 1;
    document.getElementById("prevPage").disabled = this.currentPage === 1;
    document.getElementById("nextPage").disabled =
      this.currentPage === totalPages;
    document.getElementById("lastPage").disabled =
      this.currentPage === totalPages;

    // Update page numbers
    this.renderPageNumbers(totalPages);

    // Update page size selector
    document.getElementById("pageSize").value = this.pageSize;
  }

  /**
   * Render page numbers
   */
  renderPageNumbers(totalPages) {
    const pageNumbersContainer = document.getElementById("pageNumbers");
    pageNumbersContainer.innerHTML = "";

    const maxVisiblePages = 5;
    let startPage = Math.max(
      1,
      this.currentPage - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const pageNumber = document.createElement("span");
      pageNumber.className = `page-number ${
        i === this.currentPage ? "active" : ""
      }`;
      pageNumber.textContent = i;
      pageNumber.addEventListener("click", () => this.goToPage(i));
      pageNumbersContainer.appendChild(pageNumber);
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page) {
    this.currentPage = page;
    this.renderTable();
    this.updatePagination();
  }

  /**
   * Get paginated data
   */
  getPaginatedData() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredRecords.slice(startIndex, endIndex);
  }

  /**
   * Update Kanban view
   */
  updateKanbanView() {
    const statuses = [
      "Planning",
      "In Progress",
      "On Hold",
      "Completed",
      "Cancelled",
    ];

    statuses.forEach((status) => {
      const items = this.filteredRecords.filter(
        (record) => record.Status === status
      );
      const countElement = document.getElementById(
        `${status.toLowerCase().replace(/\s+/g, "")}Count`
      );
      const itemsContainer = document.getElementById(
        `${status.toLowerCase().replace(/\s+/g, "")}Items`
      );

      if (countElement) countElement.textContent = items.length;
      if (itemsContainer) {
        itemsContainer.innerHTML = "";
        items.forEach((item, index) => {
          const itemElement = this.createKanbanItem(item, index);
          itemsContainer.appendChild(itemElement);
        });
      }
    });
  }

  /**
   * Create Kanban item
   */
  createKanbanItem(record, index) {
    const item = document.createElement("div");
    item.className = "kanban-item";
    item.innerHTML = `
      <div class="kanban-item-header">
        <h4 class="kanban-item-title">${Utils.truncateText(
          Utils.escapeHtml(record["Project/Task"]),
          30
        )}</h4>
        <span class="kanban-item-date">${Utils.formatDate(record.Date)}</span>
      </div>
      <div class="kanban-item-context">${Utils.truncateText(
        Utils.escapeHtml(record.Context),
        80
      )}</div>
      <div class="kanban-item-actions">
        <button class="edit-btn" onclick="trackRecordApp.showEditModal(${index})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="delete-btn" onclick="trackRecordApp.confirmDelete(${index})">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    return item;
  }

  /**
   * Confirm delete
   */
  confirmDelete(index) {
    const deleteModal = document.getElementById("deleteModal");
    deleteModal.classList.add("show");

    // Store the index for deletion
    this.currentEditIndex = index;
  }

  /**
   * Initialize modal event listeners
   */
  initializeModalListeners() {
    // Close modal on close button click
    document.querySelectorAll(".close").forEach((closeBtn) => {
      closeBtn.addEventListener("click", () => {
        this.hideEditModal();
        document.getElementById("deleteModal").classList.remove("show");
      });
    });

    // Close modal on outside click
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.hideEditModal();
        document.getElementById("deleteModal").classList.remove("show");
      }
    });

    // Edit form submission
    document.getElementById("editForm").addEventListener("submit", (e) => {
      this.handleEditFormSubmit(e);
    });

    // Delete confirmation
    document.getElementById("confirmDelete").addEventListener("click", () => {
      this.deleteEntry(this.currentEditIndex);
      document.getElementById("deleteModal").classList.remove("show");
    });

    document.getElementById("cancelDelete").addEventListener("click", () => {
      document.getElementById("deleteModal").classList.remove("show");
    });

    // Cancel edit
    document.getElementById("cancelEdit").addEventListener("click", () => {
      this.hideEditModal();
    });

    // Add new entry button
    document.getElementById("addNewEntry").addEventListener("click", () => {
      this.showEditModal();
    });
  }

  /**
   * Initialize pagination event listeners
   */
  initializePaginationListeners() {
    document
      .getElementById("firstPage")
      .addEventListener("click", () => this.goToPage(1));
    document
      .getElementById("prevPage")
      .addEventListener("click", () => this.goToPage(this.currentPage - 1));
    document
      .getElementById("nextPage")
      .addEventListener("click", () => this.goToPage(this.currentPage + 1));
    document
      .getElementById("lastPage")
      .addEventListener("click", () =>
        this.goToPage(Math.ceil(this.filteredRecords.length / this.pageSize))
      );

    document.getElementById("pageSize").addEventListener("change", (e) => {
      this.pageSize = parseInt(e.target.value);
      this.currentPage = 1;
      this.renderTable();
      this.updatePagination();
    });
  }

  /**
   * Initialize view toggle
   */
  initializeViewToggle() {
    document.getElementById("tableView").addEventListener("click", () => {
      document.querySelector(".data-section").style.display = "block";
      document.querySelector(".kanban-section").style.display = "none";
      document.getElementById("tableView").classList.add("active");
      document.getElementById("kanbanView").classList.remove("active");
    });

    document.getElementById("kanbanView").addEventListener("click", () => {
      document.querySelector(".data-section").style.display = "none";
      document.querySelector(".kanban-section").style.display = "block";
      document.getElementById("tableView").classList.remove("active");
      document.getElementById("kanbanView").classList.add("active");
    });
  }
}

// Initialize application when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.trackRecordApp = new TrackRecordApp();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = TrackRecordApp;
}
