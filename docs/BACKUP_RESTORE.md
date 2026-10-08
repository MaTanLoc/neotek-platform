# Backup and restore proposal

**Phase A draft: no backup job or restore drill has been executed/verified. Production remains gated.** This procedure requires an accepted isolated target before any destructive drill step. See [audit](PRODUCTION_READINESS_AUDIT.md) and [deployment proposal](DEPLOYMENT_RUNBOOK.md).

## Proposed policy requiring acceptance

- PostgreSQL: encrypted automated daily backups, suggested7 daily/4 weekly/3 monthly retention, off-server/provider storage with access controls and deletion protection. Choose point-in-time recovery/WAL archiving if required RPO is shorter than24hours.
- Proposed objectives to approve: RPO24hours, RTO4hours. These are planning targets, not achieved guarantees. Record owner, restore privileges, alert channel, backup size/duration and last successful drill.
- Back up schema/data/migration ledger consistently; separately record roles/extensions and securely managed environment/release versions. Never store passwords in command arguments or documentation.
- Monitor backup failure and verify integrity/readability. A dump file existing or a Docker volume persisting is not recovery evidence.
- Redis cache may be rebuilt; sessions require an explicit recovery policy. Choose controlled reauthentication rather than blindly restoring stale session tokens. AOF is durability, not independent backup. Never FLUSHALL against shared/live stores.
- Cloudinary asset lifecycle/recovery policy is separate from database backup. Database references alone cannot restore deleted remote media; verify provider retention/export capabilities and ownership.

## Isolated staging restore drill

1. Explicitly identify an isolated disposable staging database and credentials. Confirm it is not production and not a developer's active CMS; record approved data-loss scope. Use separate Redis/session namespace/store and staging Cloudinary policy.
2. Take a consistent backup using provider tooling or installed PostgreSQL client with credentials securely injected. Record timestamp, app release, migration ledger, object inventory and checksum in secured evidence storage.
3. Verify encrypted backup transfer to off-server storage and ability to retrieve it. Review restore compatibility with PostgreSQL version/extensions/roles.
4. After approval of this specific disposable target, modify/delete designated test data only there; record expected differences. This step is destructive and was not performed in Phase A.
5. Restore into a fresh isolated DB first using provider or pg_restore tooling. Review ownership/role mapping and least privilege before exposing the restored application. Do not improvise an overwrite of live production.
6. Point only isolated staging backend to restored data; rebuild cache under accepted policy. Confirm migration ledger, Home/Solutions VI/EN, canonical shared content and detail pages, publication visibility, real admin save/auth/CSRF, media references and expected test data recovery.
7. Record elapsed restoration plus application recovery, actual RPO/RTO, failures, corrective actions and reviewer acceptance. Without this evidence, the release gate stays closed.

## Production recovery decision

Require incident owner approval, exact target verification, write suspension/maintenance plan, preserved failed-state evidence and an accepted loss window. Prefer recovery to a new database and controlled connection cutover over blind in-place replacement. Confirm forward/backward release compatibility before serving traffic. Revalidate auth/session policy and revoke compromised credentials if relevant.

Retention and restore tooling must be implemented in later accepted operational phases. This document intentionally contains no executable destructive one-liner, live credentials or claim of an existing provider backup configuration.
