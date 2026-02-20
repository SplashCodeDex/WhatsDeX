# WhatsDeX Product Guide

## Initial Concept

WhatsDeX is an enterprise-grade, omnichannel AI bot management and automation platform. Built upon the OpenClaw engine and Baileys Web API, it enables users to deploy and manage AI-powered bots across WhatsApp, Telegram, Discord, and Slack from a single unified dashboard.

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

- **Initialization:** Users can easily link their WhatsApp account via QR code, or connect Telegram, Discord, and Slack bots using API tokens.
- **Omnichannel Hub:** Centralized management for all social messaging platforms in a single, high-fidelity UI with real-time status updates and a live activity stream.
- **Unified Agent Orchestration:** A consolidated "Brain + Phone" architecture where independent AI personas (Agents) are dynamically deployed across "Connectivity Slots" (WhatsApp, Telegram, etc.).
- **Lifecycle Management:** Ability to link/unlink agents to slots, swap personalities, or restart sessions without losing agent configuration.

### 3. Messaging & Automation

- **Omnichannel Unified Inbox:** A single, filtered interface for viewing and managing conversation history across all connected platforms, tracked by channel type and assigned agent.
- **Broadcast/Marketing:** High-performance engine using **BullMQ** for reliable background processing. Supports **Hybrid Distribution** (Single Bot vs Multi-Bot Pooling) and **Intelligent Throttling** with randomized delays to maximize deliverability.- **Rich Templates:** Manage media-heavy templates with dynamic variable injection (`{{name}}`, `{{phone}}`) and **AI Message Spinning** (Enterprise only) to prevent account bans.
- **Auto-Replies:** Set up automated responses based on keywords or triggers.

### 4. Advanced Features (Premium)

- **AI Integration:** Leverage Google Gemini as a platform-agnostic "Mastermind" capable of autonomous reasoning and tool usage across all channels.
- **Skills Platform:** Integrated OpenClaw skills (Web Search, Code Analysis, etc.) gated by subscription tiers.
- **Unified Tool Registry:** A seamless merge of legacy WhatsDeX utility commands and OpenClaw agentic skills, enabling the AI to pick the best tool for the task.
- **Contextual Memory:** Platform-scoped conversation history ensuring that AI interactions remain private and relevant to each specific chat (e.g., WhatsApp vs Telegram).
- **Backups:** automated backups to Google Drive and other cloud storage providers.
- **Contact Management:** Import and organize contacts for targeted campaigns.
- **Analytics:** Detailed tracking of message delivery, response rates, and bot performance.

### 5. Infrastructure & Monetization

- **Payments:** Integrated Stripe subscription management for tier upgrades.
- **Scalability:** Built on a decoupled frontend/backend architecture with Redis caching and efficient worker queues.
- **Security:** Zero-trust data layer with Zod validation and strict Firestore security rules.

## Vision

To build a "Pixel Perfect", scalable, and reliable SaaS platform that democratizes access to powerful omnichannel AI automation tools, adhering to modern engineering standards (Next.js 16, FSD, Strict TypeScript) and providing a seamless user experience from onboarding to advanced automation.
