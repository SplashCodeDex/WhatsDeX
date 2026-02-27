# WhatsDeX Product Guide

## Initial Concept

WhatsDeX is an enterprise-grade, omnichannel AI automation platform. Built upon the OpenClaw engine and Baileys Web API, it enables users to manage AI-powered interactions across WhatsApp, Telegram, Discord, and Slack through a unified system of **Channels** and **Agents**.

The platform operates on a multi-tenant architecture where each customer's data, channels, and agents are isolated within their own workspace. It offers a tiered subscription model (Free vs. Premium), unlocking advanced features such as multiple connectivity slots, marketing campaign tools, Google Drive backups, and agentic AI reasoning.

## Target Audience

- **Small to Medium Businesses (SMBs):** Needing automated customer support and engagement tools.
- **Marketing Agencies:** Managing multiple client WhatsApp accounts for campaigns.
- **Individual Power Users:** Developers or entrepreneurs automating personal or business workflows.
- **Enterprises:** Requiring a robust, scalable solution for high-volume messaging and team collaboration.

## Core Features

### 1. User & Workspace Management

- **Self-Service Onboarding:** Fast, "one-click" onboarding via Google OAuth or Email/Password, featuring automated workspace provisioning for immediate platform access.
- **Multi-Tenancy:** Data isolation per customer using a subcollection pattern in Firestore.
- **Dashboard:** Centralized hub for metrics, bot status, and account settings.

### 2. Channel Management

- **Connectivity Slots:** Users can easily link their WhatsApp account via QR code, or connect Telegram, Discord, and Slack channels using API tokens.
- **Webhook Mode:** Support for connectivity-only use cases where incoming messages are forwarded to external webhooks without AI intervention (standard for Free Tier).
- **Unified Agent Orchestration:** A consolidated "Brain + Phone" architecture where independent AI personas (Agents) are dynamically bound to one or more Channels.
- **Dynamic Binding:** Ability to hot-swap Agents across Channels instantly without disconnecting the underlying platform session.

### 3. Messaging & Automation

- **Omnichannel Unified Inbox:** A single, filtered interface for viewing and managing conversation history across all connected platforms, tracked by channel type and assigned agent.
- **Broadcast/Marketing:** High-performance engine using **BullMQ** for reliable background processing. Supports **Hybrid Distribution** (Single Bot vs Multi-Bot Pooling) and **Intelligent Throttling** with randomized delays to maximize deliverability.
- **Visual Automation (FlowBuilder 2.0):** No-code visual editor for designing complex, multi-step conversation logic and platform actions with drag-and-drop nodes.
- **Rich Templates:** Manage media-heavy templates with dynamic variable injection (`{{name}}`, `{{phone}}`) and **AI Message Spinning** (Enterprise only) to prevent account bans.
- **Auto-Replies:** Set up automated responses based on keywords or triggers.

### 4. Advanced Features (Premium)

- **AI Integration:** Leverage Google Gemini as a platform-agnostic "Mastermind" capable of autonomous reasoning and tool usage across all channels.
- **Skills Platform:** Integrated OpenClaw skills (Web Search, Code Analysis, etc.) gated by subscription tiers.
- **Unified Tool Registry:** A seamless merge of legacy WhatsDeX utility commands and OpenClaw agentic skills, enabling the AI to pick the best tool for the task.
- **Contextual Memory:** Platform-scoped conversation history ensuring that AI interactions remain private and relevant to each specific chat (e.g., WhatsApp vs Telegram).
- **AI Persistent Learning:** Agents autonomously learn and recall user-specific facts and preferences across sessions, enabling a personalized "Mastermind" experience.
- **Backups:** Automated system backups to Google Drive, ensuring user data and configuration safety.
- **Contact Management:** Import and organize contacts across all channels for targeted campaigns.
- **Analytics:** Detailed tracking of message delivery, response rates, and channel performance.

### 5. Infrastructure & Monetization

- **Payments:** Integrated Stripe subscription management for tier upgrades.
- **Scalability:** Built on a decoupled frontend/backend architecture with Redis caching and efficient worker queues.
- **Security:** Zero-trust data layer with Zod validation and strict Firestore security rules.

## Vision

To build a "Pixel Perfect", scalable, and reliable SaaS platform that democratizes access to powerful omnichannel AI automation tools, adhering to modern engineering standards (Next.js 16, FSD, Strict TypeScript) and providing a seamless user experience from onboarding to advanced automation.
