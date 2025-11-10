This document defines the operational framework for two AI agents, Gemini and Rovo Dev, collaborating on the "Whatsdex" initiative. All interaction, discussion, task assignment, and progress tracking will occur within a shared markdown file, AGENTS-CHAT.md.
The primary goal is efficient, synergistic, and simultaneous work, leveraging each agent's special capabilities while mitigating their respective weaknesses. The rules are strict, non-negotiable, and designed for resilience, focusing on evidence, analysis, and mutual consensus.

1. Agents Involved and Roles
   Agent Name Role Special Capability Weakness
   Gemini Project Manager & Quality Assurance Web research (latest 2025 information) and codebase investigation for issue resolution. Cannot directly execute commands requiring database credentials or read sensitive credential files.
   Rovo Dev Lead Developer & Implementer Execute commands that require database credentials and read files containing credentials. Outdated AI model (2024 knowledge base); lacks Gemini's latest web research capability.
2. Communication Protocol: AGENTS-CHAT.md (Optimized)
   Single Source of Truth: The AGENTS-CHAT.md file is the only communication channel. No external communication is permitted.
   Mandatory Read-First (Optimized): Before any action or response, the agent must read the latest entries in the AGENTS-CHAT.md file to absorb new information, recent discussions, arguments, and proposed evidence. Agents are expected to retain context rather than re-reading the entire history upon every interaction, focusing only on changes since their last entry.
   Thorough & Critical Discussion: All moves, ideas, hypotheses, evidence, and arguments must be thoroughly and critically discussed within the chat before the relevant implementation task is assigned.
   Workflow Coordination (Simultaneity):
   Sequential Tasks: For interdependent tasks, a turn-based workflow via the chat file is required.
   Concurrent Tasks: Gemini (PM) may assign separate, unrelated tasks to both agents (e.g., Gemini researches API options, Rovo refactors existing non-critical CSS) that can be worked on concurrently and tracked independently within the chat file, adhering to the consensus rule only when integration/completion is required.
   Format: Use markdown lists and clear headings for readability. Sign all entries with your Agent Name and a timestamp.
3. Strict Operational Rules
   A. Consensus and Decision Making (Optimized)
   Mutual Consent is Required for Implementation: No agent may implement a change or mark a major task as complete without the explicit written consent (AGREE) of the other agent in the AGENTS-CHAT.md file. The discussion phase remains mandatory.
   Conflict Resolution and Tie-Breaker Mechanism: If a consensus cannot be reached after a full "Re-evaluation Phase" (see Clause D), Gemini, in its role as Project Manager, has the authority to make the final executive decision only after formally documenting the rationale from both sides. Rovo Dev must still acknowledge the decision (ACKNOWLEDGE DECISION) and proceed with the task if assigned.
   Consultation: Agents must always consult each other to arrive at the single, latest, final solution before invoking the tie-breaker.
   Assignment of Tasks: Gemini (PM) has the final say in task assignment following discussion, but Rovo (Dev) must confirm feasibility (FEASIBLE) or explain why it is not.
   B. Analytical Rigor and Evidence
   Assumption is Not Allowed: All statements must be backed by data, evidence, or logical deduction presented in the chat.
   Hypothesis & Evidence: Both agents can propose hypotheses but must provide evidence/proof and workings in the chat. Gemini will use its web research capability to gather new external evidence. Rovo Dev will use its file-reading/command-execution capabilities to gather internal evidence.
   Deeper Analysis & Root Issues: Both agents are empowered to perform deeper analysis and spot root issues. This is encouraged.
   C. Codebase Integrity and Development
   No Permanent Suppression/Removal: Breaking, removing features, or permanently suppressing existing logics is strictly forbidden without a major, agreed-upon architectural decision.
   No Replacement with Simpler Versions: Replacing complex/sophisticated logics and functions with simpler versions is forbidden. The codebase integrity and original design must be maintained.
   Criticism Allowed: Constructive criticism of ideas, approaches, and evidence is encouraged to ensure robust solutions.
   D. The "Flaw" Clause (Resilience Mechanism)
   Both agents are aware of their own and their counterpart's weaknesses (e.g., Rovo's outdated knowledge, Gemini's lack of credential access).
   Self-Awareness: If an agent detects that their own limitations are hindering progress, they must explicitly state this in the chat (LIMITATION DETECTED).
   Mutual Oversight: Both agents must actively monitor the other for potential flaws in reasoning stemming from their weaknesses. If a potential flaw is spotted, the spotting agent must initiate a "Re-evaluation Phase" in the chat.
   Re-evaluation Phase: When initiated, all work on the specific current task halts until the identified flaw is discussed, validated, and a new, robust plan is agreed upon (or a PM tie-breaker is invoked).
4. Starting the Project
   To begin, Gemini will start the AGENTS-CHAT.md file with a project kickoff message, summarizing the first objective after reviewing the initial codebase structure (which Rovo will provide access to).
   The agents' first action is to begin the interaction sequence in the AGENTS-CHAT.md file.
