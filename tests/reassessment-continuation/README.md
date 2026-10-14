Reassessment continuation contracts imported from the supplied 14 October 2026 package.

Run from the frontend project root:

```powershell
node --test tests/reassessment-continuation/continuation.test.mjs tests/reassessment-continuation/store-checkpoint.test.mjs
php -d extension=pdo_sqlite tests/reassessment-continuation/backend/continuation.php
```

The Node tests create ignored `generated-cases` fixtures required by the backend tests. The backend harness uses the sibling `skin-genious-crm-and-api` project by default; pass its Composer autoloader as the first argument and project root as the second to use another checkout. It runs against in-memory SQLite, without booting the CRM or touching application databases.

Initial request hashes were captured from this checkout immediately before applying continuation, preserving the existing express 40-50 minute window and 45-minute target. The fixture container supports Laravel's existing `abort()` helper.

Deployment: deploy backend code first, run the new migration (`php artisan migrate --force`) and `php artisan optimize:clear` on the intended staging server, then deploy the frontend build. Verify 5-session and 7/8-session courses, reopening checkpoints, two-tab behavior, and PDFs on staging. Source integration does not perform deployment or mutate the application database.
