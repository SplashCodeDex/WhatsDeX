/**
 * Module System Standardization Utility
 * Fixes mixed CommonJS/ES6 module issues
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

export class ModuleSystemFixer {
  constructor() {
    this.rootDir = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    this.excludePatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.env'
    ];
  }

  async scanAndFix() {
    console.log('🔍 Scanning for module system issues...');
    
    const issues = await this.findModuleIssues();
    console.log(`Found ${issues.length} files with mixed module systems`);
    
    for (const issue of issues) {
      console.log(`📁 ${issue.file}: ${issue.problems.join(', ')}`);
    }
    
    // Optionally auto-fix (commented out for safety)
    // await this.autoFix(issues);
    
    return issues;
  }

  async findModuleIssues(dir = this.rootDir) {
    const issues = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !this.shouldExclude(entry.name)) {
          const subIssues = await this.findModuleIssues(fullPath);
          issues.push(...subIssues);
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          const fileIssues = await this.analyzeFile(fullPath);
          if (fileIssues.problems.length > 0) {
            issues.push(fileIssues);
          }
        }
      }
    } catch (error: any) {
      console.warn(`Warning: Cannot access ${dir}:`, error.message);
    }
    
    return issues;
  }

  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const problems = [];
    
    const hasRequire = /require\s*\(/.test(content);
    const hasImport = /import\s+.*\s+from/.test(content);
    const hasModuleExports = /module\.exports/.test(content);
    const hasExportDefault = /export\s+default/.test(content);
    const hasExports = /export\s+\{/.test(content);
    
    // Check for mixed patterns
    if (hasRequire && hasImport) {
      problems.push('Mixed require() and import statements');
    }
    
    if (hasModuleExports && (hasExportDefault || hasExports)) {
      problems.push('Mixed module.exports and ES6 exports');
    }
    
    // Check for __dirname usage (not available in ES6 modules)
    if (/__dirname|__filename/.test(content)) {
      problems.push('Uses __dirname/__filename (not available in ES6 modules)');
    }
    
    return {
      file: path.relative(this.rootDir, filePath),
      problems,
      hasRequire,
      hasImport,
      hasModuleExports,
      hasExportDefault,
      content
    };
  }

  shouldExclude(name) {
    return this.excludePatterns.some(pattern => name.includes(pattern));
  }

  // Auto-fix functionality (use with caution)
  async autoFix(issues) {
    console.log('🔧 Starting auto-fix...');
    
    for (const issue of issues) {
      if (issue.hasRequire || issue.hasModuleExports) {
        await this.convertToES6(issue);
      }
    }
  }

  async convertToES6(issue) {
    const filePath = path.join(this.rootDir, issue.file);
    let content = issue.content;
    
    // Convert require() to import
    content = content.replace(
      /const\s+(\w+)\s+=\s+require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      'import $1 from \'$2\';'
    );
    
    content = content.replace(
      /const\s+\{\s*([^}]+)\s*\}\s+=\s+require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      'import { $1 } from \'$2\';'
    );
    
    // Convert module.exports to export default
    content = content.replace(
      /module\.exports\s*=\s*/g,
      'export default '
    );
    
    // Fix __dirname and __filename
    if (content.includes('__dirname') || content.includes('__filename')) {
      const importStatement = "import { fileURLToPath } from 'url';\nimport path from 'path';\n\nconst __filename = fileURLToPath(import.meta.url);\nconst __dirname = path.dirname(__filename);\n";
      
      // Add import at the top
      if (!content.includes('fileURLToPath')) {
        content = importStatement + content;
      }
    }
    
    // Write the fixed file
    await fs.writeFile(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${issue.file}`);
  }

  // Generate report
  generateReport(issues) {
    const report = {
      totalFiles: issues.length,
      byProblemType: {},
      summary: []
    };

    issues.forEach(issue => {
      issue.problems.forEach(problem => {
        report.byProblemType[problem] = (report.byProblemType[problem] || 0) + 1;
      });
    });

    report.summary = [
      `📊 Module System Analysis Report`,
      `Total files with issues: ${report.totalFiles}`,
      ``,
      `Problem breakdown:`,
      ...Object.entries(report.byProblemType).map(([problem, count]) => 
        `  - ${problem}: ${count} files`
      ),
      ``,
      `Recommended actions:`,
      `1. Convert all require() statements to import`,
      `2. Convert all module.exports to export default/export`,
      `3. Replace __dirname/__filename with ES6 equivalents`,
      `4. Update package.json to include "type": "module"`
    ];

    return report;
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new ModuleSystemFixer();
  const issues = await fixer.scanAndFix();
  const report = fixer.generateReport(issues);
  
  console.log('\n' + report.summary.join('\n'));
  
  if (issues.length > 0) {
    console.log('\n⚠️ Manual review recommended before applying auto-fixes');
  } else {
    console.log('\n✅ No module system issues found!');
  }
}
