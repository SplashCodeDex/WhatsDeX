/**
 * Module System Standardization Utility
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

interface ModuleIssue {
  file: string;
  problems: string[];
  hasRequire: boolean;
  hasImport: boolean;
  hasModuleExports: boolean;
  hasExportDefault: boolean;
  content: string;
}

interface FixerReport {
  totalFiles: number;
  byProblemType: Record<string, number>;
  summary: string[];
}

export class ModuleSystemFixer {
  private rootDir: string;
  private excludePatterns: string[];

  constructor() {
    this.rootDir = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
    this.excludePatterns = ['node_modules', '.git', 'dist', 'build', '.env'];
  }

  async scanAndFix(): Promise<ModuleIssue[]> {
    console.log('🔍 Scanning for module system issues...');
    const issues = await this.findModuleIssues();
    console.log(`Found ${issues.length} files with mixed module systems`);
    return issues;
  }

  async findModuleIssues(dir: string = this.rootDir): Promise<ModuleIssue[]> {
    const issues: ModuleIssue[] = [];
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory() && !this.shouldExclude(entry.name)) {
          issues.push(...(await this.findModuleIssues(fullPath)));
        } else if (entry.isFile() && entry.name.endsWith('.js')) {
          const fileIssues = await this.analyzeFile(fullPath);
          if (fileIssues.problems.length > 0) issues.push(fileIssues);
        }
      }
    } catch (error: unknown) {
      console.warn(`Warning: Cannot access ${dir}`);
    }
    return issues;
  }

  private async analyzeFile(filePath: string): Promise<ModuleIssue> {
    const content = await fs.readFile(filePath, 'utf8');
    const problems: string[] = [];
    
    const hasRequire = /require\s*\(/.test(content);
    const hasImport = /import\s+.*\s+from/.test(content);
    const hasModuleExports = /module\.exports/.test(content);
    const hasExportDefault = /export\s+default/.test(content);
    const hasExports = /export\s+\{/.test(content);
    
    if (hasRequire && hasImport) problems.push('Mixed require() and import');
    if (hasModuleExports && (hasExportDefault || hasExports)) problems.push('Mixed module.exports and ES6');
    if (/__dirname|__filename/.test(content)) problems.push('Uses __dirname/__filename');
    
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

  private shouldExclude(name: string): boolean {
    return this.excludePatterns.some(pattern => name.includes(pattern));
  }

  public generateReport(issues: ModuleIssue[]): FixerReport {
    const report: FixerReport = {
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
      ...Object.entries(report.byProblemType).map(([problem, count]) => `  - ${problem}: ${count} files`)
    ];

    return report;
  }
}

export const moduleSystemFixer = new ModuleSystemFixer();
export default moduleSystemFixer;