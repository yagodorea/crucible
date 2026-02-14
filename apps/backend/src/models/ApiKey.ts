export interface ApiKey {
  id: string;
  user_id: string;
  key_hash: string;
  label: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface CreateApiKeyInput {
  user_id: string;
  key_hash: string;
  label?: string;
}
