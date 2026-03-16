const fs = require('fs');
const code = fs.readFileSync('c:/Users/tourg/Desktop/SANTIS_SITE/assets/js/app.js', 'utf8');

const lines = code.split('\n');
let blockHistory = [];
let depth = 0;
let inBlockComment = false;
let inString = false;
let stringChar = '';

for(let i = 0; i < lines.length; i++) {
    let line = lines[i];
    for(let j=0; j<line.length; j++) {
        if(inBlockComment) {
            if(line[j]==='*' && line[j+1]==='/') {
                inBlockComment=false;
                j++;
            }
            continue;
        }
        if(inString) {
            if(line[j]==='\\') {
                j++;
                continue;
            }
            if(line[j]===stringChar) {
                inString=false;
            }
            continue;
        }
        if(line[j]==='/' && line[j+1]==='/') break;
        if(line[j]==='/' && line[j+1]==='*') {
            inBlockComment=true;
            j++;
            continue;
        }
        
        // Regex literals check - very simple heuristics to avoid false positive
        if(line[j]==='/' && line[j-1] !== '*' && line.includes('/g') && !line.includes('//')) {
             // likely regex, skip line
             break;
        }

        if(line[j]==='"' || line[j]==="'" || line[j]==='`') {
            inString=true;
            stringChar=line[j];
            continue;
        }
        if(line[j]==='{') {
            depth++;
            blockHistory.push({line: i+1, char: '{'});
        }
        if(line[j]==='}') {
            depth--;
            blockHistory.pop();
        }
    }
}

if(depth > 0) {
    console.log("Unclosed items:");
    console.log(blockHistory.slice(-10));
} else if (depth < 0) {
    console.log("Negative depth:", depth);
} else {
    console.log("Balanced.");
}
