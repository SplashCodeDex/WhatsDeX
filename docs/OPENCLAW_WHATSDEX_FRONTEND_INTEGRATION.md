# OpenClaw → WhatsDeX Frontend Integration Plan

> **Goal**: Expose new OpenClaw features to WhatsDeX frontend through our existing Next.js 16 + FSD architecture
> **Current Stack**: Next.js 16 App Router + Server Actions + Zustand + Feature-Sliced Design

---

## 📋 Integration Strategy Overview

After analyzing the **1,000 PRs** from upstream OpenClaw (2026.2.15 → 2026.2.24), here are the features we need to wire to the WhatsDeX frontend, following our **Hybrid Feature-Sliced Design** pattern.

---

## 🎯 Priority 1: Subagent System (Nested AI Agents)

### Backend Integration
**Location**: `backend/src/services/`
- Create `SubagentService.ts` - Orchestrates nested AI agents
- Create `AgentTemplateService.ts` - Manages agent personality templates
- Extend `WhatsDeXBrain.ts` - Add subagent spawning capability
- Add to `OpenClawGateway.ts` - Bridge to OpenClaw's subagent API

**API Endpoints** (via `backend/src/controllers/`):
```typescript
// backend/src/routes/agents.ts
POST   /api/agents                    // Create new agent
GET    /api/agents                    // List all agents
GET    /api/agents/:agentId           // Get agent details
PATCH  /api/agents/:agentId           // Update agent config
DELETE /api/agents/:agentId           // Delete agent
POST   /api/agents/:agentId/spawn     // Spawn child agent
GET    /api/agents/:agentId/children  // List child agents
POST   /api/agents/:agentId/link      // Link to channel slot
DELETE /api/agents/:agentId/unlink    // Unlink from channel
```

### Frontend Integration
**Location**: `frontend/src/features/agents/`

#### 1. Server Actions (`actions.ts`)
```typescript
// frontend/src/features/agents/actions.ts
'use server'

export async function createAgent(formData: FormData): Promise<Result<Agent>>
export async function updateAgent(agentId: string, data: AgentUpdate): Promise<Result<Agent>>
export async function deleteAgent(agentId: string): Promise<Result<void>>
export async function spawnChildAgent(parentId: string, template: string): Promise<Result<Agent>>
export async function linkAgentToChannel(agentId: string, channelId: string): Promise<Result<void>>
```

#### 2. UI Components (`components/`)
```tsx
// Visual Agent Builder (Drag-and-Drop)
AgentBuilder.tsx              // Main canvas for building agent hierarchy
AgentNode.tsx                 // Individual agent card with personality preview
AgentCreationDialog.tsx       // Modal for creating new agent
AgentConfigPanel.tsx          // Side panel for editing agent properties
AgentTemplateGallery.tsx      // Template picker (Customer Support, Sales, etc.)
AgentHierarchyTree.tsx        // Tree view of parent-child relationships
AgentPerformanceMetrics.tsx   // Real-time agent stats (messages handled, avg response time)
AgentSkillMatrix.tsx          // Visual grid showing which skills are enabled
```

#### 3. Zustand Store (`store.ts`)
```typescript
// frontend/src/features/agents/store.ts
interface AgentStore {
  agents: Agent[]
  selectedAgent: Agent | null
  hierarchyView: 'tree' | 'canvas'
  setAgents: (agents: Agent[]) => void
  selectAgent: (agentId: string) => void
  toggleHierarchyView: () => void
}
```

#### 4. New Routes
```
app/(dashboard)/agents/
  ├── page.tsx              // Agent list page (thin wrapper)
  ├── [agentId]/
  │   ├── page.tsx          // Agent detail page
  │   └── edit/page.tsx     // Agent editor
  └── new/page.tsx          // Create agent wizard
```

---

## 🎯 Priority 2: Enhanced Cron (Scheduled Messaging)

### Backend Integration
**Location**: `backend/src/services/`
- Extend `CronManagerService.ts` - Add webhook notification support
- Create `CronWebhookService.ts` - Handle delivery status callbacks
- Update `JobQueueService.ts` - Add retry logic for failed scheduled messages

**API Endpoints**:
```typescript
POST   /api/schedules                     // Create schedule
GET    /api/schedules                     // List schedules
GET    /api/schedules/:scheduleId         // Get schedule details
PATCH  /api/schedules/:scheduleId         // Update schedule
DELETE /api/schedules/:scheduleId         // Delete schedule
GET    /api/schedules/:scheduleId/history // Delivery history
POST   /api/schedules/:scheduleId/test    // Send test message
```

### Frontend Integration
**Location**: `frontend/src/features/messages/` (extend existing)

#### 1. Server Actions (extend `actions.ts`)
```typescript
export async function createSchedule(data: ScheduleInput): Promise<Result<Schedule>>
export async function updateSchedule(id: string, data: ScheduleUpdate): Promise<Result<Schedule>>
export async function testSchedule(id: string): Promise<Result<TestResult>>
```

#### 2. New Components
```tsx
ScheduleBuilder.tsx           // Visual schedule creator (calendar + time picker)
ScheduleCalendar.tsx          // Full calendar view of all schedules
DeliveryDashboard.tsx         // Real-time delivery tracking
WebhookConfigPanel.tsx        // Configure webhook endpoints
RecurrenceEditor.tsx          // Visual cron expression builder (Daily, Weekly, Custom)
ScheduleTemplateSelector.tsx  // Pre-built schedule templates
```

#### 3. Enhance Existing Routes
```
app/(dashboard)/campaigns/
  ├── schedules/
  │   ├── page.tsx          // Schedule list
  │   ├── new/page.tsx      // Create schedule
  │   └── [id]/page.tsx     // Schedule analytics
```

---

## 🎯 Priority 3: Voice TTS (Text-to-Speech)

### Backend Integration
**Location**: `backend/src/services/`
- Create `TTSService.ts` - Interface to OpenClaw's TTS providers
- Update `WhatsappAdapter.ts` - Support voice message sending
- Create `AudioProcessingService.ts` - Handle audio format conversion

**API Endpoints**:
```typescript
POST   /api/tts/synthesize    // Generate voice from text
GET    /api/tts/voices        // List available voices
POST   /api/tts/preview       // Generate preview audio
```

### Frontend Integration
**Location**: `frontend/src/features/messages/components/`

#### 1. Server Actions
```typescript
export async function synthesizeVoice(text: string, voice: string): Promise<Result<AudioBlob>>
export async function getVoices(): Promise<Result<Voice[]>>
```

#### 2. New Components
```tsx
TTSComposer.tsx               // Text input with voice preview
VoiceSelector.tsx             // Dropdown for voice selection (Male, Female, Languages)
AudioWaveformPreview.tsx      // Visual audio preview before sending
TTSTemplateManager.tsx        // Save frequently used voice messages
```

#### 3. Enhance Campaign Wizard
```tsx
// Add TTS step to existing CampaignWizard.tsx
Step 4: Voice Message (Optional)
  - Toggle: Text vs Voice
  - Voice selector
  - Preview player
```

---

## 🎯 Priority 4: Memory & Context Management

### Backend Integration
**Location**: `backend/src/services/`
- Extend `MemoryService.ts` - Add long-term persistent memory
- Create `ContextManager.ts` - Platform-scoped conversation tracking
- Update `WhatsDeXBrain.ts` - Integrate memory retrieval in AI responses

**API Endpoints**:
```typescript
GET    /api/memory/:userId              // Get user memory facts
POST   /api/memory/:userId              // Store new memory
DELETE /api/memory/:userId/:factId      // Forget specific fact
GET    /api/context/:conversationId     // Get conversation context
```

### Frontend Integration
**Location**: `frontend/src/features/messages/components/`

#### 1. Server Actions
```typescript
export async function getUserMemory(userId: string): Promise<Result<MemoryFact[]>>
export async function storeMemory(userId: string, fact: string): Promise<Result<void>>
```

#### 2. New Components
```tsx
MemoryTimeline.tsx            // Visual timeline of learned facts
ContextPanel.tsx              // Side panel showing current conversation context
MemoryInsights.tsx            // Analytics on user preferences
ForgottenFactsArchive.tsx     // View deleted memories
```

#### 3. Enhance Unified Inbox
```tsx
// Add to existing UnifiedInbox.tsx
<Sidebar>
  <ContextPanel userId={currentChat.userId} />
  <MemoryTimeline userId={currentChat.userId} />
</Sidebar>
```

---

## 🎯 Priority 5: Advanced Analytics & Monitoring

### Backend Integration
**Location**: `backend/src/controllers/`
- Extend `AnalyticsController.ts` - Add real-time metrics
- Create `MonitoringService.ts` - Track bot health, uptime, error rates
- Update `PerformanceMonitor.ts` - Export Prometheus metrics

**API Endpoints**:
```typescript
GET    /api/analytics/overview           // Dashboard summary
GET    /api/analytics/messages           // Message analytics
GET    /api/analytics/campaigns          // Campaign performance
GET    /api/analytics/bots/:botId        // Bot-specific metrics
GET    /api/monitoring/health            // System health
GET    /api/monitoring/errors            // Error logs
```

### Frontend Integration
**Location**: `frontend/src/features/dashboard/components/`

#### 1. Server Actions
```typescript
export async function getAnalyticsSummary(): Promise<Result<AnalyticsSummary>>
export async function getCampaignMetrics(id: string): Promise<Result<CampaignMetrics>>
export async function getBotHealth(botId: string): Promise<Result<HealthStatus>>
```

#### 2. New Components
```tsx
DashboardOverview.tsx         // Main dashboard with key metrics
MessageAnalyticsChart.tsx     // Interactive charts (Recharts/Tremor)
CampaignPerformanceTable.tsx  // Sortable table with delivery rates
BotHealthMonitor.tsx          // Real-time bot status cards
ErrorAlertCenter.tsx          // Error notification center
LiveActivityFeed.tsx          // Real-time event stream
```

#### 3. New Routes
```
app/(dashboard)/
  ├── analytics/
  │   ├── page.tsx          // Analytics overview
  │   ├── messages/page.tsx // Message analytics
  │   └── campaigns/page.tsx// Campaign analytics
  └── monitoring/
      └── page.tsx          // System health dashboard
```

---

## 🎯 Priority 6: FlowBuilder 2.0 (Visual Automation)

### Backend Integration
**Location**: `backend/src/services/`
- Extend `FlowService.ts` - Support new node types from OpenClaw
- Extend `FlowEngine.ts` - Add conditional logic, loops, API calls
- Create `FlowTemplateService.ts` - Pre-built flow templates

**API Endpoints**:
```typescript
POST   /api/flows                      // Create flow
GET    /api/flows                      // List flows
GET    /api/flows/:flowId              // Get flow definition
PATCH  /api/flows/:flowId              // Update flow
DELETE /api/flows/:flowId              // Delete flow
POST   /api/flows/:flowId/execute      // Manual execution
GET    /api/flows/templates            // List templates
```

### Frontend Integration
**Location**: `frontend/src/features/flows/`

#### 1. Server Actions
```typescript
export async function createFlow(data: FlowInput): Promise<Result<Flow>>
export async function updateFlow(id: string, data: FlowUpdate): Promise<Result<Flow>>
export async function executeFlow(id: string, context: any): Promise<Result<FlowExecution>>
```

#### 2. New Components (React Flow)
```tsx
FlowCanvas.tsx                // Main drag-and-drop canvas (React Flow)
FlowNodePalette.tsx           // Left sidebar with available nodes
FlowNodeEditor.tsx            // Right sidebar for node configuration
FlowExecutionTracer.tsx       // Visual execution path highlighter
FlowTemplateGallery.tsx       // Template picker
FlowVersionControl.tsx        // Version history and rollback
```

#### 3. Node Types (extend `CustomNodes.tsx`)
```tsx
MessageNode.tsx               // Send message
DelayNode.tsx                 // Wait X seconds/minutes
ConditionNode.tsx             // If-else logic
LoopNode.tsx                  // Repeat actions
APICallNode.tsx               // HTTP request
DatabaseNode.tsx              // Firestore read/write
AINode.tsx                    // Gemini AI call
WebhookNode.tsx               // Trigger webhook
```

#### 4. New Routes
```
app/(dashboard)/flows/
  ├── page.tsx              // Flow list
  ├── new/page.tsx          // Create flow
  └── [flowId]/
      ├── page.tsx          // Flow editor
      └── executions/page.tsx // Execution history
```

---

## 🎯 Priority 7: Multi-Channel Unified Interface

### Backend Integration
**Location**: `backend/src/services/channels/`
- Already have: `WhatsappAdapter.ts`, `TelegramAdapter.ts`, `DiscordAdapter.ts`
- Create `UnifiedChannelService.ts` - Cross-channel message router
- Extend `OmnichannelController.ts` - Unified API for all channels

**API Endpoints**:
```typescript
GET    /api/channels                   // List all connected channels
GET    /api/channels/:channelId/messages // Get messages
POST   /api/channels/:channelId/send  // Send message (unified)
GET    /api/channels/unified/inbox    // Cross-channel inbox
```

### Frontend Integration
**Location**: `frontend/src/features/messages/components/`

#### 1. Enhance Existing Components
```tsx
// Extend UnifiedInbox.tsx
- Add channel filter tabs (All, WhatsApp, Telegram, Discord)
- Add channel icons to message cards
- Support different message types per channel
```

#### 2. New Components
```tsx
ChannelSwitcher.tsx           // Switch between channels in conversation
CrossChannelSearch.tsx        // Search across all platforms
ChannelStatusBar.tsx          // Show connection status per channel
```

---

## 🔧 Infrastructure Changes Needed

### 1. Backend Routes Structure
```
backend/src/routes/
├── agents.ts          // ✨ NEW - Agent management
├── schedules.ts       // ✨ NEW - Enhanced cron
├── tts.ts             // ✨ NEW - Text-to-speech
├── memory.ts          // ✨ NEW - Context & memory
├── flows.ts           // ✅ EXISTS - Extend
├── analytics.ts       // ✅ EXISTS - Extend
└── monitoring.ts      // ✨ NEW - Health checks
```

### 2. Frontend Feature Folders
```
frontend/src/features/
├── agents/            // ✨ NEW - Complete new feature
├── analytics/         // ✨ NEW - Dashboard analytics
├── monitoring/        // ✨ NEW - System health
├── flows/             // ✅ EXISTS - Add components
├── messages/          // ✅ EXISTS - Extend with TTS, schedules
└── settings/          // ✅ EXISTS - Add webhook config
```

### 3. Shared Types & Schemas
```
backend/src/types/
├── agent.ts           // ✨ NEW
├── schedule.ts        // ✨ NEW
├── memory.ts          // ✨ NEW
├── tts.ts             // ✨ NEW
└── flow.ts            // ✅ EXISTS - Extend

frontend/src/types/
├── agent.ts           // ✨ NEW (mirror backend)
├── schedule.ts        // ✨ NEW
└── ... (same structure)
```

---

## 📦 New Dependencies Required

### Backend
```json
{
  "dependencies": {
    "@openclaw/subagents": "^2.0.0",     // Subagent orchestration
    "@openclaw/tts": "^1.5.0",           // TTS providers
    "@openclaw/memory": "^1.2.0",        // Persistent memory
    "node-cron": "^3.0.3",               // Already have this
    "better-sqlite3": "^9.0.0"           // For local memory cache
  }
}
```

### Frontend
```json
{
  "dependencies": {
    "@xyflow/react": "^12.0.0",          // Flow builder (React Flow)
    "@tremor/react": "^3.14.0",          // Analytics charts
    "react-big-calendar": "^1.11.0",     // Schedule calendar
    "wavesurfer.js": "^7.7.0",           // Audio waveform
    "recharts": "^2.12.0"                // Alternative charts
  }
}
```

---

## 🚀 Implementation Phases

### **Phase 1: Foundation (Week 1-2)**
✅ Update OpenClaw to 2026.2.24
✅ Create backend service scaffolds
✅ Define Zod schemas for all new types
✅ Create API route structure

### **Phase 2: Agents System (Week 3-4)**
- Implement `SubagentService.ts`
- Create `/api/agents` endpoints
- Build `AgentBuilder.tsx` UI
- Implement drag-and-drop hierarchy
- Add agent template gallery

### **Phase 3: Enhanced Scheduling (Week 5-6)**
- Extend `CronManagerService.ts`
- Build `ScheduleBuilder.tsx`
- Create delivery dashboard
- Implement webhook notifications
- Add calendar view

### **Phase 4: Voice TTS (Week 7-8)**
- Implement `TTSService.ts`
- Build voice composer UI
- Add waveform preview
- Integrate into campaign wizard
- Test audio delivery

### **Phase 5: Analytics & Monitoring (Week 9-10)**
- Extend `AnalyticsController.ts`
- Build dashboard overview
- Create real-time charts
- Add error monitoring
- Implement health checks

### **Phase 6: FlowBuilder 2.0 (Week 11-12)**
- Extend `FlowEngine.ts`
- Build React Flow canvas
- Create custom node types
- Add execution tracer
- Implement templates

### **Phase 7: Polish & Testing (Week 13-14)**
- E2E testing for all new features
- Performance optimization
- Security audit
- Documentation
- User acceptance testing

---

## 🎨 UI/UX Guidelines (Per PROJECT_RULES.md)

### 1. **No Emojis in UI**
❌ Bad: `🤖 Create Agent`
✅ Good: `<Bot className="w-4 h-4" /> Create Agent`

### 2. **Pixel Perfect Spacing**
- Use Tailwind tokens: `gap-4`, `p-6`, `space-y-2`
- No arbitrary values: `gap-[15px]`

### 3. **Interactive States**
All buttons/cards must have:
- `hover:bg-gray-50`
- `active:scale-95`
- `focus-visible:ring-2`

### 4. **Server Components First**
```tsx
// ✅ Good: Server Component for data
export default async function AgentsPage() {
  const agents = await getAgents(); // Server Action
  return <AgentList agents={agents} />;
}

// ❌ Bad: Client component with useEffect
'use client'
export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  useEffect(() => { fetch('/api/agents')... }, []);
}
```

### 5. **Atomic Design**
```tsx
// Primitives (components/ui/)
<Button />
<Card />
<Input />

// Composition (features/agents/components/)
<AgentCard>
  <Card>
    <CardHeader>
      <Button />
    </CardHeader>
  </Card>
</AgentCard>
```

---

## 🔐 Security Considerations

### 1. **Zod Validation Everywhere**
```typescript
// Backend
export async function createAgent(req: Request, res: Response) {
  const data = AgentSchema.parse(req.body); // Must parse
  // ...
}

// Frontend Server Action
export async function createAgent(formData: FormData) {
  const data = AgentFormSchema.parse(Object.fromEntries(formData));
  // ...
}
```

### 2. **Multi-Tenant Isolation**
```typescript
// Every API must check tenant ownership
const agent = await firestore
  .collection(`tenants/${tenantId}/agents`)
  .doc(agentId)
  .get();

if (!agent.exists) throw new AppError('NOT_FOUND');
```

### 3. **Rate Limiting**
```typescript
// Apply to all new endpoints
router.post('/api/agents', 
  rateLimiter.middleware('createAgent', { max: 10, window: '1m' }),
  agentController.create
);
```

---

## 📊 Success Metrics

After integration, we should track:
- **Agent Adoption**: % of users creating agents
- **Schedule Usage**: # of scheduled messages vs manual sends
- **Voice Engagement**: Voice message open rates
- **Flow Automation**: % of messages sent via flows
- **Multi-Channel**: % of users connecting >1 channel
- **Performance**: Frontend bundle size impact (<200KB increase)

---

## 🚧 Migration Strategy

### For Existing Users
1. **Backward Compatibility**: Old campaign system still works
2. **Gradual Migration**: Add "Try New Scheduler" banner
3. **Data Migration**: Script to convert old crons to new format
4. **Feature Flags**: Toggle new features per tenant

### Database Schema Changes
```typescript
// New Firestore collections
tenants/{tenantId}/
  ├── agents/{agentId}           // ✨ NEW
  ├── schedules/{scheduleId}     // ✨ NEW
  ├── memories/{userId}          // ✨ NEW
  ├── flows/{flowId}             // ✅ EXISTS - extend schema
  └── analytics/{metricId}       // ✨ NEW
```

---

## 🎯 Next Steps

**What would you like to tackle first?**

1. **Start Phase 1** - Update OpenClaw and create backend scaffolds?
2. **Focus on Agents** - Dive deep into the Subagent system implementation?
3. **Prioritize Analytics** - Build the monitoring dashboard first?
4. **Review Specific PRs** - Deep dive into specific upstream PRs?
5. **Create Jira Tickets** - Break this down into trackable tasks?
6. **Adjust Priorities** - Reorder based on your business needs?

---

**Current Status Summary:**
- ✅ OpenClaw upstream analyzed (1,000 PRs reviewed)
- ✅ Integration plan created (7 priority features)
- ✅ Frontend architecture mapped (FSD pattern)
- ✅ Implementation roadmap defined (14 weeks)
- ⏳ Awaiting your direction to proceed

