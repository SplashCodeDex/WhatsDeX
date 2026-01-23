# Specification: Frontend Wiring & Robustness Integration

## Overview
This track focuses on connecting the newly refactored backend controllers to the frontend and implementing the "missing depth" identified during the system audit. The goal is to move from a mocked dashboard to a production-ready, data-driven application.

## Functional Requirements
1.  **Standardized API Layer**: Update frontend API services to match the new backend `Controller -> Result<T>` structure.
2.  **Real-Time Analytics**:
    *   Wire `AnalyticsController.getDashboardStats` to the dashboard widgets.
    *   Implement a BullMQ background job to aggregate daily stats (messages sent/received, errors) into a `tenants/{tenantId}/stats_daily` collection.
    *   Implement `AnalyticsController.getMessageAnalytics` to fetch data from this new collection for charts.
3.  **Contacts Management**:
    *   Wire list, create, update, and delete actions from `ContactController`.
    *   Implement a streaming CSV parser in the backend using `busboy` or `multer` to handle large file imports.
    *   Connect the frontend "Import" feature to this backend stream.
4.  **Campaign Lifecycle**:
    *   Wire campaign creation, duplication, and deletion.
    *   Ensure the frontend listens to the `campaignSocketService` for real-time progress updates during active broadcasts.

## Non-Functional Requirements
-   **Scalability**: File imports must use streaming to prevent memory exhaustion on large datasets.
-   **Performance**: Historical dashboard queries must use aggregated collections to avoid expensive Firestore count operations.
-   **Security**: Ensure all integrated routes maintain strict tenant isolation.

## Acceptance Criteria
-   Dashboard displays real, tenant-specific metrics.
-   Users can successfully upload a CSV file and see contacts populated in their list.
-   Campaign progress bars move in real-time as messages are sent.
-   Full type safety between frontend API calls and backend responses.

## Out of Scope
-   Persistent AI memory (identified as a future enhancement).
-   WhatsApp Group broadcasting support.
