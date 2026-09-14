# ULTREON 3.0 UI Implementation Plan

## 1. Setup & Dependencies
- `react-hook-form`, `zod`, and `@hookform/resolvers` installed.

## 2. Directory Structure
```
app/registry/new/
  ├── page.tsx (Layout and Provider wrapper)
  ├── RegistryFormWrapper.tsx (Handles useForm Context and submission)
  ├── components/
  │   ├── Step1CaseContext.tsx
  │   ├── Step2OctAcquisition.tsx
  │   ├── Step3OctFindings.tsx
  │   ├── Step4ClinicalDecision.tsx
  │   ├── Step5ConditionalModules.tsx
  │   ├── Step6PostPci.tsx
  │   └── Step7GlobalValue.tsx
```

## 3. UI Steps
- **Progressive Disclosure**: Use React Hook Form `useWatch` to dynamically show/hide steps and conditional modules based on the selected answers (e.g. `has_calcium_module`).
- **Form Context**: Use `FormProvider` to pass the form state down to the step components, avoiding prop drilling and preventing the main component from re-rendering on every keystroke.
- **Pullbacks Array**: Use `useFieldArray` from React Hook Form for dynamic pullback additions.

## 4. Server Actions
- Create `lib/supabase/ultreon-actions.ts`.
- Implement `createUltreonCase` and `updateUltreonCase` to handle inserts to `ultreon_registry_cases` using the hybrid Relational + JSONB model.

## 5. Migration (Future)
- Once UI is ready and tested against a local database, the `.sql` migration will be executed remotely.
- The old `RegistryFormClient.tsx` will be moved to `app/registry/legacy/` and `app/registry/new/` will house the v3 components.
