/**
 * CONNECTION DEBUGGER - Analyzes and fixes WhatsApp connection issues
 * Helps identify why connections keep failing and reconnecting
 */

export class ConnectionDebugger {
  constructor() {
    this.connectionAttempts = [];
    this.errorPatterns = new Map();
    this.sessionIssues = [];
  }

  logConnectionAttempt(status, error = null, context = {}) {
    const attempt = {
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
    
    // Keep only last 50 attempts
    if (this.connectionAttempts.length > 50) {
      this.connectionAttempts.shift();
    }
    
    // Analyze patterns
    this.analyzeErrorPatterns();
  }

  analyzeErrorPatterns() {
    const recentErrors = this.connectionAttempts
      .filter(attempt => attempt.error && Date.now() - attempt.timestamp < 300000) // Last 5 minutes
      .map(attempt => attempt.error);

    // Count error types
    const errorCounts = new Map();
    recentErrors.forEach(error => {
      const key = `${error.code || 'unknown'}_${error.message?.substring(0, 50) || 'unknown'}`;
      errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
    });

    this.errorPatterns = errorCounts;
  }

  diagnoseConnectionIssues() {
    const diagnosis = {
      issues: [],
      recommendations: [],
      severity: 'info'
    };

    // Check for rapid reconnections
    const recentAttempts = this.connectionAttempts
      .filter(attempt => Date.now() - attempt.timestamp < 60000); // Last minute
    
    if (recentAttempts.length > 5) {
      diagnosis.issues.push('Rapid reconnection loop detected');
      diagnosis.recommendations.push('Check session validity and clear if corrupted');
      diagnosis.severity = 'critical';
    }

    // Check for specific error patterns
    for (const [errorKey, count] of this.errorPatterns) {
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
    }

    // Check session health
    const sessionHealth = this.checkSessionHealth();
    if (!sessionHealth.healthy) {
      diagnosis.issues.push(`Session health: ${sessionHealth.issue}`);
      diagnosis.recommendations.push(sessionHealth.recommendation);
      diagnosis.severity = 'error';
    }

    return diagnosis;
  }

  checkSessionHealth() {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const sessionPath = './sessions';
      
      if (!fs.existsSync(sessionPath)) {
        return {
          healthy: false,
          issue: 'Session directory missing',
          recommendation: 'Sessions will be created on first run'
        };
      }

      const sessionFiles = fs.readdirSync(sessionPath);
      
      if (sessionFiles.length === 0) {
        return {
          healthy: true,
          issue: 'No existing session - fresh start',
          recommendation: 'New QR code will be generated'
        };
      }

      // Check if session files are recent and valid
      const credsFile = path.join(sessionPath, 'creds.json');
      if (fs.existsSync(credsFile)) {
        const stats = fs.statSync(credsFile);
        const age = Date.now() - stats.mtime.getTime();
        
        if (age > 30 * 24 * 60 * 60 * 1000) { // 30 days old
          return {
            healthy: false,
            issue: 'Session is very old (>30 days)',
            recommendation: 'Clear session and re-authenticate'
          };
        }
      }

      return { healthy: true };
      
    } catch (error) {
      return {
        healthy: false,
        issue: `Session check failed: ${error.message}`,
        recommendation: 'Clear session directory and restart'
      };
    }
  }

  getConnectionReport() {
    const diagnosis = this.diagnoseConnectionIssues();
    const recentAttempts = this.connectionAttempts.slice(-10);
    
    return {
      summary: {
        totalAttempts: this.connectionAttempts.length,
        recentFailures: recentAttempts.filter(a => a.error).length,
        diagnosis
      },
      recentAttempts,
      recommendations: this.generateRecommendations(diagnosis)
    };
  }

  generateRecommendations(diagnosis) {
    const recommendations = [];
    
    if (diagnosis.severity === 'critical') {
      recommendations.push({
        priority: 'high',
        action: 'clear_session',
        description: 'Clear session directory and restart',
        command: 'Remove-Item -Recurse -Force ./sessions'
      });
    }

    if (diagnosis.issues.some(issue => issue.includes('405'))) {
      recommendations.push({
        priority: 'medium',
        action: 'wait_and_retry',
        description: 'Wait 5 minutes before retrying connection',
        reason: 'WhatsApp may be rate limiting connections'
      });
    }

    recommendations.push({
      priority: 'low',
      action: 'check_environment',
      description: 'Verify environment configuration',
      items: [
        'Check .env file exists and has required values',
        'Verify API keys are valid',
        'Test internet connection'
      ]
    });

    return recommendations;
  }

  logSessionClear() {
    this.sessionIssues.push({
      timestamp: Date.now(),
      action: 'session_cleared',
      reason: 'Connection debugging recommendation'
    });
  }

  shouldClearSession() {
    const diagnosis = this.diagnoseConnectionIssues();
    return diagnosis.severity === 'critical' || 
           diagnosis.issues.some(issue => issue.includes('405') || issue.includes('401'));
  }

  async autoFix() {
    const report = this.getConnectionReport();
    const fixes = [];

    if (this.shouldClearSession()) {
      try {
        const fs = require('fs').promises;
        await fs.rmdir('./sessions', { recursive: true });
        fixes.push('Cleared corrupted session directory');
        this.logSessionClear();
      } catch (error) {
        fixes.push(`Failed to clear session: ${error.message}`);
      }
    }

    return {
      applied: fixes,
      report
    };
  }
}

export default ConnectionDebugger;