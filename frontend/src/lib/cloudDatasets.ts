import { supabase } from './supabase';
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

// ── Read ─────────────────────────────────────────────────────────────────────

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

// ── Write ────────────────────────────────────────────────────────────────────

export async function pushCloudDataset(dataset: {
  id: string;
  name: string;
  calls: CallRecord[];
  source?: string;
}): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('datasets').upsert({
    id: dataset.id,
    name: dataset.name,
    calls: dataset.calls,
    call_count: dataset.calls.length,
    loaded_at: new Date().toISOString(),
    source: dataset.source ?? 'excel',
  });
  if (error) throw new Error(error.message);
}

export async function deleteCloudDataset(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('datasets').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
