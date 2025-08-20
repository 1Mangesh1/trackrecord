# TrackRecord - Personal Progress Tracking Application

A self-tracking web application that allows users to log and manage their personal track record entries, storing data in a GitHub repository via the GitHub API.

## Features

- **Comprehensive Entry Form**: Log date, context, project/task, skills & tools, outcomes, time spent, learnings, next steps, status, and tags
- **GitHub Integration**: Direct integration with GitHub API for data persistence
- **Search & Filter**: Filter entries by various fields including date, project, tags, and status
- **Mobile Responsive**: Optimized for both desktop and mobile devices
- **Export Functionality**: Download data as CSV or JSON
- **GitHub Pages Ready**: Static application suitable for GitHub Pages hosting

## Setup Instructions

### 1. Repository Configuration

1. Create a new GitHub repository for your track records
2. Create a CSV file named `track_records.csv` in the repository root with the following headers:
   ```
   Date,Context,Project/Task,Skills & Tools,Outcome/Deliverable,Time Spent,Key Learnings/Challenges,Next Steps,Status,Tags
   ```

### 2. GitHub Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate a new token with the following permissions:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
3. Copy the token and keep it secure

### 3. Environment Configuration

1. In your GitHub repository, go to Settings → Secrets and variables → Actions
2. Add a new repository secret named `GITHUB_PAT` with your Personal Access Token value

### 4. Application Configuration

1. Open `config.js` in the `assets/js` folder
2. Update the following variables:
   ```javascript
   const GITHUB_OWNER = "your-github-username";
   const GITHUB_REPO = "your-repository-name";
   const CSV_FILE_PATH = "track_records.csv";
   ```

### 5. Deploy to GitHub Pages

1. Push your code to the `main` branch
2. Go to repository Settings → Pages
3. Set source to "Deploy from a branch"
4. Select `gh-pages` branch and `/ (root)` folder
5. Click Save

The GitHub Actions workflow will automatically build and deploy your application to GitHub Pages whenever you push changes to the main branch.

## File Structure

```
TrackRecord/
├── index.html              # Main application page
├── assets/
│   ├── css/
│   │   └── styles.css      # Application styles
│   └── js/
│       ├── app.js          # Main application logic
│       ├── config.js       # Configuration file
│       ├── github-api.js   # GitHub API integration
│       └── utils.js        # Utility functions
├── .github/
│   └── workflows/
│       └── deploy.yml      # GitHub Actions deployment workflow
└── README.md               # This file
```

## Usage

1. **Adding Entries**: Fill out the form and click "Add Entry" to log a new track record
2. **Viewing Entries**: All entries are displayed in a searchable, filterable table
3. **Filtering**: Use the filter controls to narrow down entries by various criteria
4. **Exporting**: Download your data as CSV or JSON for backup or analysis
5. **Searching**: Use the search bar to find specific entries

## Security Notes

- The GitHub PAT is stored in repository secrets and should never be committed to the code
- All API calls are made directly from the client-side JavaScript
- Consider using a repository-specific PAT with minimal required permissions

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
