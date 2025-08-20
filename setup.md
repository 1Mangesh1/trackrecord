# TrackRecord Setup Guide

This guide will walk you through setting up and deploying your TrackRecord application.

## Prerequisites

- GitHub account
- Basic knowledge of Git and GitHub
- A web browser

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the "+" icon in the top right corner and select "New repository"
3. Name your repository (e.g., `track-record-app`)
4. Make it public (required for GitHub Pages)
5. Don't initialize with README, .gitignore, or license (we'll add our own)
6. Click "Create repository"

## Step 2: Upload Application Files

1. Clone your new repository to your local machine:

   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. Copy all the TrackRecord application files into this directory

3. Update the configuration in `assets/js/config.js`:

   ```javascript
   const GITHUB_OWNER = "YOUR_GITHUB_USERNAME";
   const GITHUB_REPO = "YOUR_REPO_NAME";
   const CSV_FILE_PATH = "track_records.csv";
   ```

4. Commit and push your changes:
   ```bash
   git add .
   git commit -m "Initial commit: TrackRecord application"
   git push origin main
   ```

## Step 3: Create Initial CSV File

1. In your repository, create a new file named `track_records.csv`
2. Add the following content:
   ```csv
   Date,Context,Project/Task,Skills & Tools,Outcome/Deliverable,Time Spent,Key Learnings/Challenges,Next Steps,Status,Tags
   ```
3. Commit and push this file

## Step 4: Set Up GitHub Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "TrackRecord App")
4. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `workflow` (Update GitHub Action workflows)
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

## Step 5: Configure GitHub Pages

1. Go to your repository Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Select the `gh-pages` branch and `/ (root)` folder
4. Click "Save"

## Step 6: Test the Application

1. Wait a few minutes for GitHub Actions to deploy your site
2. Go to your GitHub Pages URL (usually `https://1mangesh1.github.io/trackrecord`)
3. The application should load with a configuration warning
4. Update the configuration in `assets/js/config.js` with your actual repository details
5. Push the changes and wait for redeployment

## Step 7: Add Your First Entry

1. Once the application is properly configured, you should see the form
2. Fill out the form with your first track record entry
3. Click "Add Entry" to save it to your CSV file
4. The entry should appear in the table below

## Troubleshooting

### Application Shows Configuration Warning

- Make sure you've updated `assets/js/config.js` with your actual GitHub username and repository name
- Verify the CSV file exists in your repository root

### GitHub API Errors

- Check that your Personal Access Token has the correct permissions
- Ensure your repository is public (required for GitHub Pages)
- Verify the token hasn't expired

### Deployment Issues

- Check the Actions tab in your repository for workflow failures
- Ensure GitHub Pages is enabled in your repository settings
- Wait a few minutes for the initial deployment to complete

### Form Submission Fails

- Check browser console for error messages
- Verify your GitHub token has write access to the repository
- Ensure the CSV file exists and is accessible

## Security Notes

- Never commit your Personal Access Token to the repository
- Consider using a repository-specific token with minimal required permissions
- Regularly rotate your tokens for security

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Review the GitHub Actions workflow logs
3. Verify all configuration steps were completed correctly
4. Check that your repository and token have the required permissions

## Next Steps

Once your application is working:

1. Add more track record entries
2. Customize the form fields if needed
3. Explore the filtering and search features
4. Export your data periodically for backup
5. Share your progress tracking with others!

---

**Note**: This application is designed to be simple and self-contained. All data is stored in your GitHub repository as CSV files, making it easy to backup, version control, and share your progress tracking journey.
