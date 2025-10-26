npm run build

> whatsdex@1.4.13-alpha.1 build
> npm run lint && npm test

> whatsdex@1.4.13-alpha.1 lint
> eslint

> whatsdex@1.4.13-alpha.1 test
> cross-env DATABASE_URL="file:./dev.db" jest

RUNS **tests**/services/database.test.js
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

FAIL **tests**/services/database.test.js (54.27 s)on was found.
● Migrations › Models created after migrate

    expect(received).toHaveProperty(path)

    Matcher error: received value must not be null nor undefined

    Received has value: undefined

      86 |       data: { name: 'test' }
      87 |     });
    > 88 |     expect(user).toHaveProperty('id');
         |                  ^
      89 |
      90 |     // Test UserViolation
      91 |     const violation = await testPrisma.userViolation.create({

      at Object.toHaveProperty (__tests__/services/database.test.js:88:18)

● Test suite failed to run

    Invalid: beforeEach() may not be used in a describe block containing no tests.

      12 |   let dbService;
      13 |
    > 14 |   beforeEach(() => {
         |   ^
      15 |     // Mock Prisma Client only for the DatabaseService unit tests
      16 |     const mockPrismaClient = jest.fn(() => mockPrisma);
      17 |     jest.resetModules(); // Reset module registry to ensure new mock is used

      at beforeEach (__tests__/services/database.test.js:14:3)
      at Object.describe (__tests__/services/database.test.js:10:1)

● Test suite failed to run

    Invalid: afterEach() may not be used in a describe block containing no tests.

      40 |   });
      41 |
    > 42 |   afterEach(() => {
         |   ^
      43 |     jest.clearAllMocks();
      44 |     jest.resetModules(); // Reset modules again after the test suite finishes
      45 |   });

      at afterEach (__tests__/services/database.test.js:42:3)
      at Object.describe (__tests__/services/database.test.js:10:1)

info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
debug: Metrics updated {"activeUsers":2,"aiRequests":2,"errorRate":100,"responseTime":250,"timestamp":"2025-10-26 03:14:44:1444","totalCommands":2,"uptime":95.7655582}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
debug: Event tracked {"event":"command_used","properties":{"command":"/help","success":true},"timestamp":"2025-10-26 03:14:44:1444","userId":"user-123"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
debug: Event tracked {"event":"test_event","properties":{},"timestamp":"2025-10-26 03:14:44:1444","userId":"user-123"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
error: Failed to generate BI report {"error":"Unknown report type: unknown_report","filters":{},"reportType":"unknown_report","timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
debug: Cache cleaned {"entriesRemoved":1,"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server started on port 8080 {"timestamp":"2025-10-26 03:14:44:1444"}
info: Metrics collection started {"timestamp":"2025-10-26 03:14:44:1444"}
info: Analytics service initialized successfully {"timestamp":"2025-10-26 03:14:44:1444"}
info: WebSocket server closed {"timestamp":"2025-10-26 03:14:44:1444"}
PASS **tests**/services/analytics.test.js (8.053 s)
AnalyticsService
initialization
√ should initialize successfully (343 ms)
√ should initialize without WebSocket (340 ms)
WebSocket handling
√ should handle subscribe message (309 ms)
√ should handle get_metrics message (303 ms)
√ should handle invalid JSON (291 ms)
metrics collection
√ should update metrics successfully (340 ms)
√ should handle metrics update errors (280 ms)
dashboard data
√ should get dashboard data successfully (481 ms)
√ should use cached data when available (298 ms)
detailed metrics
√ should get metrics for 24h timeframe (311 ms)
√ should handle different timeframes (50 ms)
event tracking
√ should track user events (266 ms)
√ should broadcast events to WebSocket clients (258 ms)
business intelligence reports
√ should generate user engagement report (235 ms)
√ should generate revenue analysis report (136 ms)
√ should handle unknown report types (284 ms)
cache management
√ should clean expired cache entries (119 ms)
health check
√ should return healthy status (138 ms)
√ should return unhealthy status on error (109 ms)
cleanup
√ should close WebSocket server (273 ms)

PASS **tests**/commands/downloader/youtubevideo.test.js (6.05 s)
youtubevideo command
√ should download a video for a valid URL (216 ms)
√ should reply with an error for an invalid URL (232 ms)
√ should reply with an error if no URL is provided (47 ms)
√ should use the specified quality when provided (22 ms)
√ should reply with an error when an invalid quality flag makes the URL invalid (23 ms)

PASS **tests**/commands/search/googlesearch.test.js
googlesearch command
√ should return search results for a valid query (241 ms)
√ should reply with an error for an empty query (18 ms)
√ should handle no results from the API (44 ms)

console.log
AI Tool Call: youtubesearch with args {"query":"cat videos"}

      at Object.log [as code] (commands/ai-chat/chatgpt.js:73:19)

console.error
Tool execution failed for youtubesearch: TypeError: Cannot read properties of undefined (reading 'jid')
at Object.jid [as code] (W:\CodeDeX\WhatsDeX\commands\ai-chat\chatgpt.js:101:43)
at Object.<anonymous> (W:\CodeDeX\WhatsDeX\_\_tests\_\_\commands\ai-chat\chatgpt_new.test.js:84:9)

      110 |             } catch (e) {
      111 |               toolResponse = `Error: ${e.message}`;
    > 112 |               console.error(`Tool execution failed for ${functionName}:`, e);
          |                       ^
      113 |             }
      114 |           }
      115 |           messages.push({

      at Object.error [as code] (commands/ai-chat/chatgpt.js:112:23)
      at Object.<anonymous> (__tests__/commands/ai-chat/chatgpt_new.test.js:84:9)

PASS **tests**/commands/ai-chat/chatgpt_new.test.js
New chatgpt command with Memory and Function Calling
√ should handle a simple chat conversation (36 ms)
√ should trigger summarization when history is long (24 ms)
√ should correctly handle a tool call (251 ms)

PASS **tests**/middleware.botMode.test.js
botMode middleware
√ should allow a non-premium user in a group when bot mode is 'group' (28 ms)
√ should block a non-premium user in a private chat when bot mode is 'group' (9 ms)
√ should allow a premium user in a private chat when bot mode is 'group' (10 ms)
√ should allow an owner in a private chat when bot mode is 'group' (18 ms)
√ should allow a non-premium user in a private chat when bot mode is 'private' (24 ms)
√ should block a non-premium user in a group when bot mode is 'private' (11 ms)
√ should allow an owner in a group when bot mode is 'private' (7 ms)
√ should allow an owner when bot mode is 'self' (14 ms)
√ should block a non-owner when bot mode is 'self' (99 ms)
√ should allow any user when bot mode is not set (53 ms)

PASS **tests**/commands/tool/translate.test.js
translate command
√ should translate text successfully (37 ms)
√ should fetch and display the language list for the "list" subcommand (21 ms)
√ should reply with an error if no text is provided (10 ms)
√ should use "id" as default language if no code is provided (10 ms)

PASS **tests**/commands/profile/claim.test.js
claim command
√ should successfully claim a daily reward (39 ms)
√ should show an error if the claim type is invalid (25 ms)
√ should show an error if the user level is too low (13 ms)
√ should show an error if the claim is on cooldown (14 ms)
√ should prevent owner from claiming (29 ms)
√ should show the list of available claims (12 ms)

PASS **tests**/commands/profile/transfer.test.js
transfer command
√ should successfully transfer coins to a mentioned user (28 ms)
√ should reply with an error for a non-positive amount (24 ms)
√ should reply with an error for a non-numeric amount (11 ms)
√ should reply with an error if the user has insufficient coins (8 ms)
√ should reply with help message if no user or amount is provided (10 ms)

PASS **tests**/middleware/inputValidation.test.js
inputValidation middleware
√ valid YouTube URL for youtubevideo (43 ms)
√ invalid URL for youtubevideo (27 ms)
√ valid prompt for chatgpt (17 ms)
√ invalid prompt too long for chatgpt (19 ms)
√ unknown command allows execution (10 ms)

PASS **tests**/database/chat.test.js
Chat Database
√ should create chat table if it does not exist (27 ms)
√ should get user history (14 ms)
√ should return empty array for new user (11 ms)
√ should add a message to history (8 ms)
√ should create history for new user and add message (20 ms)
√ should clear user history (15 ms)

PASS **tests**/tools.msg.test.js
ucwords
√ should capitalize the first letter of each word (15 ms)
√ should handle single words (7 ms)
√ should handle already capitalized words (8 ms)
√ should handle mixed case words (6 ms)
√ should return null for null input (23 ms)
√ should return null for empty string (6 ms)

PASS **tests**/commands/information/ping.test.js
ping command
√ should reply with Pong! and edit the message with the response time (12 ms)
√ should handle errors gracefully (13 ms)

PASS **tests**/commands/ai-chat/clearchat.test.js
clearchat command
√ should clear chat history and reply with a success message (17 ms)

Test Suites: 1 failed, 13 passed, 14 total
Tests: 1 failed, 76 passed, 77 total
Snapshots: 0 total
Time: 83.441 s
Ran all test suites.
