import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the build directory
const buildDir = path.join(__dirname, '..', 'build');

// Copy index.html to 404.html
try {
    const indexPath = path.join(buildDir, 'index.html');
    const notFoundPath = path.join(buildDir, '404.html');
    
    // Check if index.html exists
    if (fs.existsSync(indexPath)) {
        // Read index.html content
        const indexContent = fs.readFileSync(indexPath, 'utf8');
        
        // Write to 404.html
        fs.writeFileSync(notFoundPath, indexContent);
        
        console.log('Successfully created 404.html from index.html');
    } else {
        console.error('Error: index.html not found in build directory');
        process.exit(1);
    }
} catch (error) {
    console.error('Error creating 404.html:', error);
    process.exit(1);
}
