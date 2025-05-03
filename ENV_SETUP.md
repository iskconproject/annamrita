# Environment Variables Setup

This project now uses environment variables to store sensitive configuration values like Appwrite credentials. This approach enhances security by keeping sensitive information out of the codebase.

## Setup Instructions

1. Copy the `.env.example` file to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your actual Appwrite credentials in the `.env` file.

3. The `.env` file is already added to `.gitignore` to prevent it from being committed to the repository.

## For Development

- During development, the environment variables from your `.env` file will be automatically loaded by Vite.
- Make sure to update the `.env.example` file (without real credentials) when you add new environment variables.

## For Production

- In production environments, you'll need to set these environment variables in your hosting platform (Vercel, Netlify, etc.).
- Never commit real credentials to the repository, even in environment files.

## Cleaning Git History

Since sensitive information was previously committed to the repository, you should clean your Git history. Here are two approaches:

### Option 1: Using BFG Repo Cleaner (Recommended)

1. Install BFG Repo Cleaner: https://rtyley.github.io/bfg-repo-cleaner/

2. Create a file named `sensitive.txt` with the sensitive values you want to remove:
   ```
   6804a6bb003b71dee582
   6804a8c2000b9c7f4716
   6805edaf0006de1435cd
   6805ede2001c256497f2
   6805edf1002dd84d087c
   6807354d00302547ab6a
   6807495c001bdc0294b4
   ```

3. Run BFG to replace these values with `***REMOVED***`:
   ```bash
   bfg --replace-text sensitive.txt
   ```

4. Clean up and push the changes:
   ```bash
   git reflog expire --expire=now --all && git gc --prune=now --aggressive
   git push --force
   ```

### Option 2: Using Git Filter-Branch

```bash
git filter-branch --force --index-filter \
  "git ls-files -z | xargs -0 sed -i 's/6804a6bb003b71dee582/YOUR_PROJECT_ID/g'" \
  --prune-empty --tag-name-filter cat -- --all
```

Repeat for each sensitive value, then force push:
```bash
git push --force
```

## Important Security Notes

1. **Rotate Your Credentials**: After cleaning the Git history, you should rotate your Appwrite API keys and other credentials to ensure that the exposed credentials are no longer valid.

2. **Check Other Branches**: Make sure to clean all branches that might contain the sensitive information.

3. **Inform Team Members**: Let all team members know about this change so they can update their local repositories.
