import { A, O, pipe, S } from '@mobily/ts-belt';

export type OpenMetricsMetric = {
  readonly type: 'gauge';
  readonly name: string;
  readonly unit?: string;
  readonly help: string;
  readonly values: readonly OpenMetricsValue[];
};

export type OpenMetricsValue = {
  readonly value: number;
  readonly labels: Record<string, string>;
};

export function serializeOpenMetricsMetric(gauge: OpenMetricsMetric): string {
  return pipe(
    [
      `# TYPE ${gauge.name} ${gauge.type}`,
      gauge.unit === undefined
        ? undefined
        : `# UNIT ${gauge.name} ${gauge.unit}`,
      `# HELP ${gauge.name} ${gauge.help}`,
      ...gauge.values.map(
        value =>
          `${gauge.name}${serializeOpenMetricsLabels(value.labels)} ${value.value}`
      )
    ],
    A.filter(value => value !== undefined),
    A.join('\n')
  );
}

function serializeOpenMetricsLabels(labels: Record<string, string>): string {
  return pipe(
    O.Some(Object.entries(labels)),
    O.filter(A.isNotEmpty),
    O.map(
      A.map(([key, value]) => `${key}="${serializeOpenMetricsValue(value)}"`)
    ),
    O.map(A.join(',')),
    O.map(S.prepend('{')),
    O.map(S.append('}')),
    O.getWithDefault('')
  );
}

function serializeOpenMetricsValue(value: string): string {
  return value
    .replaceAll('\n', String.raw`\n`)
    .replaceAll('"', String.raw`\"`)
    .replaceAll('\\', String.raw`\\`);
}
