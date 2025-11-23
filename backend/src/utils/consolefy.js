import chalk from 'chalk';
import moment from 'moment-timezone';

const timestamp = () => moment().tz('Asia/Jakarta').format('HH:mm:ss');

const consolefy = {
    success: (text) => {
        console.log(chalk.green(`[${timestamp()}] SUCCESS: ${text}`));
    },
    info: (text) => {
        console.log(chalk.blue(`[${timestamp()}] INFO: ${text}`));
    },
    error: (text) => {
        console.log(chalk.red(`[${timestamp()}] ERROR: ${text}`));
    },
    warn: (text) => {
        console.log(chalk.yellow(`[${timestamp()}] WARN: ${text}`));
    },
    debug: (text) => {
        if (process.env.DEBUG) {
            console.log(chalk.gray(`[${timestamp()}] DEBUG: ${text}`));
        }
    }
};

export default consolefy;
