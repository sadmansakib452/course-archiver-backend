export interface CacheConfig {
  host: string;
  port: number;
  ttl: number;
}

export interface EnvConfig {
  // ... existing config types
  cache: CacheConfig;
}
