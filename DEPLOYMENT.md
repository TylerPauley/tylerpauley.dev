# GitHub Pages Deployment Setup

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

## Initial Setup

1. **Create a GitHub Repository**
   - Create a new repository on GitHub (e.g., `tylerpauley.dev`)
   - Push your code to the repository

2. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"
   - Save the changes

3. **Update Configuration**
   - Open `astro.config.mjs`
   - Update the `site` URL to match your GitHub Pages URL:
     - Format: `https://YOUR_USERNAME.github.io`
     - Example: `https://tylerpauley.github.io`
   - Update the `base` path if your repository name is different:
     - If repo is `tylerpauley.dev`, use `/tylerpauley.dev`
     - If repo is just your username, use `/` or remove the base property

4. **Push to Main Branch**
   - The workflow automatically triggers on push to `main` branch
   - You can also manually trigger it from the Actions tab

## How It Works

- **Automatic Deployment**: Every time you push to the `main` branch, GitHub Actions will:
  1. Build your Astro site
  2. Deploy it to GitHub Pages
  3. Make it available at your GitHub Pages URL

- **Manual Deployment**: You can also trigger deployments manually:
  1. Go to the "Actions" tab in your repository
  2. Select "Deploy to GitHub Pages" workflow
  3. Click "Run workflow"

## Custom Domain (Optional)

If you want to use a custom domain (like `tylerpauley.dev`):

1. Add a `CNAME` file in the `public` folder with your domain:
   ```
   tylerpauley.dev
   ```

2. Configure DNS settings with your domain provider:
   - Add a CNAME record pointing to `YOUR_USERNAME.github.io`
   - Or add A records pointing to GitHub's IP addresses

3. In your repository settings → Pages, add your custom domain

## Troubleshooting

- **Build fails**: Check the Actions tab for error messages
- **Site not updating**: Wait a few minutes for GitHub Pages to update
- **404 errors**: Make sure the `base` path in `astro.config.mjs` matches your repository name

