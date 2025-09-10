/**
 * Interactive Authentication Enhancement
 * Adds user choice prompts and session detection to UnifiedSmartAuth
 */

class InteractiveAuthEnhancement {
    constructor(unifiedAuth) {
        this.unifiedAuth = unifiedAuth;
        this.phoneticAlphabet = {
            'A': 'Alpha', 'B': 'Bravo', 'C': 'Charlie', 'D': 'Delta', 'E': 'Echo',
            'F': 'Foxtrot', 'G': 'Golf', 'H': 'Hotel', 'I': 'India', 'J': 'Juliet',
            'K': 'Kilo', 'L': 'Lima', 'M': 'Mike', 'N': 'November', 'O': 'Oscar',
            'P': 'Papa', 'Q': 'Quebec', 'R': 'Romeo', 'S': 'Sierra', 'T': 'Tango',
            'U': 'Uniform', 'V': 'Victor', 'W': 'Whiskey', 'X': 'X-ray', 'Y': 'Yankee', 'Z': 'Zulu'
        };
    }

    /**
     * Detect existing authenticated session
     */
    async detectExistingSession() {
        try {
            console.log('🔍 Detecting existing authenticated session...');

            const fs = require('fs').promises;
            const path = require('path');
            const statePath = path.join(__dirname, '../../state');
            const credsPath = path.join(statePath, 'creds.json');

            // Check if state directory and creds file exist
            const stateExists = await this.checkPathExists(statePath);
            const credsExists = await this.checkPathExists(credsPath);

            if (!stateExists || !credsExists) {
                return { hasSession: false, isValid: false, reason: 'No session files found' };
            }

            // Analyze credentials file
            const credsAnalysis = await this.analyzeCredsFile(credsPath);

            // Check if session is valid and registered
            const isValid = credsAnalysis.hasKeys && credsAnalysis.hasRegistration && credsAnalysis.hasPhoneNumber;

            if (isValid) {
                return {
                    hasSession: true,
                    isValid: true,
                    sessionInfo: {
                        phoneNumber: credsAnalysis.phoneNumber,
                        registrationId: credsAnalysis.registrationId,
                        lastActive: credsAnalysis.processedHistoryMessages.length > 0 ?
                            new Date().toISOString() : 'Unknown'
                    }
                };
            }

            return { hasSession: false, isValid: false, reason: 'Session exists but not valid' };

        } catch (error) {
            console.error('Failed to detect existing session:', error.message);
            return { hasSession: false, isValid: false, reason: 'Detection failed' };
        }
    }

    /**
     * Interactive session choice for existing sessions
     */
    async promptSessionChoice(sessionInfo) {
        return new Promise((resolve) => {
            console.log("\n" + "╔══════════════════════════════════════════════════════════════╗");
            console.log("║                    WhatsDeX Authentication                   ║");
            console.log("╠══════════════════════════════════════════════════════════════╣");
            console.log("║                                                              ║");
            console.log(`║  ✅ Session Status: Active session found                     ║`);
            console.log(`║  📱 Phone: ${this.formatPhoneNumber(sessionInfo.sessionInfo.phoneNumber) || 'Unknown'}                     ║`);
            console.log(`║  🕒 Last active: ${sessionInfo.sessionInfo.lastActive || 'Unknown'}                     ║`);
            console.log("║                                                              ║");
            console.log("║  What would you like to do?                                  ║");
            console.log("║                                                              ║");
            console.log("║  1. 🚀 Continue existing session                             ║");
            console.log("║  2. 🔄 Re-authenticate (New session)                         ║");
            console.log("║  3. 📊 View session analytics                                ║");
            console.log("║                                                              ║");
            console.log("║  Your choice (1-3) [Default: Continue]:                      ║");
            console.log("╚══════════════════════════════════════════════════════════════╝");

            // Set timeout for auto-selection
            const timeout = setTimeout(() => {
                console.log("\n⏰ No input received, continuing with existing session...");
                resolve('continue');
            }, 15000); // 15 seconds

            // Handle user input
            process.stdin.once('data', (data) => {
                clearTimeout(timeout);
                const input = data.toString().trim().toLowerCase();

                switch (input) {
                    case '1':
                    case 'continue':
                    case 'c':
                        console.log("✅ Continuing with existing authenticated session");
                        resolve('continue');
                        break;
                    case '2':
                    case 're-auth':
                    case 'r':
                        console.log("🔄 Re-authentication requested");
                        resolve('re-auth');
                        break;
                    case '3':
                    case 'analytics':
                    case 'a':
                        this.displayAnalytics();
                        // After showing analytics, ask again
                        setTimeout(() => {
                            this.promptSessionChoice(sessionInfo).then(resolve);
                        }, 2000);
                        break;
                    default:
                        console.log(`❌ Invalid choice: ${input}. Please enter 1, 2, or 3.`);
                        // Retry
                        setTimeout(() => {
                            this.promptSessionChoice(sessionInfo).then(resolve);
                        }, 1000);
                        break;
                }
            });
        });
    }

    /**
     * Interactive authentication method choice
     */
    async promptAuthenticationChoice() {
        return new Promise((resolve) => {
            console.log("\n" + "╔══════════════════════════════════════════════════════════════╗");
            console.log("║                    WhatsDeX Authentication                   ║");
            console.log("╠══════════════════════════════════════════════════════════════╣");
            console.log("║                                                              ║");
            console.log("║  🔍 Session Status: No active session found                  ║");
            console.log("║                                                              ║");
            console.log("║  Choose authentication method:                               ║");
            console.log("║                                                              ║");
            console.log("║  1. 📱 QR Code (Recommended for beginners)                   ║");
            console.log("║     Scan with WhatsApp camera                                ║");
            console.log("║                                                              ║");
            console.log("║  2. 🔢 Pairing Code (Advanced users)                         ║");
            console.log("║     Enter code in WhatsApp Linked Devices                    ║");
            console.log("║                                                              ║");
            console.log("║  3. 🔄 Auto-select (Based on learning data)                  ║");
            console.log("║                                                              ║");
            console.log("║  Your choice (1-3) [Press Enter for auto]:                   ║");
            console.log("╚══════════════════════════════════════════════════════════════╝");

            // Set timeout for auto-selection
            const timeout = setTimeout(() => {
                console.log("\n⏰ No input received, auto-selecting based on learning data...");
                resolve('auto');
            }, 20000); // 20 seconds

            // Handle user input
            process.stdin.once('data', (data) => {
                clearTimeout(timeout);
                const input = data.toString().trim().toLowerCase();

                switch (input) {
                    case '1':
                    case 'qr':
                    case 'q':
                        console.log("📱 QR Code authentication selected");
                        resolve('qr');
                        break;
                    case '2':
                    case 'pairing':
                    case 'p':
                        console.log("🔢 Pairing Code authentication selected");
                        resolve('pairing');
                        break;
                    case '3':
                    case 'auto':
                    case 'a':
                    case '': // Enter key
                        console.log("🔄 Auto-selection based on learning data");
                        resolve('auto');
                        break;
                    default:
                        console.log(`❌ Invalid choice: ${input}. Please enter 1, 2, or 3.`);
                        // Retry
                        setTimeout(() => {
                            this.promptAuthenticationChoice().then(resolve);
                        }, 1000);
                        break;
                }
            });
        });
    }

    /**
     * Execute chosen authentication method
     */
    async executeChosenMethod(choice, config) {
        try {
            let method, result;

            switch (choice) {
                case 'qr':
                    method = 'qr';
                    result = await this.unifiedAuth.handleQRStrategy(config);
                    break;
                case 'pairing':
                    method = 'pairing';
                    result = await this.unifiedAuth.handlePairingStrategy(config);
                    break;
                case 'auto':
                default:
                    const smartMethod = await this.unifiedAuth.getSmartAuthMethod(config);
                    method = smartMethod.method;
                    result = await this.unifiedAuth.authStrategies[method](config);
                    break;
            }

            // Record user choice for learning
            await this.unifiedAuth.recordUserChoice({
                type: 'authentication_method',
                choice: method,
                timestamp: Date.now(),
                userSelected: choice !== 'auto'
            });

            return { method, result };

        } catch (error) {
            console.error('Failed to execute chosen authentication method:', error.message);
            throw error;
        }
    }

    /**
     * Display analytics information
     */
    displayAnalytics() {
        const analytics = this.unifiedAuth.getAnalytics();

        console.log("\n" + "📊 UNIFIED AUTHENTICATION ANALYTICS");
        console.log("═".repeat(50));
        console.log(`Total Attempts: ${analytics.totalAttempts}`);
        console.log(`Success Rate: ${analytics.successRate}`);
        console.log(`Active Sessions: ${analytics.activeSessions}`);
        console.log(`Learning Data Points: ${analytics.learningDataPoints}`);

        if (analytics.methodStats && Object.keys(analytics.methodStats).length > 0) {
            console.log("\nMethod Performance:");
            Object.entries(analytics.methodStats).forEach(([method, stats]) => {
                console.log(`  ${method}: ${stats.successes}/${stats.attempts} successes`);
            });
        }

        console.log("\nPress Enter to continue...");
    }

    /**
     * Format phone number for display
     */
    formatPhoneNumber(phone) {
        if (!phone) return 'Not configured';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 10) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
        } else if (cleaned.length === 12) {
            return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
        }
        return `+${cleaned}`;
    }

    /**
     * Check if file/directory exists
     */
    async checkPathExists(filePath) {
        try {
            await require('fs').promises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Analyze credentials file
     */
    async analyzeCredsFile(credsPath) {
        try {
            const fs = require('fs').promises;
            const credsContent = await fs.readFile(credsPath, 'utf8');
            const credsData = JSON.parse(credsContent);

            return {
                hasKeys: !!(credsData.noiseKey && credsData.signedIdentityKey),
                hasRegistration: credsData.registered === true,
                hasPhoneNumber: !!(credsData.me && credsData.me.id),
                phoneNumber: credsData.me?.id || null,
                pairingCode: credsData.pairingCode || null,
                registrationId: credsData.registrationId || null,
                accountSettings: credsData.accountSettings || {},
                processedHistoryMessages: credsData.processedHistoryMessages || []
            };
        } catch (error) {
            console.error('Failed to analyze creds file:', error.message);
            throw error;
        }
    }
}

module.exports = InteractiveAuthEnhancement;