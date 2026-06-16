import { supabase, supabaseUrl, supabaseKey } from './supabase';
import type { CallRecord } from '../types/calls';

export interface CloudDatasetMeta {
  id: string;
  name: string;
  call_count: number;
  loaded_at: string;
  source: string;
}

export interface CloudDataset extends CloudDatasetMeta {
  calls: CallRecord[];
}

// Headers used for all direct REST API calls (avoids supabase-js ISO-8859-1 header issue)
function restHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// ── Read (uses supabase-js — reads don't trigger the header issue) ────────────

export async function fetchCloudDatasets(): Promise<CloudDatasetMeta[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('datasets')
    .select('id, name, call_count, loaded_at, source')
    .order('loaded_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CloudDatasetMeta[];
}

export async function fetchCloudDataset(id: string): Promise<CloudDataset | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data as CloudDataset;
}

// ── Write (uses raw fetch to avoid browser ISO-8859-1 restriction) ───────────

export async function pushCloudDataset(dataset: {
  id: string;
  name: string;
  calls: CallRecord[];
  source?: string;
}): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;

  const body = JSON.stringify({
    id: dataset.id,
    name: dataset.name,
    calls: dataset.calls,
    call_count: dataset.calls.length,
    loaded_at: new Date().toISOString(),
    source: dataset.source ?? 'excel',
  });

  const res = await fetch(`${supabaseUrl}/rest/v1/datasets`, {
    method: 'POST',
    headers: restHeaders({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg);
  }
}

export async function deleteCloudDataset(id: string): Promise<void> {
  if (!supabaseUrl || !supabaseKey) return;

  const res = await fetch(
    `${supabaseUrl}/rest/v1/datasets?id=eq.${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: restHeaders() },
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg);
  }
}
