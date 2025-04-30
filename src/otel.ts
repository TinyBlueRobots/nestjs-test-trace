import {
  type AttributeValue,
  type Context,
  context,
  type Counter,
  type Meter,
  propagation,
  type Span,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import { AsyncLocalStorage } from 'async_hooks';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { resourceFromAttributes } from '@opentelemetry/resources';
import {
  ConsoleMetricExporter,
  MeterProvider,
  MetricReader,
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  ConsoleSpanExporter,
  NodeTracerProvider,
  SimpleSpanProcessor,
  type SpanProcessor,
} from '@opentelemetry/sdk-trace-node';
import * as os from 'os';

let tracer = new BasicTracerProvider().getTracer('noop');

const initTracing = (
  serviceName: string,
  version: string,
  environment: string,
  ...spanProcessors: SpanProcessor[]
) => {
  const resourceAttributes = {
    ['deployment.environment.name']: environment,
    ['service.name']: serviceName,
    ['service.version']: version,
    ['host.name']: os.hostname(),
  };
  const resource = resourceFromAttributes(resourceAttributes);
  const provider = new NodeTracerProvider({
    resource,
    spanProcessors,
  });
  tracer = provider.getTracer(serviceName);
  propagation.setGlobalPropagator(new W3CTraceContextPropagator());
};

const grpcSpanProcessor = () => {
  const exporter = new OTLPTraceExporter();
  return new BatchSpanProcessor(exporter) as SpanProcessor;
};

const consoleSpanProcessor = () => {
  const exporter = new ConsoleSpanExporter();
  return new SimpleSpanProcessor(exporter) as SpanProcessor;
};

const asyncLocalStorage = new AsyncLocalStorage<Context>();

const startSpan = (
  name: string,
  attributes: Record<string, AttributeValue> = {},
) => {
  const ctx = asyncLocalStorage.getStore() || context.active();
  const span = tracer.startSpan(name, { attributes }, ctx);
  asyncLocalStorage.enterWith(trace.setSpan(ctx, span));
  return span;
};

export const currentSpan = () => {
  const ctx = asyncLocalStorage.getStore() || context.active();
  return trace.getSpan(ctx);
};

const runInSpan = <T>(
  name: string,
  attributes: Record<string, AttributeValue> = {},
  fn: (span: Span) => T,
) => {
  const span = startSpan(name, attributes);
  try {
    return fn(span);
  } catch (error) {
    if (error instanceof Error) {
      span.recordException(error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
    }
    throw error;
  } finally {
    span.end();
  }
};

const extract = (carrier: Record<string, string>) =>
  asyncLocalStorage.enterWith(propagation.extract(context.active(), carrier));

const inject = (carrier: Record<string, string> = {}) => {
  const ctx = asyncLocalStorage.getStore() || context.active();
  propagation.inject(ctx, carrier);
  return carrier;
};

const initCounters = (meter: Meter) => {
  const requests = meter.createCounter('requests');
  counters = { requests };
};

let counters: Record<string, Counter>;
(() => initCounters(new MeterProvider().getMeter('noop')))();

const initMetrics = (
  serviceName: string,
  version: string,
  environment: string,
  ...readers: MetricReader[]
) => {
  const resourceAttributes = {
    ['deployment.environment.name']: environment,
    ['service.name']: serviceName,
    ['service.version']: version,
    ['host.name']: os.hostname(),
  };
  const resource = resourceFromAttributes(resourceAttributes);
  const meterProvider = new MeterProvider({
    resource,
    readers,
  });
  const meter = meterProvider.getMeter(serviceName);
  initCounters(meter);
};

const grpcMetricReader = () => {
  const exporter = new OTLPMetricExporter();
  const reader = new PeriodicExportingMetricReader({ exporter });
  return reader as MetricReader;
};

const consoleMetricReader = () => {
  const exporter = new ConsoleMetricExporter();
  const reader = new PeriodicExportingMetricReader({
    exporter,
    exportIntervalMillis: 1000,
  });
  return reader as MetricReader;
};

export function Span(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      return runInSpan(name, {}, () => originalMethod.apply(this, args));
    };
    return descriptor;
  };
}

export {
  consoleMetricReader,
  consoleSpanProcessor,
  counters,
  extract,
  grpcMetricReader,
  grpcSpanProcessor,
  initMetrics,
  initTracing,
  inject,
  startSpan,
  runInSpan,
  SpanStatusCode,
};
