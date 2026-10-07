# Admin CMS repository cleanup

This pass reorganizes the existing working tree without changing authentication, persistence payloads, public business content or adding features. Both repositories already contained substantial uncommitted CMS work; the inventory describes the starting working tree rather than claiming every Git change belongs to this pass. No commit, push or migration apply was performed.

## Inventory and changes

[Source inventory](ADMIN_SOURCE_INVENTORY.md) records the original 41 files, their responsibilities, inbound imports, obsolete status and reuse scope, followed by the final import graph. [Move manifest](ADMIN_SOURCE_MOVES.json) records all 29 moved paths, removed paths and the portrait component merge.

Removed obsolete `CollectionEditors`, `FaqEditor`, `ProofMetricsEditor`, `TestimonialsEditor` and `SolutionClustersEditor` wrapper files. Removed the obsolete `check-cms-phase3.mjs` harness; the maintained migration and route harnesses cover its supported interactions. Merged the single-consumer AvatarField into PortraitEditorDialog as a private portrait panel. Removed the logic-free MediaPanel wrapper; EditorPanel now composes the same media styling directly.

Renamed vague controls to ItemActionRow, MediaField, PortraitEditorDialog, SectionCopyPanel, ProofMetricActionsPanel, SolutionPreviewView and DraftPreviewPanel. Moved application providers into app, section metadata/registry/preview routes into config, and editor implementations into domain/shared directories. Updated application imports, regression fixtures and stylesheet references.

Consolidated item operations in itemOperations, pairing and identity in bilingualItems, and HTML extraction/draft normalization in content. Removed unused displayText, testimonialDraft, ctaDraft and getLocaleLabel exports. HTML extraction retains the Hero-specific decode-first option; rich-text sanitization has a different responsibility and remains in RichTextField.

The registry is the sole editor mapping. Section metadata also owns the admin page/navigation definitions. WhyEditor, ProofMetricsEditor, SolutionClustersEditor, TestimonialsEditor, SolutionGroupsEditor, SolutionModulesEditor, SharedFaqEditor and SharedTrustedEditor are named business editors created by the registry's shared collection factory. They intentionally do not receive individual re-export files. SharedCtaEditor remains a separate implementation. Auth stays in its existing directory; transport services stay in src/services/admin to preserve the established service boundary. Shared primitives remain grouped where this avoids file sprawl. Lazy public preview bindings retain their loading boundary.

## Final admin tree (35 files)

```text
src/admin/
  app/
    AdminApp.jsx
    CmsProvider.jsx
    cmsContext.js
    ConfirmProvider.jsx
  auth/
    AuthContext.jsx
    context.js
    useAuth.js
  config/
    previewRoutes.js
    sectionMetadata.js
    sectionRegistry.js
  editors/
    home/
      HeroEditor.jsx
      ProofMetricActionsPanel.jsx
      SolutionOverviewEditor.jsx
    solutions/
      SolutionsHeroEditor.jsx
      SolutionPreviewView.jsx
    shared-sections/
      CollectionSectionEditor.jsx
      SharedCtaEditor.jsx
    shared/
      DraftPreviewPanel.jsx
      EditorPrimitives.jsx
      ImagePositionField.jsx
      ItemActionRow.jsx
      ListInput.jsx
      MediaField.jsx
      PortraitEditorDialog.jsx
      PublicPreviewViews.jsx
      RichTextField.jsx
      SectionCopyPanel.jsx
      SelectField.jsx
  pages/
    AdminLogin.jsx
    PageEditor.jsx
    PagesList.jsx
  styles/
    admin.css
  utils/
    bilingualItems.js
    content.js
    itemOperations.js
```

## CSS

Kept one scoped stylesheet with organized layout/navigation/editor/component/media sections. The starting stylesheet had already consolidated historical duplicate selectors in the preceding pass. This cleanup removes the unused testimonial-preview rule and preserves responsive/accessibility overrides.

During the move, the source stylesheet was accidentally removed. Its tested rules were recovered from the existing production CSS bundle and formatted into the new stylesheet. The original comments and source shorthand formatting could not be recovered; the behavior was subsequently checked through the production build and browser regressions. No public stylesheet was copied into the admin stylesheet.

## CRM accordion

The old closed sentinel was not a visible item key. Selection fallback therefore reopened the first child immediately, preventing CRM from toggling closed and open normally. Explicit null now means closed, undefined means initial selection, and rendering compares openKey to the stable pair identity. Persisted keys survive reorder; keyless legacy records retain the existing positional fallback without rewriting payloads. The same engine serves Why, Testimonials, Clusters, Groups, Modules and Trusted Logos. Regression checks exercise CRM close/reopen, switching siblings and reordering while open.

## Shared content

CTA, FAQ and Trusted Logos each have one canonical SiteSetting/SiteSettingTranslation source in the migration plan; Footer CTA remains separate. The updated dry run contains four canonical sources, eight source translations and fourteen section-translation references. The migration accepts the existing empty Trusted Logos copy only when its other metadata matches the populated source; conflicting populated copies still require review. Existing dry-run/apply, transaction, conflict and cache boundaries remain intact. The database was not migrated and public content was not rewritten. This supersedes the earlier report's separate Trusted Logos migration proposal.

## Validation

- Frontend lint and production build passed. The existing approximately 626 KB main-chunk warning remains.
- Browser migration regression passed, including the added CRM checks, bilingual structural operations, Radix keyboard/dialog behavior, signed-upload simulation and portrait cancel/apply.
- Backend lint, build and tests passed: 17 suites passed, one skipped; 71 tests passed, one skipped.
- Cloudinary upload verification uses signed-request simulation, not a live Cloudinary upload.

Responsive public/admin route checks passed at 1440, 1024 and 820 pixels: no horizontal overflow, public-view previews, independent VI/EN resizing, save/discard behavior and navigation guards. The updated Solution Clusters screenshot was visually reviewed. Both repositories passed diff whitespace checks. The stylesheet audit found zero repeated exact base selectors and zero global body/html/#root selectors.
