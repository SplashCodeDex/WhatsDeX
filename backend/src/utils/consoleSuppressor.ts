/**
 * Console Output Suppressor Utility
 */

type ConsoleMethod = (...args: any[]) => void;

export class ConsoleSuppressor {
  private originalConsoleLog: ConsoleMethod;
  private originalConsoleInfo: ConsoleMethod;
  private originalConsoleWarn: ConsoleMethod;
  private originalConsoleError: ConsoleMethod;

  constructor() {
    this.originalConsoleLog = console.log;
    this.originalConsoleInfo = console.info;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;
  }

  async suppressDuringExecution<T>(
    operation: () => Promise<T>, 
    suppressPatterns: (string | RegExp)[] = [], 
    showSummary = true
  ): Promise<T> {
    let suppressedCount = 0;

    const overrideConsole = (originalMethod: ConsoleMethod): ConsoleMethod => {
      return (...args: any[]) => {
        const message = args.join(' ');
        const shouldSuppress = suppressPatterns.some(pattern => {
          if (typeof pattern === 'string') return message.includes(pattern);
          if (pattern instanceof RegExp) return pattern.test(message);
          return false;
        });

        if (shouldSuppress) {
          suppressedCount++;
          return;
        }
        originalMethod.apply(console, args);
      };
    };

    console.log = overrideConsole(this.originalConsoleLog);
    console.info = overrideConsole(this.originalConsoleInfo);
    console.warn = overrideConsole(this.originalConsoleWarn);
    console.error = overrideConsole(this.originalConsoleError);

    try {
      const result = await operation();
      if (showSummary && suppressedCount > 0) {
        this.originalConsoleLog(`✅ Operation completed (${suppressedCount} messages suppressed)`);
      }
      return result;
    } finally {
      this.restore();
    }
  }

  public restore(): void {
    console.log = this.originalConsoleLog;
    console.info = this.originalConsoleInfo;
    console.warn = this.originalConsoleWarn;
    console.error = this.originalConsoleError;
  }

  async suppressCommandLoading<T>(operation: () => Promise<T>): Promise<T> {
    let commandCount = 0;

    const countingOverride = (originalMethod: ConsoleMethod): ConsoleMethod => {
      return (...args: any[]) => {
        const message = args.join(' ');
        if (message.includes('[command-handler] Loaded Command -')) {
          commandCount++;
          return;
        }
        if (message.includes('[command-handler]')) return;
        originalMethod.apply(console, args);
      };
    };

    console.log = countingOverride(this.originalConsoleLog);
    console.info = countingOverride(this.originalConsoleInfo);

    try {
      const result = await operation();
      this.originalConsoleLog(`✅ Command handler loaded successfully (${commandCount} commands)`);
      return result;
    } finally {
      this.restore();
    }
  }
}

export const consoleSuppressor = new ConsoleSuppressor();
export default consoleSuppressor;