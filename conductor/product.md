# WhatsDeX Product Guide

## Initial Concept

WhatsDeX is an enterprise-grade, fully functional software product built upon the Baileys Web API to provide a comprehensive WhatsApp bot management and automation platform. The system is designed to enable users (customers) to sign up, manage a personal workspace, and deploy WhatsApp bots that automate messaging, customer support, and marketing campaigns.

The platform operates on a multi-tenant architecture where each customer's data and bots are isolated within their own workspace. It offers a tiered subscription model (Free vs. Premium), unlocking advanced features such as multiple bots, marketing campaign tools, Google Drive backups, and AI-powered interactions.

## Target Audience

- **Small to Medium Businesses (SMBs):** Needing automated customer support and engagement tools.
- **Marketing Agencies:** Managing multiple client WhatsApp accounts for campaigns.
- **Individual Power Users:** Developers or entrepreneurs automating personal or business workflows.
- **Enterprises:** Requiring a robust, scalable solution for high-volume messaging and team collaboration.

## Core Features

### 1. User & Workspace Management

- **Self-Service Onboarding:** Users can visit the site, sign up, and access a personalized dashboard.
- **Multi-Tenancy:** Data isolation per customer using a subcollection pattern in Firestore.
- **Dashboard:** Centralized hub for metrics, bot status, and account settings.

### 2. Bot Management

- **Initialization:** Users can easily link their WhatsApp account by scanning a QR code or entering a pairing code.
- **Multiple Bots:** Premium users can manage up to two (or more) bots per workspace.
- **Lifecycle Management:** Ability to add, restart, or delete bots as needed.

### 3. Messaging & Automation

- **Unified Inbox:** View and reply to messages directly from the dashboard.
- **Broadcast/Marketing:** High-performance engine using **BullMQ** for reliable background processing. Supports **Hybrid Distribution** (Single Bot vs Multi-Bot Pooling) and **Intelligent Throttling** with randomized delays to maximize deliverability.
- **Rich Templates:** Manage media-heavy templates with dynamic variable injection (`{{name}}`, `{{phone}}`) and **AI Message Spinning** (Enterprise only) to prevent account bans.
- **Auto-Replies:** Set up automated responses based on keywords or triggers.

### 4. Advanced Features (Premium)

- **AI Integration:** Leverage Google Gemini for intelligent conversations and content generation.
- **Backups:** automated backups to Google Drive and other cloud storage providers.
- **Contact Management:** Import and organize contacts for targeted campaigns.
- **Analytics:** Detailed tracking of message delivery, response rates, and bot performance.

### 5. Infrastructure & Monetization

- **Payments:** Integrated Stripe subscription management for tier upgrades.
- **Scalability:** Built on a decoupled frontend/backend architecture with Redis caching and efficient worker queues.
- **Security:** Zero-trust data layer with Zod validation and strict Firestore security rules.

## Vision

To build a "Pixel Perfect", scalable, and reliable SaaS platform that democratizes access to powerful WhatsApp automation tools, adhering to modern engineering standards (Next.js 16, FSD, Strict TypeScript) and providing a seamless user experience from onboarding to advanced automation.
