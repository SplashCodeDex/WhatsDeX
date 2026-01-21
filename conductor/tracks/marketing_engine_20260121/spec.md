# Specification: Marketing & Broadcast Engine (WANotifier Clone)

## Overview
This track implements a high-performance marketing and broadcast engine for WhatsDeX. It allows users to manage contacts, create rich media templates, and launch personalized mass-messaging campaigns. The system is designed for maximum deliverability and account safety, with features scaled according to the user's subscription tier.

## Functional Requirements

### 1. Contact & Audience Management
*   **CSV/Excel Import**: Support for bulk uploading contacts with custom metadata columns.
*   **Variable Extraction**: Automatically identify column headers as usable variables for message personalization.
*   **Audience Segmentation**: Ability to group contacts into reusable lists for targeted campaigns.

### 2. Rich Template Library
*   **Media Support**: Templates supporting text, images, videos, and documents.
*   **Dynamic Personalization**: Support for `{{name}}`, `{{phone}}`, and custom CSV headers with fallback values (e.g., `{{name | 'Customer'}}`).
*   **AI Message Spinning (Enterprise)**: Use Gemini AI to subtly rephrase each message in a campaign to avoid "identical message" detection by WhatsApp (Anti-Ban).

### 3. Campaign Wizard & Scheduling
*   **Guided Creation**: A multi-step flow: Select Audience -> Choose Template -> Configure Distribution -> Review & Schedule.
*   **Scheduling Options**:
    *   **Immediate**: Start processing as soon as confirmed.
    *   **Scheduled**: Set a specific future timestamp for the campaign to launch.
    *   **Drafts**: Save progress and trigger manually from the dashboard.

### 4. Hybrid Distribution & Anti-Ban
*   **Throttling Engine**: Randomized delays between messages (e.g., 10-30 seconds) to simulate human behavior.
*   **Distribution Strategy**:
    *   **Starter/Pro**: Campaigns are assigned to a single dedicated bot.
    *   **Enterprise**: Smart Load-Balancing across a pool of all active bots in the workspace.

### 5. Real-time Monitoring
*   **Live Dashboard**: Track progress (Sent, Delivered, Failed) in real-time via WebSockets.
*   **Error Reporting**: Log specific failure reasons (e.g., "Invalid JID", "Rate Limited") for each contact.

## Non-Functional Requirements
1.  **Queue-Based Execution**: All broadcasts must be handled by BullMQ workers to ensure the main API remains responsive.
2.  **Stateless Scalability**: Throttling and state management must reside in Redis/Firestore (Rule 5).
3.  **Strict Privacy**: Contact data and message history must be isolated within the tenant's subcollections (Rule 3).

## Acceptance Criteria
*   Users can upload a CSV and see custom columns correctly mapped as variables.
*   A campaign can be scheduled for the future and starts automatically at the correct time.
*   Messages are successfully delivered with personalization (e.g., "Hi John").
*   Enterprise users can verify that a single campaign is being sent through multiple bots simultaneously.
*   Real-time progress bars update accurately during a live broadcast.

## Out of Scope
*   Official WhatsApp Business API integration (BSP).
*   Inbound message handling/chatbot responses (covered in "Unified Inbox" track).
