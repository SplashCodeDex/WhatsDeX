import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { logger } from './utils/logger';

const sdk = new NodeSDK({
  traceExporter: new PrometheusExporter({
    port: process.env.OTEL_PROMETHEUS_PORT || 9464,
    endpoint: '/metrics',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable file system instrumentation for performance
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // Configure HTTP instrumentation
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        // Ignore health check endpoints
        ignoreIncomingPaths: ['/health', '/metrics'],
        // Ignore outgoing requests to localhost
        ignoreOutgoingUrls: [/^https?:\/\/(localhost|127\.0\.0\.1)/],
      },
      // Configure database instrumentation
      '@opentelemetry/instrumentation-pg': { enabled: true },
      '@opentelemetry/instrumentation-redis': { enabled: true },
    }),
  ],
  serviceName: 'whatsdex-bot',
  serviceVersion: process.env.npm_package_version || '1.0.0',
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => {
      logger.info('OpenTelemetry SDK shut down successfully');
      process.exit(0);
    })
    .catch(error => {
      logger.error('Error shutting down OpenTelemetry SDK', { error: error.message });
      process.exit(1);
    });
});

sdk.start();
logger.info('OpenTelemetry instrumentation started', {
  serviceName: 'whatsdex-bot',
  prometheusPort: process.env.OTEL_PROMETHEUS_PORT || 9464,
});
