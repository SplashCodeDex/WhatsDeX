import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { logger } from './utils/logger.js';

const prometheusExporter = new PrometheusExporter({
  port: Number(process.env.OTEL_PROMETHEUS_PORT) || 9464,
  endpoint: '/metrics',
});

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  metricReader: prometheusExporter,
  instrumentations: [
    getNodeAutoInstrumentations({
      // Disable file system instrumentation for performance
      '@opentelemetry/instrumentation-fs': { enabled: false },
      // Configure HTTP instrumentation
      '@opentelemetry/instrumentation-http': {
        enabled: true,
        // Ignore health check endpoints
        ignoreIncomingRequestHook: (req: any) => {
          return ['/health', '/metrics'].includes(req.url);
        },
        // Ignore outgoing requests to localhost
        ignoreOutgoingRequestHook: (req: any) => {
          return /^(localhost|127\.0\.0\.1)/.test(req.host || '');
        }
      },
      // Configure redis instrumentation
      '@opentelemetry/instrumentation-redis': { enabled: true },
    }),
  ],
  serviceName: 'whatsdex-bot',
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => {
      logger.info('OpenTelemetry SDK shut down successfully');
      process.exit(0);
    })
    .catch((error: any) => {
      logger.error('Error shutting down OpenTelemetry SDK', { error: error.message });
      process.exit(1);
    });
});

try {
  sdk.start();
  logger.info('OpenTelemetry instrumentation started', {
    serviceName: 'whatsdex-bot',
    prometheusPort: Number(process.env.OTEL_PROMETHEUS_PORT) || 9464,
  });
} catch (error: any) {
  logger.error('Failed to start OpenTelemetry SDK', { error: error.message });
}