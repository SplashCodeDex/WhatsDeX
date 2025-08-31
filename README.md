# whatsdex

`whatsdex` is a WhatsApp bot that uses [@rexxhayanasi/elaina-bail](https://www.npmjs.com/package/@rexxhayanasi/elaina-bail). This bot is designed to automate various tasks on WhatsApp, and supports a modular architecture through a command system, making it easy to develop and maintain features.

## Disclaimer

`whatsdex` is **not affiliated with WhatsApp, Meta, or any other party**. This is an **open-source** project created for educational and development purposes.

This bot uses an **unofficial WhatsApp API**, which **could potentially lead to your WhatsApp account being banned**.

Use it wisely and at your own risk. We are **not responsible for any misuse or damage** caused by the use of this project.

## Key Features

- **Message Handling:** The bot can handle incoming messages and provide responses as needed.
- **Command Handling:** The bot can handle commands sent by users and perform the appropriate actions.
- **Interactive Responses:** The bot provides dynamic and interactive responses to user questions or commands.
- **Media Handling:** Supports sending and receiving various media such as images, videos, and documents.
- **Modular Command System:** The bot is easily extensible by adding new commands as needed.

## How to Get Started

Follow these steps to set up and run `whatsdex`:

### 1. Cloning the Repository

First, clone the repository and navigate to the project directory:

```bash
git clone https://github.com/itsreimau/whatsdex.git
cd whatsdex
```

### 2. Dependency Installation

Install all required dependencies with the following command:

```bash
npm install
```

### 3. Configuration

Rename the `config.example.js` file to `config.js`, then adjust the configuration such as the bot's name, default messages, bot owner's number, and more.

## Authentication Adapter

`whatsdex` supports storing authentication sessions using a choice of databases: **MySQL**, **MongoDB**, and **Firebase**. Choose and set up your preferred database with the following steps:

### 1. Select Database Adapter

In the `config.js` configuration file, adjust the `authAdapter` section with the database adapter you have chosen.

### 2. Install Database Module

After selecting the desired adapter, run the following command to install the required module:

```bash
npm run install:adapter
```

This command will install the module corresponding to the adapter configuration you have chosen.

### 3. Make sure the Database is Active

Make sure your database server is active and accessible before running the bot. Check the following:

- For **MySQL**, make sure the user credentials and database name are correct.
- For **MongoDB**, make sure the entered URL can connect to the MongoDB server.
- For **Firebase**, make sure the service account credentials downloaded from the Google Firebase Console have been entered correctly.

## Running the Bot

Once the configuration is complete, you can run the bot with the following two options:

### 1. Run Directly

To run the bot directly in the terminal, use the command:

```bash
npm start
```

The bot will run until you close the terminal or stop it manually.

### 2. Run with PM2

If you want to run the bot as a background service that remains active even if the terminal is closed, use PM2:

```bash
npm run start:pm2
```

## WhatsApp Authentication

There are two authentication methods that can be used to connect the bot to your WhatsApp account:

### 1. Using Pairing Code

- After the bot is run, a pairing code will be displayed in the terminal.
- Open the WhatsApp application on your phone, select the **Linked Devices** menu, then tap **Link a Device**.
- Enter the pairing code displayed in the terminal to link your WhatsApp account with the bot.

### 2. Using QR Code

- After the bot is run, a QR code will appear in the terminal.
- Open the WhatsApp application on your phone, select the **Linked Devices** menu, then tap **Link a Device**.
- Scan the QR code that appears in the terminal to link your WhatsApp account with the bot.

After the authentication process is successful, the bot is ready to receive and respond to messages according to the given commands.

## Customization

### Added New Commands

To add new commands, follow these steps:

1. Create a new JavaScript file in the `commands` folder with the desired functionality. For example, create a `test/helloworld.js` file:

   ```javascript
   // commands/test/helloworld.js

   module.exports = { // Sets up and shares the function for the "helloworld" command
       name: "helloworld", // The name of the command that will be used by the user
       aliases: ["hello"], // Alternative names that can be used to call this command
       category: "test", // The category to group this command
       permissions: { // Special settings for this command
           admin: Boolean, // Can only group admins use this command? (true/false)
           botAdmin: Boolean, // Does the bot have to be an admin to run this command? (true/false)
           coin: Number, // The number of coins required to run this command
           group: Boolean, // Can this command only be used in a group? (true/false)
           owner: Boolean, // Can only the bot owner use this command? (true/false)
           premium: Boolean, // Can only premium users use this command? (true/false)
           private: Boolean // Can this command only be used in a private chat? (true/false)
       },
       code: async (ctx) => { // The function that is executed when this command is called
           await ctx.reply("Hello, World!"); // Send the message "Hello, World!" to the user
       }
   };
   ```

2. This command can be triggered by sending `/helloworld` in the chat.

### Complete Documentation

`whatsdex` uses a modified version of `@mengkodingan/ckptw` that has been forked and customized specifically for this bot. This library is built on top of `@rexxhayanasi/elaina-bail` which offers more complete features than `@whiskeysockets/baileys`.

#### Key Differences with the Original Version:

- **Bug fixes** that have not been addressed in the original version
- **Special optimizations** for the needs of `whatsdex`

For complete documentation, please visit:

- [@mengkodingan/ckptw](https://www.npmjs.com/package/@mengkodingan/ckptw) - Basic reference for the command structure
- [itsreimau/gktw](https://github.com/itsreimau/gktw) **(Official Fork for whatsdex)** - Documentation for the custom version used
- [@rexxhayanasi/elaina-bail](https://www.npmjs.com/package/@rexxhayanasi/elaina-bail) - Guide for sending messages/media

## Contribution

We are very open to contributions! If you find a bug or have an idea for a new feature, don't hesitate to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
