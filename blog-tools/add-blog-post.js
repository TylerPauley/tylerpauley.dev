import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to the blog-tools folder (go up one level to reach src)
const slugAstroPath = path.join(__dirname, '..', 'src', 'pages', 'blog', '[slug].astro');
const blogPostsTsPath = path.join(__dirname, '..', 'src', 'data', 'blog-posts.ts');

// Read [slug].astro
let slugAstroContent = fs.readFileSync(slugAstroPath, 'utf-8');

// Read blog-posts.ts
let blogPostsTsContent = fs.readFileSync(blogPostsTsPath, 'utf-8');

// Function to get all existing slugs from blog files
function getExistingSlugs() {
    const slugs = new Set();
    
    // Get slugs from blog-posts.ts (source of truth)
    const postsArrayRegex = /export const posts: BlogPost\[\] = \[([\s\S]*?)\];/;
    const tsMatch = blogPostsTsContent.match(postsArrayRegex);
    if (tsMatch) {
        const slugRegex = /slug:\s*"([^"]+)"/g;
        let slugMatch;
        while ((slugMatch = slugRegex.exec(tsMatch[1])) !== null) {
            slugs.add(slugMatch[1]);
        }
    }
    
    // Also check [slug].astro getStaticPaths for safety
    const getStaticPathsRegex = /export async function getStaticPaths\(\) \{[\s\S]*?const posts = \[([\s\S]*?)\];/;
    const slugMatch = slugAstroContent.match(getStaticPathsRegex);
    if (slugMatch) {
        const slugRegex = /'([^']+)'/g;
        let match;
        while ((match = slugRegex.exec(slugMatch[1])) !== null) {
            slugs.add(match[1]);
        }
    }
    
    return slugs;
}

// Function to get all JSON files in the blog-tools directory
function getAvailableJsonFiles() {
    try {
        const files = fs.readdirSync(__dirname);
        const jsonFiles = files
            .filter(file => file.endsWith('.json'))
            .map(file => {
                const filePath = path.join(__dirname, file);
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const data = JSON.parse(content);
                    return {
                        filename: file,
                        filePath: filePath,
                        slug: data.slug || null,
                        title: data.title || file.replace('.json', ''),
                        valid: data.slug && data.title && data.date && data.excerpt && data.content
                    };
                } catch (error) {
                    return {
                        filename: file,
                        filePath: filePath,
                        slug: null,
                        title: file.replace('.json', ''),
                        valid: false,
                        error: error.message
                    };
                }
            });
        return jsonFiles;
    } catch (error) {
        console.error(`Error reading directory: ${error.message}`);
        return [];
    }
}

// Get JSON file path from command line argument
const jsonFilePath = process.argv[2];

// If no file provided, show interactive selection
if (!jsonFilePath) {
    const existingSlugs = getExistingSlugs();
    const jsonFiles = getAvailableJsonFiles();
    
    // Filter out files that are already added and invalid files
    const availableFiles = jsonFiles.filter(file => {
        if (!file.valid) return false;
        if (file.slug && existingSlugs.has(file.slug)) return false;
        return true;
    });
    
    if (availableFiles.length === 0) {
        console.log('\n📝 No available JSON files to add.\n');
        
        const invalidFiles = jsonFiles.filter(file => !file.valid);
        const alreadyAddedFiles = jsonFiles.filter(file => file.valid && file.slug && existingSlugs.has(file.slug));
        
        if (invalidFiles.length > 0) {
            console.log('⚠️  Invalid JSON files (missing required fields):');
            invalidFiles.forEach(file => {
                console.log(`   - ${file.filename}${file.error ? ` (${file.error})` : ''}`);
            });
            console.log();
        }
        
        if (alreadyAddedFiles.length > 0) {
            console.log('ℹ️  Already added files (skipped):');
            alreadyAddedFiles.forEach(file => {
                console.log(`   - ${file.filename} (${file.title})`);
            });
            console.log();
        }
        
        process.exit(0);
    }
    
    console.log('\n📝 Available JSON files to add:\n');
    availableFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.title} (${file.filename})`);
        if (file.slug) {
            console.log(`     Slug: ${file.slug}`);
        }
    });
    console.log();
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('Enter the number of the file to add (or press Ctrl+C to cancel): ', (answer) => {
        const selectedIndex = parseInt(answer) - 1;
        
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= availableFiles.length) {
            console.error('Invalid selection.');
            rl.close();
            process.exit(1);
        }
        
        const selectedFile = availableFiles[selectedIndex];
        rl.close();
        proceedWithAdding(selectedFile.filePath);
    });
    
    // Don't proceed yet, wait for user input
} else {
    // Resolve JSON file path (can be relative to current dir or absolute)
    const resolvedJsonPath = path.isAbsolute(jsonFilePath) 
        ? jsonFilePath 
        : path.join(__dirname, jsonFilePath);
    
    proceedWithAdding(resolvedJsonPath);
}

function proceedWithAdding(resolvedJsonPath) {
    // Read and parse JSON file
    let postData;
    try {
        const jsonContent = fs.readFileSync(resolvedJsonPath, 'utf-8');
        postData = JSON.parse(jsonContent);
    } catch (error) {
        console.error(`Error reading JSON file: ${error.message}`);
        process.exit(1);
    }

    // Validate required fields
    const requiredFields = ['title', 'date', 'slug', 'excerpt', 'content', 'tags', 'readTime'];
    for (const field of requiredFields) {
        if (!postData[field]) {
            console.error(`Missing required field: ${field}`);
            process.exit(1);
        }
    }

    // Helper function to escape single quotes in strings
    function escapeSingleQuotes(str) {
        return str.replace(/'/g, "\\'");
    }

    // Re-read files to get latest content (in case multiple posts are being added)
    slugAstroContent = fs.readFileSync(slugAstroPath, 'utf-8');
    blogPostsTsContent = fs.readFileSync(blogPostsTsPath, 'utf-8');

    // 1. Add to blog-posts.ts (source of truth)
    const blogPostTsEntry = `\t{\n\t\ttitle: "${postData.title.replace(/"/g, '\\"')}",\n\t\texcerpt: "${postData.excerpt.replace(/"/g, '\\"')}",\n\t\tdate: "${postData.date}",\n\t\tslug: "${postData.slug}",\n\t\ttags: [${postData.tags.map(t => `"${t.replace(/"/g, '\\"')}"`).join(', ')}],\n\t\treadTime: "${postData.readTime.replace(/"/g, '\\"')}"\n\t}`;

    const postsTsArrayRegex = /export const posts: BlogPost\[\] = \[([\s\S]*?)\];/;
    const postsTsArrayMatch = blogPostsTsContent.match(postsTsArrayRegex);

    if (!postsTsArrayMatch) {
        console.error('Could not find posts array in blog-posts.ts');
        process.exit(1);
    }

    // Check if slug already exists
    if (postsTsArrayMatch[1].includes(`slug: "${postData.slug}"`)) {
        console.error(`Post with slug "${postData.slug}" already exists in blog-posts.ts`);
        process.exit(1);
    }

    // Add new post to the array
    const existingPostsTs = postsTsArrayMatch[1].trim();
    const newPostsTsArray = existingPostsTs 
        ? `${existingPostsTs},\n${blogPostTsEntry}`
        : blogPostTsEntry;

    blogPostsTsContent = blogPostsTsContent.replace(
        postsTsArrayRegex,
        `export const posts: BlogPost[] = [\n${newPostsTsArray}\n];`
    );

    // 2. Add slug to getStaticPaths in [slug].astro
    const getStaticPathsRegex = /export async function getStaticPaths\(\) \{[\s\S]*?const posts = \[([\s\S]*?)\];/;
    const getStaticPathsMatch = slugAstroContent.match(getStaticPathsRegex);

    if (!getStaticPathsMatch) {
        console.error('Could not find getStaticPaths function in [slug].astro');
        process.exit(1);
    }

    // Check if slug already exists
    if (getStaticPathsMatch[1].includes(`'${postData.slug}'`)) {
        console.error(`Slug "${postData.slug}" already exists in getStaticPaths`);
        process.exit(1);
    }

    // Add slug to the array
    let existingSlugs = getStaticPathsMatch[1].trim();
    // Remove trailing comma if present, we'll add it properly
    existingSlugs = existingSlugs.replace(/,\s*$/, '');

    // Ensure there's a comma if there are existing slugs
    const newSlugsArray = existingSlugs
        ? `${existingSlugs},\n\t\t'${postData.slug}'`
        : `\t\t'${postData.slug}'`;

    slugAstroContent = slugAstroContent.replace(
        getStaticPathsRegex,
        (match) => match.replace(/const posts = \[[\s\S]*?\];/, `const posts = [\n${newSlugsArray}\n\t];`)
    );

    // 3. Add post data to posts object in [slug].astro
    // Find the posts object - need to match until the closing brace before the semicolon
    const postsObjectStart = slugAstroContent.indexOf('const posts: Record<string, {');
    if (postsObjectStart === -1) {
        console.error('Could not find posts object in [slug].astro');
        process.exit(1);
    }

    // Find the opening brace of the object (after the = sign)
    const equalsIndex = slugAstroContent.indexOf('=', postsObjectStart);
    if (equalsIndex === -1) {
        console.error('Could not find assignment operator for posts object');
        process.exit(1);
    }

    // Find the opening brace after the equals sign
    let objectStart = -1;
    let objectEnd = -1;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';

    for (let i = equalsIndex; i < slugAstroContent.length; i++) {
        const char = slugAstroContent[i];
        const prevChar = i > 0 ? slugAstroContent[i - 1] : '';
        
        // Handle string literals
        if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
        } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
        }
        
        if (inString) continue;
        
        if (char === '{') {
            if (objectStart === -1) {
                objectStart = i;
            }
            braceCount++;
        } else if (char === '}') {
            braceCount--;
            if (braceCount === 0 && objectStart !== -1) {
                objectEnd = i;
                break;
            }
        }
    }

    if (objectStart === -1 || objectEnd === -1) {
        console.error('Could not parse posts object structure in [slug].astro');
        process.exit(1);
    }

    // Extract existing posts object content
    const existingPostsData = slugAstroContent.substring(objectStart + 1, objectEnd).trim();

    // Check if slug already exists in posts object
    if (existingPostsData.includes(`'${postData.slug}':`)) {
        console.error(`Post data for slug "${postData.slug}" already exists`);
        process.exit(1);
    }

    // Format content with proper indentation
    const formattedContent = postData.content
        .split('\n')
        .map(line => `\t\t\t${line}`)
        .join('\n')
        .trim();

    // Create the post entry
    const postDataEntry = `\t'${postData.slug}': {\n\t\ttitle: '${escapeSingleQuotes(postData.title)}',\n\t\tdate: '${postData.date}',\n\t\treadTime: '${escapeSingleQuotes(postData.readTime)}',\n\t\ttags: [${postData.tags.map(t => `'${escapeSingleQuotes(t)}'`).join(', ')}],\n\t\tcontent: \`\n${formattedContent}\n\t\t\`\n\t}`;

    // Add to posts object - ensure there's a comma if there's existing data
    let newPostsObject;
    if (existingPostsData) {
        // Remove trailing comma if present
        const cleanedExisting = existingPostsData.replace(/,\s*$/, '');
        newPostsObject = `${cleanedExisting},\n${postDataEntry}`;
    } else {
        newPostsObject = postDataEntry;
    }

    // Replace the object content
    slugAstroContent = slugAstroContent.substring(0, objectStart + 1) + 
        `\n${newPostsObject}\n` + 
        slugAstroContent.substring(objectEnd);

    // Write updated files
    try {
        fs.writeFileSync(blogPostsTsPath, blogPostsTsContent, 'utf-8');
        console.log('✓ Updated src/data/blog-posts.ts');
        
        fs.writeFileSync(slugAstroPath, slugAstroContent, 'utf-8');
        console.log('✓ Updated src/pages/blog/[slug].astro');
        
        console.log(`\n✅ Successfully added blog post "${postData.title}"!`);
        console.log(`   Slug: ${postData.slug}`);
        console.log(`\n   You can now view it at: /blog/${postData.slug}`);
        console.log(`   The "Latest Thoughts" section will automatically show the newest posts!`);
    } catch (error) {
        console.error(`Error writing files: ${error.message}`);
        process.exit(1);
    }
}

