"""
Pydantic v2 schemas for all pipeline stages.
These are the strict contracts — any LLM output that doesn't conform is rejected.
"""

from __future__ import annotations
from typing import Any, Literal, Optional
from pydantic import BaseModel, Field


# ─── STAGE 1: INTENT ──────────────────────────────────────────────────────────

class IntentSchema(BaseModel):
    app_name: str
    app_type: Literal["crm", "ecommerce", "saas", "blog", "social", "marketplace", "dashboard", "other"]
    description: str
    features: list[str]
    entities: list[str]
    roles: list[str]
    has_auth: bool
    has_payments: bool
    has_analytics: bool
    has_file_upload: bool
    assumptions: list[str]
    needs_clarification: bool
    clarification_questions: list[str]


# ─── STAGE 2: DESIGN ──────────────────────────────────────────────────────────

class EntityField(BaseModel):
    name: str
    type: Literal["uuid", "string", "text", "integer", "float", "boolean", "datetime", "json"]
    required: bool
    unique: bool


class DesignEntity(BaseModel):
    name: str
    fields: list[EntityField]
    relations: list[str]


class DesignPage(BaseModel):
    name: str
    route: str
    roles: list[str]
    primary_entity: str = ""


class UserFlow(BaseModel):
    name: str
    steps: list[str]
    roles: list[str]


class DesignSchema(BaseModel):
    entities: list[DesignEntity]
    pages: list[DesignPage]
    api_groups: list[str]
    user_flows: list[UserFlow]


# ─── STAGE 3a: UI SCHEMA ──────────────────────────────────────────────────────

class UIComponent(BaseModel):
    id: str
    type: Literal["table", "form", "card", "chart", "stat", "modal", "list", "kanban"]
    title: str
    api_endpoint: str
    api_method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    fields: list[str]
    props: dict[str, Any] = Field(default_factory=dict)


class UIPage(BaseModel):
    name: str
    route: str
    title: str
    layout: Literal["sidebar", "topnav", "blank", "split"]
    roles: list[str]
    components: list[UIComponent]


class NavItem(BaseModel):
    label: str
    route: str
    icon: str
    roles: list[str]


class UITheme(BaseModel):
    primary_color: str
    font: Literal["Inter", "Roboto", "System"]


class UISchema(BaseModel):
    pages: list[UIPage]
    navigation: list[NavItem]
    theme: UITheme


# ─── STAGE 3b: API SCHEMA ─────────────────────────────────────────────────────

class APIRequestBody(BaseModel):
    fields: dict[str, str]


class APIResponseBody(BaseModel):
    fields: dict[str, str]


class APIEndpoint(BaseModel):
    id: str
    path: str
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    name: str
    description: str
    roles: list[str]
    requires_auth: bool
    db_table: str
    request_body: Optional[APIRequestBody] = None
    response_body: APIResponseBody
    query_params: list[str] = Field(default_factory=list)


class APISchema(BaseModel):
    base_path: str
    endpoints: list[APIEndpoint]


# ─── STAGE 3c: DB SCHEMA ──────────────────────────────────────────────────────

class DBColumn(BaseModel):
    name: str
    type: Literal["uuid", "varchar", "text", "integer", "bigint", "float", "boolean", "timestamp", "json"]
    primary_key: bool = False
    nullable: bool = True
    unique: bool = False
    default: Optional[str] = None
    foreign_key: Optional[str] = None


class DBTable(BaseModel):
    name: str
    columns: list[DBColumn]
    indexes: list[list[str]] = Field(default_factory=list)


class DBRelation(BaseModel):
    from_table: str
    from_column: str
    to_table: str
    to_column: str
    type: Literal["one_to_one", "one_to_many", "many_to_many"]


class DBSchema(BaseModel):
    tables: list[DBTable]
    relations: list[DBRelation]


# ─── STAGE 3d: AUTH SCHEMA ────────────────────────────────────────────────────

class Permission(BaseModel):
    resource: str
    actions: list[str]


class AuthRole(BaseModel):
    name: str
    description: str
    permissions: list[Permission]


class ProtectedRoute(BaseModel):
    path: str
    required_roles: list[str]
    redirect_to: str


class AuthSchema(BaseModel):
    strategy: Literal["jwt", "session", "oauth"]
    token_expiry_seconds: int
    refresh_token: bool
    roles: list[AuthRole]
    protected_routes: list[ProtectedRoute]
    public_routes: list[str]


# ─── RUNTIME ARTIFACTS ────────────────────────────────────────────────────────

class RuntimeArtifacts(BaseModel):
    prisma_schema: str
    express_routes: str
    env_template: str
    setup_instructions: list[str]


# ─── VALIDATION REPORT ────────────────────────────────────────────────────────

class ValidationIssue(BaseModel):
    layer: str
    field: str
    issue: str
    severity: Literal["error", "warning"]
    repaired: bool


class ValidationReport(BaseModel):
    passed: bool
    issues: list[ValidationIssue]
    repairs_performed: int
    retries_used: int


# ─── FINAL OUTPUT ─────────────────────────────────────────────────────────────

class PipelineMetadata(BaseModel):
    total_latency_ms: int
    stage_latencies: dict[str, int]
    models_used: dict[str, str]
    total_retries: int
    prompt_tokens: int
    completion_tokens: int


class SolumOutput(BaseModel):
    intent: IntentSchema
    design: DesignSchema
    ui: UISchema
    api: APISchema
    db: DBSchema
    auth: AuthSchema
    runtime: RuntimeArtifacts
    validation: ValidationReport
    metadata: PipelineMetadata