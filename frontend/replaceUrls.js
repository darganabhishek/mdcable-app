import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function replaceInDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;
            
            // Replace 'http://localhost:5000/api/...' -> `${import.meta.env.VITE_API_URL}/...`
            content = content.replace(/'http:\/\/localhost:5000\/api([^']*)'/g, "`${import.meta.env.VITE_API_URL}$1`");
            
            // Replace `http://localhost:5000/api/...` -> `${import.meta.env.VITE_API_URL}/...`
            content = content.replace(/`http:\/\/localhost:5000\/api([^`]*)`/g, "`${import.meta.env.VITE_API_URL}$1`");
            
            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    });
}

replaceInDir(path.join(__dirname, 'src'));
