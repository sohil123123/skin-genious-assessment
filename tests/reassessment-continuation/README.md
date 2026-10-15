Reassessment continuation contracts imported from the supplied 14 October 2026 package.

Run from the frontend project root:

```powershell
node --test tests/reassessment-continuation/continuation.test.mjs tests/reassessment-continuation/store-checkpoint.test.mjs
php -d extension=pdo_sqlite tests/reassessment-continuation/backend/continuation.php
```

The Node tests create ignored `generated-cases` fixtures required by the backend tests. The backend harness uses the sibling `skin-genious-crm-and-api` project by default; pass its Composer autoloader as the first argument and project root as the second to use another checkout. It runs against in-memory SQLite, without booting the CRM or touching application databases.

Initial request hashes were captured from this checkout immediately before applying continuation, preserving the existing express 40-50 minute window and 45-minute target. The fixture container supports Laravel's existing `abort()` helper.

Standalone continuation slots now generate doctor-supervised drafts alongside facial slots. Registered HIFU/MNRF/needling procedures retain their original course numbering and indication; standalone durations are estimates without the facial total-time window or mandatory facial add-ons. Existing screening, inventory and compatibility checks remain. Drafts prescribe no device settings. The preparation screen records the supervising doctor's name and confirmation that screening, consent and settings were reviewed and documented in the clinical record. The authenticated recording user's ID, timestamp and step fingerprint are stored in the existing progress JSON. This is a manual confirmation record; it does not verify the doctor's credentials or constitute an electronic signature. The API prevents starting/completing standalone sessions without a matching confirmation. No additional database migration is required for this extension.

Deployment: deploy backend code first, run the new migration (`php artisan migrate --force`) and `php artisan optimize:clear` on the intended staging server, then deploy the frontend build. Verify 5-session and 7/8-session courses, reopening checkpoints, two-tab behavior, and PDFs on staging. Source integration does not perform deployment or mutate the application database.
