import * as fs from 'fs';
import * as path from 'path';

/**
 * CONNECTION DEBUGGER - Analyzes and fixes WhatsApp connection issues
 */

interface ConnectionError {
  message: string;
  code?: string | number;
  stack?: string[];
}

interface ConnectionAttempt {
  timestamp: number;
  status: string;
  error: ConnectionError | null;
  context: any;
}

interface Diagnosis {
  issues: string[];
  recommendations: string[];
  severity: 'info' | 'warning' | 'error' | 'critical';
}

interface Recommendation {
  priority: 'low' | 'medium' | 'high';
  action: string;
  description: string;
  command?: string;
  reason?: string;
  items?: string[];
}

export class ConnectionDebugger {
  private connectionAttempts: ConnectionAttempt[];
  private errorPatterns: Map<string, number>;
  private sessionIssues: any[];

  constructor() {
    this.connectionAttempts = [];
    this.errorPatterns = new Map();
    this.sessionIssues = [];
  }

  public logConnectionAttempt(status: string, error: any = null, context = {}): void {
    const attempt: ConnectionAttempt = {
      timestamp: Date.now(),
      status,
      error: error ? {
        message: error.message,
        code: error.output?.statusCode || error.code,
        stack: error.stack?.split('\n').slice(0, 3)
      } : null,
      context
    };

    this.connectionAttempts.push(attempt);

    if (this.connectionAttempts.length > 50) {
      this.connectionAttempts.shift();
    }

    this.analyzeErrorPatterns();
  }

  private analyzeErrorPatterns(): void {
    const recentErrors = this.connectionAttempts
      .filter(attempt => attempt.error && Date.now() - attempt.timestamp < 300000)
      .map(attempt => attempt.error!);

    const errorCounts = new Map<string, number>();
    recentErrors.forEach(error => {
      const key = `${error.code || 'unknown'}_${error.message?.substring(0, 50) || 'unknown'}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    this.errorPatterns = errorCounts;
  }

  public diagnoseConnectionIssues(): Diagnosis {
    const diagnosis: Diagnosis = {
      issues: [],
      recommendations: [],
      severity: 'info'
    };

    const recentAttempts = this.connectionAttempts
      .filter(attempt => Date.now() - attempt.timestamp < 60000);

    if (recentAttempts.length > 5) {
      diagnosis.issues.push('Rapid reconnection loop detected');
      diagnosis.recommendations.push('Check session validity and clear if corrupted');
      diagnosis.severity = 'critical';
    }

    // Use Array.from to avoid iteration errors
    Array.from(this.errorPatterns.entries()).forEach(([errorKey, count]) => {
      if (count > 3) {
        const [code, message] = errorKey.split('_');

        if (code === '405') {
          diagnosis.issues.push('WhatsApp connection refused (405)');
          diagnosis.recommendations.push('Delete sessions folder and re-authenticate');
          diagnosis.severity = 'warning';
        } else if (code === '401') {
          diagnosis.issues.push('Authentication failure');
          diagnosis.recommendations.push('Clear session and generate new QR code');
          diagnosis.severity = 'error';
        } else if (message.includes('ECONNRESET')) {
          diagnosis.issues.push('Network connection issues');
          diagnosis.recommendations.push('Check internet connection and DNS settings');
          diagnosis.severity = 'warning';
        }
      }
    });

    const sessionHealth = this.checkSessionHealth();
    if (!sessionHealth.healthy) {
      diagnosis.issues.push(`Session health: ${sessionHealth.issue}`);
      diagnosis.recommendations.push(sessionHealth.recommendation!);
      diagnosis.severity = 'error';
    }

    return diagnosis;
  }

  public checkSessionHealth(): { healthy: boolean; issue?: string; recommendation?: string } {
    try {
      const sessionPath = './sessions';

      if (!fs.existsSync(sessionPath)) {
        return { healthy: false, issue: 'Session directory missing', recommendation: 'Restart application' };
      }

      const sessionFiles = fs.readdirSync(sessionPath);
      if (sessionFiles.length === 0) {
        return { healthy: true, issue: 'No existing session', recommendation: 'Fresh start' };
      }

      const credsFile = path.join(sessionPath, 'creds.json');
      if (fs.existsSync(credsFile)) {
        const stats = fs.statSync(credsFile);
        const age = Date.now() - stats.mtime.getTime();

        if (age > 30 * 24 * 60 * 60 * 1000) {
          return { healthy: false, issue: 'Session is very old', recommendation: 'Re-authenticate' };
        }
      }

      return { healthy: true };
    } catch (error: unknown) {
      return { healthy: false, issue: `Check failed: ${error instanceof Error ? error.message : error}`, recommendation: 'Clear session' };
    }
  }

  public getConnectionReport() {
    const diagnosis = this.diagnoseConnectionIssues();
    return {
      summary: {
        totalAttempts: this.connectionAttempts.length,
        recentFailures: this.connectionAttempts.slice(-10).filter(a => a.error).length,
        diagnosis
      },
      recommendations: this.generateRecommendations(diagnosis)
    };
  }

  private generateRecommendations(diagnosis: Diagnosis): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (diagnosis.severity === 'critical') {
      recommendations.push({
        priority: 'high',
        action: 'clear_session',
        description: 'Clear session directory and restart'
      });
    }

    return recommendations;
  }

  public shouldClearSession(): boolean {
    const d = this.diagnoseConnectionIssues();
    return d.severity === 'critical' || d.issues.some(i => i.includes('405') || i.includes('401'));
  }
}

export const connectionDebugger = new ConnectionDebugger();
export default connectionDebugger;
