"""
Cross-layer consistency checker.
Detects mismatches between UI, API, DB, and Auth schemas
before the refinement and repair stages run.
"""

from schemas.models import UISchema, APISchema, DBSchema, AuthSchema


def check(
    ui: UISchema,
    api: APISchema,
    db: DBSchema,
    auth: AuthSchema,
) -> list[str]:
    """
    Run all cross-layer consistency checks.
    Returns a list of issue strings (empty = all good).
    """
    issues: list[str] = []

    api_paths  = {ep.path for ep in api.endpoints}
    db_tables  = {t.name for t in db.tables}
    auth_roles = {r.name for r in auth.roles}
    ui_routes  = {p.route for p in ui.pages}

    # ── UI ↔ API ──────────────────────────────────────────────────────────────
    for page in ui.pages:
        for comp in page.components:
            if comp.api_endpoint not in api_paths:
                issues.append(
                    f"UI: component '{comp.id}' on page '{page.route}' references "
                    f"missing API endpoint '{comp.api_endpoint}'"
                )

    # ── API ↔ DB ──────────────────────────────────────────────────────────────
    db_columns: dict[str, set[str]] = {
        t.name: {c.name for c in t.columns} for t in db.tables
    }

    for ep in api.endpoints:
        if ep.db_table not in db_tables:
            issues.append(
                f"API: endpoint '{ep.path}' references missing DB table '{ep.db_table}'"
            )
            continue

        table_cols = db_columns[ep.db_table]

        if ep.request_body:
            for field in ep.request_body.fields:
                if field not in table_cols:
                    issues.append(
                        f"API: endpoint '{ep.path}' request field '{field}' "
                        f"not found in DB table '{ep.db_table}'"
                    )

        for field in ep.response_body.fields:
            if field.startswith("_"):
                continue
            if field not in table_cols:
                issues.append(
                    f"API: endpoint '{ep.path}' response field '{field}' "
                    f"not found in DB table '{ep.db_table}'"
                )

    # ── Auth roles referenced in UI ───────────────────────────────────────────
    for page in ui.pages:
        for role in page.roles:
            if role not in auth_roles:
                issues.append(
                    f"UI: page '{page.route}' references undefined role '{role}'"
                )

    # ── Auth roles referenced in API ──────────────────────────────────────────
    for ep in api.endpoints:
        for role in ep.roles:
            if role not in auth_roles:
                issues.append(
                    f"API: endpoint '{ep.path}' references undefined role '{role}'"
                )

    # ── Auth protected routes ↔ UI routes ─────────────────────────────────────
    for pr in auth.protected_routes:
        pattern = pr.path.rstrip("/*")
        matched = any(r.startswith(pattern) or r == pattern for r in ui_routes)
        if not matched:
            issues.append(
                f"Auth: protected_route '{pr.path}' has no matching UI page"
            )

    # ── DB foreign keys ───────────────────────────────────────────────────────
    for table in db.tables:
        for col in table.columns:
            if col.foreign_key:
                ref_table = col.foreign_key.split(".")[0]
                if ref_table not in db_tables:
                    issues.append(
                        f"DB: column '{table.name}.{col.name}' foreign key "
                        f"references missing table '{ref_table}'"
                    )

    return issues