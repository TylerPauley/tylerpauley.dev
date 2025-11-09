import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths relative to the blog-tools folder
const slugAstroPath = path.join(__dirname, '..', 'src', 'pages', 'blog', '[slug].astro');
const blogPostsTsPath = path.join(__dirname, '..', 'src', 'data', 'blog-posts.ts');

// Read [slug].astro
let slugAstroContent = fs.readFileSync(slugAstroPath, 'utf-8');

// Read blog-posts.ts
let blogPostsTsContent = fs.readFileSync(blogPostsTsPath, 'utf-8');

// Function to get all blog post slugs
function getAllSlugs() {
    // Get slugs from blog-posts.ts (source of truth)
    const postsArrayRegex = /export const posts: BlogPost\[\] = \[([\s\S]*?)\];/;
    const match = blogPostsTsContent.match(postsArrayRegex);
    
    if (!match) {
        return [];
    }
    
    const postsContent = match[1];
    const slugs = [];
    
    // Extract all slugs from the posts array
    const slugRegex = /slug:\s*"([^"]+)"/g;
    let slugMatch;
    while ((slugMatch = slugRegex.exec(postsContent)) !== null) {
        slugs.push({
            slug: slugMatch[1],
            index: slugs.length
        });
    }
    
    return slugs;
}

// Get slug from command line argument or prompt user
let slug = process.argv[2];

// If no slug provided, show list and let user select
if (!slug) {
    const slugs = getAllSlugs();
    
    if (slugs.length === 0) {
        console.error('No blog posts found.');
        process.exit(1);
    }
    
    console.log('\n📝 Available blog posts:\n');
    slugs.forEach((item, index) => {
        // Try to get the title for better display
        const titleMatch = blogPostsTsContent.match(
            new RegExp(`slug:\\s*"${item.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^}]*title:\\s*"([^"]+)"`, 's')
        );
        const title = titleMatch ? titleMatch[1] : item.slug;
        console.log(`  ${index + 1}. ${title} (${item.slug})`);
    });
    console.log();
    
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    
    rl.question('Enter the number of the post to remove (or press Ctrl+C to cancel): ', (answer) => {
        const selectedIndex = parseInt(answer) - 1;
        
        if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= slugs.length) {
            console.error('Invalid selection.');
            rl.close();
            process.exit(1);
        }
        
        slug = slugs[selectedIndex].slug;
        rl.close();
        proceedWithRemoval(slug);
    });
    
    // Don't proceed yet, wait for user input
} else {
    proceedWithRemoval(slug);
}

// Helper function to remove a post entry from blog-posts.ts
function removeFromBlogPostsTs(content, slugToRemove) {
    const postsArrayRegex = /export const posts: BlogPost\[\] = \[([\s\S]*?)\];/;
    const match = content.match(postsArrayRegex);
    
    if (!match) {
        console.error('Could not find posts array in blog-posts.ts');
        return null;
    }
    
    const postsContent = match[1];
    
    // Find the post entry with this slug by matching braces properly
    const slugPattern = `slug: "${slugToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`;
    const slugIndex = postsContent.indexOf(slugPattern);
    
    if (slugIndex === -1) {
        console.error(`Post with slug "${slugToRemove}" not found in blog-posts.ts`);
        return null;
    }
    
    // Find the start of this object (opening brace)
    let entryStart = slugIndex;
    while (entryStart > 0 && postsContent[entryStart] !== '{') {
        entryStart--;
    }
    
    if (entryStart < 0 || postsContent[entryStart] !== '{') {
        console.error('Could not find opening brace for post entry');
        return null;
    }
    
    // Find the end of this object (matching closing brace)
    let entryEnd = entryStart + 1;
    let braceCount = 1;
    let inString = false;
    let stringChar = '';
    
    while (entryEnd < postsContent.length && braceCount > 0) {
        const char = postsContent[entryEnd];
        const prevChar = entryEnd > 0 ? postsContent[entryEnd - 1] : '';
        
        if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
        } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
        }
        
        if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }
        
        entryEnd++;
    }
    
    // Skip trailing comma and whitespace
    while (entryEnd < postsContent.length && 
           (postsContent[entryEnd] === ',' || 
            postsContent[entryEnd] === ' ' || 
            postsContent[entryEnd] === '\t' || 
            postsContent[entryEnd] === '\n')) {
        entryEnd++;
    }
    
    // Remove the entry
    const beforeEntry = postsContent.substring(0, entryStart).trim();
    const afterEntry = postsContent.substring(entryEnd).trim();
    
    // Clean up commas
    let newPostsContent = '';
    if (beforeEntry && afterEntry) {
        newPostsContent = beforeEntry.replace(/,\s*$/, '') + ',\n' + afterEntry;
    } else if (beforeEntry) {
        newPostsContent = beforeEntry.replace(/,\s*$/, '');
    } else if (afterEntry) {
        newPostsContent = afterEntry.replace(/^,\s*/, '');
    }
    
    return content.replace(
        postsArrayRegex,
        `export const posts: BlogPost[] = [\n${newPostsContent}\n];`
    );
}

// Helper function to remove a post entry from the blog.astro array
function removeFromBlogArray(content, slugToRemove) {
    const postsArrayRegex = /const posts: BlogPost\[\] = \[([\s\S]*?)\];/;
    const match = content.match(postsArrayRegex);
    
    if (!match) {
        console.error('Could not find posts array in blog.astro');
        return null;
    }
    
    const postsContent = match[1];
    
    // Find the post entry with this slug by matching braces properly
    const slugPattern = `slug: "${slugToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`;
    const slugIndex = postsContent.indexOf(slugPattern);
    
    if (slugIndex === -1) {
        console.error(`Post with slug "${slugToRemove}" not found in blog.astro`);
        return null;
    }
    
    // Find the start of this object (opening brace)
    let entryStart = slugIndex;
    while (entryStart > 0 && postsContent[entryStart] !== '{') {
        entryStart--;
    }
    
    if (entryStart < 0 || postsContent[entryStart] !== '{') {
        console.error('Could not find opening brace for post entry');
        return null;
    }
    
    // Find the end of this object (matching closing brace)
    let entryEnd = entryStart + 1;
    let braceCount = 1;
    let inString = false;
    let stringChar = '';
    
    while (entryEnd < postsContent.length && braceCount > 0) {
        const char = postsContent[entryEnd];
        const prevChar = entryEnd > 0 ? postsContent[entryEnd - 1] : '';
        
        if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
        } else if (inString && char === stringChar && prevChar !== '\\') {
            inString = false;
        }
        
        if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') braceCount--;
        }
        
        entryEnd++;
    }
    
    // Skip trailing comma and whitespace
    while (entryEnd < postsContent.length && 
           (postsContent[entryEnd] === ',' || 
            postsContent[entryEnd] === ' ' || 
            postsContent[entryEnd] === '\t' || 
            postsContent[entryEnd] === '\n')) {
        entryEnd++;
    }
    
    // Remove the entry
    const beforeEntry = postsContent.substring(0, entryStart).trim();
    const afterEntry = postsContent.substring(entryEnd).trim();
    
    // Clean up commas
    let newPostsContent = '';
    if (beforeEntry && afterEntry) {
        newPostsContent = beforeEntry.replace(/,\s*$/, '') + ',\n' + afterEntry;
    } else if (beforeEntry) {
        newPostsContent = beforeEntry.replace(/,\s*$/, '');
    } else if (afterEntry) {
        newPostsContent = afterEntry.replace(/^,\s*/, '');
    }
    
    return content.replace(
        postsArrayRegex,
        `const posts: BlogPost[] = [\n${newPostsContent}\n];`
    );
}

// Helper function to remove slug from getStaticPaths array
function removeFromSlugArray(content, slugToRemove) {
    const getStaticPathsRegex = /export async function getStaticPaths\(\) \{[\s\S]*?const posts = \[([\s\S]*?)\];/;
    const match = content.match(getStaticPathsRegex);
    
    if (!match) {
        console.error('Could not find getStaticPaths function in [slug].astro');
        return null;
    }
    
    const slugsContent = match[1];
    
    // Remove the slug line (with or without comma)
    const slugRegex = new RegExp(
        `\\s*'${slugToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'[,\\s]*`,
        'g'
    );
    
    if (!slugRegex.test(slugsContent)) {
        console.error(`Slug "${slugToRemove}" not found in getStaticPaths`);
        return null;
    }
    
    let newSlugsContent = slugsContent.replace(slugRegex, '').trim();
    
    // Clean up any double commas or trailing commas
    newSlugsContent = newSlugsContent
        .replace(/,\s*,/g, ',')
        .replace(/,\s*$/, '')
        .trim();
    
    return content.replace(
        getStaticPathsRegex,
        (match) => match.replace(/const posts = \[[\s\S]*?\];/, `const posts = [\n${newSlugsContent}\n\t];`)
    );
}

// Helper function to remove post data from posts object
function removeFromPostsObject(content, slugToRemove) {
    // Find the posts object
    const postsObjectStart = content.indexOf('const posts: Record<string, {');
    if (postsObjectStart === -1) {
        console.error('Could not find posts object in [slug].astro');
        return null;
    }
    
    // Find the opening brace of the object
    const equalsIndex = content.indexOf('=', postsObjectStart);
    if (equalsIndex === -1) {
        console.error('Could not find assignment operator for posts object');
        return null;
    }
    
    let objectStart = -1;
    let objectEnd = -1;
    let braceCount = 0;
    let inString = false;
    let stringChar = '';
    
    for (let i = equalsIndex; i < content.length; i++) {
        const char = content[i];
        const prevChar = i > 0 ? content[i - 1] : '';
        
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
        console.error('Could not parse posts object structure');
        return null;
    }
    
    const existingPostsData = content.substring(objectStart + 1, objectEnd);
    
    // Check if slug exists
    if (!existingPostsData.includes(`'${slugToRemove}':`)) {
        console.error(`Post data for slug "${slugToRemove}" not found`);
        return null;
    }
    
    // Remove the post entry - match the entire entry including nested content
    // This regex matches from the slug key to the closing brace and comma
    const postEntryRegex = new RegExp(
        `\\s*'${slugToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*\\{[^}]*\\}[,\\s]*`,
        's'
    );
    
    // More robust: find the entry by matching braces properly
    const slugKeyPattern = `'${slugToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':`;
    const slugKeyIndex = existingPostsData.indexOf(slugKeyPattern);
    
    if (slugKeyIndex === -1) {
        console.error(`Could not find post entry for slug "${slugToRemove}"`);
        return null;
    }
    
    // Find the start of this entry (beginning of line or after comma)
    let entryStart = slugKeyIndex;
    while (entryStart > 0 && existingPostsData[entryStart - 1] !== '\n' && existingPostsData[entryStart - 1] !== ',') {
        entryStart--;
    }
    
    // Find the end of this entry (matching closing brace)
    let entryEnd = slugKeyIndex + slugKeyPattern.length;
    let entryBraceCount = 0;
    let entryInString = false;
    let entryStringChar = '';
    
    // Skip to the opening brace
    while (entryEnd < existingPostsData.length && existingPostsData[entryEnd] !== '{') {
        entryEnd++;
    }
    
    if (entryEnd >= existingPostsData.length) {
        console.error('Could not find opening brace for post entry');
        return null;
    }
    
    entryBraceCount = 1;
    entryEnd++;
    
    // Find matching closing brace
    while (entryEnd < existingPostsData.length && entryBraceCount > 0) {
        const char = existingPostsData[entryEnd];
        const prevChar = entryEnd > 0 ? existingPostsData[entryEnd - 1] : '';
        
        if (!entryInString && (char === '"' || char === "'" || char === '`')) {
            entryInString = true;
            entryStringChar = char;
        } else if (entryInString && char === entryStringChar && prevChar !== '\\') {
            entryInString = false;
        }
        
        if (!entryInString) {
            if (char === '{') entryBraceCount++;
            if (char === '}') entryBraceCount--;
        }
        
        entryEnd++;
    }
    
    // Skip trailing comma and whitespace
    while (entryEnd < existingPostsData.length && 
           (existingPostsData[entryEnd] === ',' || 
            existingPostsData[entryEnd] === ' ' || 
            existingPostsData[entryEnd] === '\t' || 
            existingPostsData[entryEnd] === '\n')) {
        entryEnd++;
    }
    
    // Remove the entry
    const beforeEntry = existingPostsData.substring(0, entryStart).trim();
    const afterEntry = existingPostsData.substring(entryEnd).trim();
    
    // Clean up commas
    let newPostsData = '';
    if (beforeEntry && afterEntry) {
        // Both exist - ensure proper comma
        newPostsData = beforeEntry.replace(/,\s*$/, '') + ',\n' + afterEntry;
    } else if (beforeEntry) {
        // Only before exists - remove trailing comma
        newPostsData = beforeEntry.replace(/,\s*$/, '');
    } else if (afterEntry) {
        // Only after exists - remove leading comma
        newPostsData = afterEntry.replace(/^,\s*/, '');
    }
    
    return content.substring(0, objectStart + 1) + 
        `\n${newPostsData}\n` + 
        content.substring(objectEnd);
}

function proceedWithRemoval(slug) {
    // Confirm deletion
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question(`\nAre you sure you want to remove the blog post with slug "${slug}"? (yes/no): `, (answer) => {
        if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
            console.log('Cancelled.');
            rl.close();
            process.exit(0);
        }
        
        // Remove from blog-posts.ts (source of truth)
        let updatedBlogPostsTs = removeFromBlogPostsTs(blogPostsTsContent, slug);
        if (!updatedBlogPostsTs) {
            rl.close();
            process.exit(1);
        }
        
        // Remove from getStaticPaths
        let updatedSlugContent = removeFromSlugArray(slugAstroContent, slug);
        if (!updatedSlugContent) {
            rl.close();
            process.exit(1);
        }
        
        // Remove from posts object
        updatedSlugContent = removeFromPostsObject(updatedSlugContent, slug);
        if (!updatedSlugContent) {
            rl.close();
            process.exit(1);
        }
        
        // Write updated files
        try {
            fs.writeFileSync(blogPostsTsPath, updatedBlogPostsTs, 'utf-8');
            console.log('✓ Removed from src/data/blog-posts.ts');
            
            fs.writeFileSync(slugAstroPath, updatedSlugContent, 'utf-8');
            console.log('✓ Removed from src/pages/blog/[slug].astro');
            
            console.log(`\n✅ Successfully removed blog post with slug "${slug}"!`);
            console.log(`   The "Latest Thoughts" section will automatically update!`);
        } catch (error) {
            console.error(`Error writing files: ${error.message}`);
            rl.close();
            process.exit(1);
        }
        
        rl.close();
    });
}

