import fs from 'fs/promises';
import path from 'path';

async function fixImports(dir) {
  const files = await fs.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await fixImports(fullPath);
    } else if (file.isFile() && fullPath.endsWith('.ts')) {
      let content = await fs.readFile(fullPath, 'utf-8');
      
      // Regex to match imports: import ... from './path' or '../path' that don't end with .js or .json or .ts
      // It also handles export ... from './path'
      const importRegex = /(import|export)\s+([\s\S]*?)\s+from\s+(['"])([\.\/][^'"]+?)(['"])/g;
      
      let changed = false;
      const newContent = content.replace(importRegex, (match, impExp, specifiers, quote1, importPath, quote2) => {
        if (!importPath.endsWith('.js') && !importPath.endsWith('.json') && !importPath.endsWith('.ts')) {
          changed = true;
          return `${impExp} ${specifiers} from ${quote1}${importPath}.js${quote2}`;
        }
        return match;
      });

      // Also handle dynamic imports: import('./path')
      const dynamicImportRegex = /import\((['"])([\.\/][^'"]+?)(['"])\)/g;
      const newContent2 = newContent.replace(dynamicImportRegex, (match, quote1, importPath, quote2) => {
         if (!importPath.endsWith('.js') && !importPath.endsWith('.json') && !importPath.endsWith('.ts')) {
          changed = true;
          return `import(${quote1}${importPath}.js${quote2})`;
        }
        return match;
      });

      if (changed) {
        await fs.writeFile(fullPath, newContent2, 'utf-8');
        console.log(`Fixed imports in ${fullPath}`);
      }
    }
  }
}

fixImports('../apps/ingestion-api/src').catch(console.error);
