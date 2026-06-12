import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildReport } from '../src/services/metricsService.js';

describe('metricsService', () => {
  it('builds metrics for filtered calls', () => {
    const report = buildReport(
      [
        { type: 'Inbound', durationSeconds: 120, abandoned: false, score: 5 },
        { type: 'Outbound', durationSeconds: 180, abandoned: true, score: 3 },
      ],
      'Inbound',
    );

    assert.equal(report.data.length, 1);
    assert.equal(report.metrics.total, 1);
    assert.equal(report.metrics.avgDuration, 120);
  });
});
