# Blog Tools

Tools for managing blog posts on your website.

## Files

- **`blog-editor.html`** - Visual editor with real-time preview for creating blog posts
- **`add-blog-post.js`** - Script to automatically add a blog post from a JSON file
- **`remove-blog-post.js`** - Script to remove a blog post by slug

## Usage

### Adding a Blog Post

1. Open `blog-editor.html` in your browser
2. Fill in all the required fields (Title, Date, Excerpt, Content)
3. Add tags (optional) by typing and pressing Enter
4. Click "Save as JSON" - the browser will prompt you to save the file
   - If your browser supports the File System Access API, you can choose to save directly to the `blog-tools` folder
   - Otherwise, it will download to your default download folder
5. Run the add script in one of two ways:

**Option 1: Interactive selection (recommended)**
Run the script without arguments to see a list of all available JSON files:

```bash
npm run add-post
```

Or directly:
```bash
node blog-tools/add-blog-post.js
```

The script will:
- Display all JSON files in the `blog-tools` folder
- Automatically filter out files that are already added to the blog
- Show invalid JSON files separately (missing required fields)
- Let you select which file to add by number

**Option 2: Direct file specification**
Run the script with the JSON file name:

```bash
npm run add-post blog-post-[slug].json
```

Or directly:
```bash
node blog-tools/add-blog-post.js blog-post-[slug].json
```

The script will automatically:
- Add the post to `src/pages/blog.astro`
- Add the slug to `getStaticPaths()` in `src/pages/blog/[slug].astro`
- Add the full post data to the posts object in `src/pages/blog/[slug].astro`

### Removing a Blog Post

You can remove a blog post in two ways:

**Option 1: Interactive selection (recommended)**
Run the script without arguments to see a list of all posts:

```bash
npm run remove-post
```

Or directly:
```bash
node blog-tools/remove-blog-post.js
```

The script will:
- Display all available blog posts with their titles
- Let you select which one to remove by number
- Ask for confirmation
- Remove the post from all necessary files

**Option 2: Direct removal**
Run the script with the slug:

```bash
npm run remove-post [slug]
```

Or directly:
```bash
node blog-tools/remove-blog-post.js [slug]
```

The script will:
- Ask for confirmation
- Remove the post from `src/pages/blog.astro`
- Remove the slug from `getStaticPaths()` in `src/pages/blog/[slug].astro`
- Remove the post data from the posts object in `src/pages/blog/[slug].astro`

### Pushing to GitHub

After adding or removing blog posts, you can push your changes to GitHub:

**With default commit message:**
```bash
npm run push
```

**With custom commit message:**
```bash
npm run push "Your custom commit message here"
```

Or directly:
```bash
node blog-tools/push-to-github.js "Your custom commit message here"
```

The script will:
- Stage all changes (`git add .`)
- Commit with your message (or "Blog content" as default)
- Push to GitHub (`git push`)

## Notes

- The JSON file can be saved anywhere, but it's recommended to save it in the `blog-tools` folder
- The scripts handle proper formatting, indentation, and comma placement automatically
- The push script will only commit if there are changes to commit
- Duplicate slugs are detected and prevented

