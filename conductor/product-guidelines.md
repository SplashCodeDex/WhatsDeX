# WhatsDeX Product Guidelines

## 1. Tone and Voice

- **Professional & Trustworthy:** Use clear, concise, and business-oriented language. Avoid jargon where possible, but be precise about technical actions.
- **Clarity:** Ensure all labels, tooltips, and messages are unambiguous.
- **Supportive:** When errors occur, guide the user toward a solution rather than just stating a failure.

## 2. Visual Identity & UI/UX

- **Modern Clean Aesthetic:** Prioritize a clean, minimalist layout with ample white space to reduce cognitive load in complex management tasks.
- **Glassmorphism:** Incorporate subtle glassmorphism effects (transparency, blur, thin borders) for cards and modals to create a sense of depth and modern tech sophistication.
- **Information Hierarchy:** Use consistent typography and spacing to highlight primary actions (e.g., "Initialize Bot") and critical data (e.g., "Bot Status").
- **Dark/Light Mode:** Support harmonious transitions between themes while maintaining contrast and legibility of the glassmorphism elements.

## 3. Interaction & Feedback

- **Constructive Error Handling:** All errors must be actionable. Instead of "Auth Error", use "Authentication failed. Please check your credentials or scan the QR code again."
- **Real-time Updates:** Use WebSockets/Socket.io to provide immediate feedback on bot connectivity and message status without page refreshes.
- **Consistency:** Use standardized UI components (buttons, inputs, tables) across all dashboard pages to ensure a predictable user experience.

## 4. Multi-Tenant UX

- **Context Awareness:** Always clearly indicate which workspace/bot the user is currently managing.
- **Onboarding Flow:** Guide new users through a step-by-step process to initialize their first bot immediately after signup.
