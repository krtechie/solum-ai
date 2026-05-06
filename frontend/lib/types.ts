// ─── Pipeline Event Types (SSE) ───────────────────────────────────────────────

export type StageStatus = "idle" | "running" | "complete" | "error";

export interface StageState {
  id: number;
  name: string;
  status: StageStatus;
  latency_ms?: number;
  preview?: Record<string, unknown>;
  error?: string;
}

export interface PipelineEvent {
  event:
    | "stage_start"
    | "stage_complete"
    | "stage_error"
    | "clarification_needed"
    | "complete"
    | "error"
    | "done";
  stage?: number;
  name?: string;
  latency_ms?: number;
  preview?: Record<string, unknown>;
  error?: string;
  message?: string;
  output?: SolumOutput;
  questions?: string[];
  assumptions?: string[];
}

// ─── Schema Types ─────────────────────────────────────────────────────────────

export interface IntentSchema {
  app_name: string;
  app_type: string;
  description: string;
  features: string[];
  entities: string[];
  roles: string[];
  has_auth: boolean;
  has_payments: boolean;
  has_analytics: boolean;
  has_file_upload: boolean;
  assumptions: string[];
  needs_clarification: boolean;
  clarification_questions: string[];
}

export interface EntityField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
}

export interface DesignEntity {
  name: string;
  fields: EntityField[];
  relations: string[];
}

export interface DesignSchema {
  entities: DesignEntity[];
  pages: { name: string; route: string; roles: string[]; primary_entity: string }[];
  api_groups: string[];
  user_flows: { name: string; steps: string[]; roles: string[] }[];
}

export interface UIComponent {
  id: string;
  type: string;
  title: string;
  api_endpoint: string;
  api_method: string;
  fields: string[];
}

export interface UIPage {
  name: string;
  route: string;
  title: string;
  layout: string;
  roles: string[];
  components: UIComponent[];
}

export interface UISchema {
  pages: UIPage[];
  navigation: { label: string; route: string; icon: string; roles: string[] }[];
  theme: { primary_color: string; font: string };
}

export interface APIEndpoint {
  id: string;
  path: string;
  method: string;
  name: string;
  description: string;
  roles: string[];
  requires_auth: boolean;
  db_table: string;
  request_body?: { fields: Record<string, string> };
  response_body: { fields: Record<string, string> };
  query_params: string[];
}

export interface APISchema {
  base_path: string;
  endpoints: APIEndpoint[];
}

export interface DBColumn {
  name: string;
  type: string;
  primary_key: boolean;
  nullable: boolean;
  unique: boolean;
  default: string | null;
  foreign_key: string | null;
}

export interface DBTable {
  name: string;
  columns: DBColumn[];
  indexes: string[][];
}

export interface DBSchema {
  tables: DBTable[];
  relations: {
    from_table: string;
    from_column: string;
    to_table: string;
    to_column: string;
    type: string;
  }[];
}

export interface AuthRole {
  name: string;
  description: string;
  permissions: { resource: string; actions: string[] }[];
}

export interface AuthSchema {
  strategy: string;
  token_expiry_seconds: number;
  refresh_token: boolean;
  roles: AuthRole[];
  protected_routes: { path: string; required_roles: string[]; redirect_to: string }[];
  public_routes: string[];
}

export interface RuntimeArtifacts {
  prisma_schema: string;
  express_routes: string;
  env_template: string;
  setup_instructions: string[];
}

export interface ValidationIssue {
  layer: string;
  field: string;
  issue: string;
  severity: "error" | "warning";
  repaired: boolean;
}

export interface ValidationReport {
  passed: boolean;
  issues: ValidationIssue[];
  repairs_performed: number;
  retries_used: number;
}

export interface PipelineMetadata {
  total_latency_ms: number;
  stage_latencies: Record<string, number>;
  models_used: Record<string, string>;
  total_retries: number;
  prompt_tokens: number;
  completion_tokens: number;
}

export interface SolumOutput {
  intent: IntentSchema;
  design: DesignSchema;
  ui: UISchema;
  api: APISchema;
  db: DBSchema;
  auth: AuthSchema;
  runtime: RuntimeArtifacts;
  validation: ValidationReport;
  metadata: PipelineMetadata;
}

// ─── Metrics Types ────────────────────────────────────────────────────────────

export interface MetricsData {
  total_runs: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  avg_latency_ms: number;
  avg_retries: number;
  failure_types: { failure_type: string; c: number }[];
  recent_runs: {
    run_id: string;
    prompt: string;
    success: number;
    latency_ms: number;
    retries: number;
    repairs: number;
    app_type: string;
    stages_completed: number;
    created_at: number;
  }[];
}