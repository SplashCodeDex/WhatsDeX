import chalk from 'chalk';
import moment from 'moment-timezone';

const timestamp = () => moment().tz('Asia/Jakarta').format('HH:mm:ss');

const consolefy = {
    success: (text: string) => {
        console.log(chalk.green(`[${timestamp()}] SUCCESS: ${text}`));
    },
    info: (text: string) => {
        console.log(chalk.blue(`[${timestamp()}] INFO: ${text}`));
    },
    error: (text: string) => {
        console.log(chalk.red(`[${timestamp()}] ERROR: ${text}`));
    },
    warn: (text: string) => {
        console.log(chalk.yellow(`[${timestamp()}] WARN: ${text}`));
    },
    debug: (text: string) => {
        if (process.env.DEBUG) {
            console.log(chalk.gray(`[${timestamp()}] DEBUG: ${text}`));
        }
    }
};

export default consolefy;
