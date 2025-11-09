import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get commit message from command line argument or use default
const commitMessage = process.argv[2] || 'Blog content';

// Get the project root (one level up from blog-tools)
const projectRoot = path.join(__dirname, '..');

// Change to project root directory
process.chdir(projectRoot);

console.log('🚀 Pushing blog changes to GitHub...\n');

try {
    // Check if there are any changes to commit
    let statusOutput;
    try {
        statusOutput = execSync('git status --porcelain', { encoding: 'utf-8', stdio: 'pipe' });
    } catch (error) {
        console.error('Error checking git status. Make sure you are in a git repository.');
        process.exit(1);
    }

    if (!statusOutput.trim()) {
        console.log('ℹ️  No changes to commit.');
        process.exit(0);
    }

    console.log('📝 Staging all changes...');
    execSync('git add .', { stdio: 'inherit' });
    console.log('✓ Changes staged\n');

    console.log(`💬 Committing with message: "${commitMessage}"`);
    // Escape the commit message properly for shell execution
    const escapedMessage = commitMessage.replace(/"/g, '\\"');
    execSync(`git commit -m "${escapedMessage}"`, { stdio: 'inherit' });
    console.log('✓ Changes committed\n');

    console.log('⬆️  Pushing to GitHub...');
    execSync('git push', { stdio: 'inherit' });
    console.log('\n✅ Successfully pushed to GitHub!');
    
} catch (error) {
    console.error('\n❌ Error pushing to GitHub:');
    if (error.message) {
        console.error(error.message);
    }
    process.exit(1);
}

