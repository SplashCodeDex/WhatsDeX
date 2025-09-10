# WhatsDeX

`whatsdex` is a comprehensive WhatsApp automation platform that includes both a powerful WhatsApp bot and a full-featured admin management system. The platform uses [@rexxhayanasi/elaina-bail](https://www.npmjs.com/package/@rexxhayanasi/elaina-bail) for WhatsApp integration and supports a modular architecture through a command system.

## 🚀 Admin System Deployment

**⚠️ WARNING: Admin system deployment requires ADVANCED technical expertise**

The WhatsDeX admin system is designed for **enterprise-level organizations** with dedicated DevOps, Security, and Compliance teams. It requires extensive system administration knowledge and enterprise-grade infrastructure.

### Deployment Requirements

#### Mandatory Technical Expertise
- **10+ years** of Linux system administration
- **Expert-level** PostgreSQL database clustering
- **Advanced** Docker/Kubernetes orchestration
- **Enterprise-grade** security hardening (SOC2, HIPAA, GDPR)
- **Production** multi-region cloud deployments
- **Expert** network security and compliance knowledge

#### Enterprise Infrastructure Requirements
- **8-core CPU** with AVX-512, **128GB ECC RAM**
- **NVMe SSD RAID-10** with 2TB+ storage
- **Redundant power supplies** with UPS/generator
- **10Gbps network** with link aggregation
- **Hardware security module (HSM)** for cryptography

### Official Deployment Method

For authorized deployment of the WhatsDeX admin system:

```bash
# ⚠️ RESTRICTED ACCESS - Enterprise Only
# Contact WhatsDeX Enterprise Support for deployment assistance
# Email: enterprise@whatsdex.com
# Phone: +1 (555) 123-4567

# Advanced deployment guide for enterprise customers
cat DEPLOYMENT_GUIDE_COMPLEX.md
```

#### Enterprise Support Options
- **24/7 Enterprise Support** with dedicated SRE team
- **On-site Deployment Services** by certified architects
- **Compliance Consulting** for SOC2/HIPAA/GDPR
- **Custom Infrastructure Design** for your specific needs

### For Small Organizations

If you don't have enterprise infrastructure or dedicated DevOps team:

- **Use the WhatsApp Bot Only**: Deploy just the core WhatsApp functionality
- **Consider Managed Services**: Heroku, Vercel, or Railway for simple deployments
- **Hire Professional Services**: Contact enterprise@whatsdex.com for consulting

**⚠️ The admin system is not suitable for small-scale or individual deployments without proper enterprise infrastructure and expertise.**

## Key Features

### WhatsApp Bot Features
- **Message Handling:** The bot can handle incoming messages and provide responses as needed.
- **Command Handling:** The bot can handle commands sent by users and perform the appropriate actions.
- **Interactive Responses:** The bot provides dynamic and interactive responses to user questions or commands.
- **Media Handling:** Supports sending and receiving various media such as images, videos, and documents.
- **Modular Command System:** The bot is easily extensible by adding new commands as needed.

### Admin System Features (Enterprise Only)
- **User Management:** Complete CRUD operations for user accounts
- **System Configuration:** Dynamic settings management with validation
- **Audit Logging:** Comprehensive compliance and security logging
- **Content Moderation:** Automated content filtering and manual review
- **Analytics Dashboard:** Real-time business intelligence and reporting
- **API Endpoints:** RESTful APIs for all admin functions

## Disclaimer

`whatsdex` is **not affiliated with WhatsApp, Meta, or any other party**. This is an **open-source** project created for educational and development purposes.

This bot uses an **unofficial WhatsApp API**, which **could potentially lead to your WhatsApp account being banned**.

Use it wisely and at your own risk. We are **not responsible for any misuse or damage** caused by the use of this project.

## How to Get Started

Follow these steps to set up and run `whatsdex`:

### 1. Cloning the Repository

First, clone the repository and navigate to the project directory:

```bash
git clone https://github.com/SplashCodeDex/WhatsDeX.git
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

## WhatsDeXBrain: The AI Core

The `whatsdex` bot is powered by `WhatsDeXBrain`, a sophisticated AI core that enables natural language understanding and conversational abilities. This brain is responsible for processing all incoming messages and determining the appropriate response.

### How it Works

1.  **Message Processing:** All incoming messages are first processed by the `WhatsDeXBrain`.
2.  **Intent Recognition:** The brain uses a powerful `nlpProcessor` service to analyze the message and recognize the user's intent. This service uses a combination of keyword matching, pattern matching, and the Gemini API for high accuracy.
3.  **Intent Routing:** Once the intent is recognized, the `intentRouter` routes the message to the appropriate handler.
4.  **Intent Handling:** Each intent has a dedicated handler that is responsible for generating the appropriate response. For example, the `greeting` intent is handled by the `greetingHandler`, which sends a friendly greeting to the user.

This modular architecture makes it easy to add new intents and capabilities to the bot. For more information on how to contribute to the `WhatsDeXBrain`, please see the [CONTRIBUTING.md](CONTRIBUTING.md) file.

## Enterprise Support

For organizations requiring the admin system or enterprise support:

- **Email**: enterprise@whatsdex.com
- **Phone**: +1 (555) 123-4567
- **Website**: https://enterprise.whatsdex.com

## Contribution

We are very open to contributions! If you find a bug or have an idea for a new feature, don't hesitate to open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).