import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('api', () => {
  it('returns health status', async () => {
    const response = await request(createApp()).get('/api/health');

    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
  });

  it('returns sample report data', async () => {
    const response = await request(createApp()).get('/api/data?type=Inbound');

    assert.equal(response.status, 200);
    assert.ok(response.body.metrics.total > 0);
    assert.ok(Array.isArray(response.body.data));
  });
});
