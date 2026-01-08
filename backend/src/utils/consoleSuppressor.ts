/**
 * Console Output Suppressor Utility
 * Temporarily suppresses specific console messages during operations
 */

class ConsoleSuppressor {
  constructor() {
    this.originalConsoleLog = console.log;
    this.originalConsoleInfo = console.info;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;
  }

  /**
   * Suppress console output for specific patterns during a function execution
   */
  async suppressDuringExecution(operation, suppressPatterns = [], showSummary = true) {
    let suppressedCount = 0;
    const suppressedMessages = [];

    // Override console methods
    const overrideConsole =
      (originalMethod, methodName) =>
      (...args) => {
        const message = args.join(' ');

        // Check if message matches any suppress pattern
        const shouldSuppress = suppressPatterns.some(pattern => {
          if (typeof pattern === 'string') {
            return message.includes(pattern);
          }
          if (pattern instanceof RegExp) {
            return pattern.test(message);
          }
          return false;
        });

        if (shouldSuppress) {
          suppressedCount++;
          if (showSummary) {
            suppressedMessages.push(message);
          }
          return; // Suppress the message
        }

        // Allow the message through
        originalMethod.apply(console, args);
      };

    // Apply overrides
    console.log = overrideConsole(this.originalConsoleLog, 'log');
    console.info = overrideConsole(this.originalConsoleInfo, 'info');
    console.warn = overrideConsole(this.originalConsoleWarn, 'warn');
    console.error = overrideConsole(this.originalConsoleError, 'error');

    try {
      // Execute the operation
      const result = await operation();

      // Show summary if requested
      if (showSummary && suppressedCount > 0) {
        console.log(`✅ Operation completed (${suppressedCount} messages suppressed)`);
      }

      return result;
    } finally {
      // Always restore original console methods
      this.restore();
    }
  }

  /**
   * Restore original console methods
   */
  restore() {
    console.log = this.originalConsoleLog;
    console.info = this.originalConsoleInfo;
    console.warn = this.originalConsoleWarn;
    console.error = this.originalConsoleError;
  }

  /**
   * Suppress command handler loading messages
   */
  async suppressCommandLoading(operation) {
    const suppressPatterns = [
      '[command-handler] Loaded Command -',
      '[command-handler] Loaded Hears -',
      '[command-handler]',
    ];

    let commandCount = 0;

    // Count commands while suppressing
    const countingOverride =
      originalMethod =>
      (...args) => {
        const message = args.join(' ');
        if (message.includes('[command-handler] Loaded Command -')) {
          commandCount++;
          return; // Suppress
        }
        if (message.includes('[command-handler] Loaded Hears -')) {
          return; // Suppress
        }
        if (message.includes('[command-handler]')) {
          return; // Suppress other command-handler messages
        }
        originalMethod.apply(console, args);
      };

    // Apply counting overrides
    console.log = countingOverride(this.originalConsoleLog);
    console.info = countingOverride(this.originalConsoleInfo);

    try {
      const result = await operation();

      // Show simple success message
      console.log(`✅ Command handler loaded successfully (${commandCount} commands)`);

      return result;
    } finally {
      this.restore();
    }
  }
}

export default ConsoleSuppressor;
