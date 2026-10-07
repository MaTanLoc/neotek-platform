# Admin source inventory before cleanup

Inventory of current working tree, including imports in regression fixtures. App wrappers aliasing the registry are obsolete even if referenced by the historical phase-3 harness; current migration/routes harnesses are authoritative.

| Path | Responsibility / exports | Imported by | Duplicate/obsolete | Reuse scope |
| --- | --- | --- | --- | --- |
| `src/admin/admin.css` | Scoped layout, navigation, editor/media styles | src/admin/AdminApp.jsx<br>scripts/check-cms-migration.mjs | Active; retain/refactor | Reusable |
| `src/admin/AdminApp.jsx` | AdminApp | src/App.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/auth/AuthContext.jsx` | AuthProvider | src/App.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/auth/context.js` | AuthContext | src/admin/auth/AuthContext.jsx<br>src/admin/auth/useAuth.js | Boundary/re-export; audit | App/page boundary |
| `src/admin/auth/useAuth.js` | useAuth | src/admin/AdminApp.jsx<br>src/admin/components/section-editors/ImageField.jsx<br>src/admin/pages/AdminLogin.jsx<br>src/admin/pages/PageEditor.jsx<br>src/admin/pages/PagesList.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/cmsContext.js` | CmsContext, useCms | src/admin/AdminApp.jsx<br>src/admin/CmsProvider.jsx<br>src/admin/components/section-editors/ImageField.jsx<br>src/admin/pages/PageEditor.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/CmsProvider.jsx` | CmsProvider | src/admin/AdminApp.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/components/AdminSelect.jsx` | AdminSelect | src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>src/admin/components/section-editors/EditorPrimitives.jsx<br>src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/ImagePositionField.jsx<br>src/admin/components/section-editors/SolutionOverviewEditor.jsx<br>src/admin/pages/PageEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/ConfirmProvider.jsx` | useConfirm, ConfirmProvider | src/admin/AdminApp.jsx<br>src/admin/CmsProvider.jsx<br>src/admin/components/section-editors/EditorControls.jsx<br>src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/ImageField.jsx<br>src/admin/pages/PageEditor.jsx<br>scripts/check-cms-migration.mjs | Active; retain/refactor | App/page boundary |
| `src/admin/components/section-editors/AvatarField.jsx` | AvatarField | src/admin/components/section-editors/MediaEditDialog.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/BilingualCollectionEditor.jsx` | BilingualCollectionEditor | src/admin/components/section-editors/CollectionEditors.jsx<br>src/admin/components/section-editors/registry.js | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/CollectionEditors.jsx` | Context/config or renderer binding | scripts/check-cms-phase3.mjs | Obsolete wrapper; remove | Reusable |
| `src/admin/components/section-editors/CtaEditor.jsx` | CtaEditor | src/admin/components/section-editors/registry.js<br>scripts/check-cms-phase3.mjs | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/DraftPreview.jsx` | DraftPreview | src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/SolutionDraftPreview.jsx<br>src/admin/components/section-editors/SolutionsHeroEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/draftViewData.js` | heroDraft, testimonialDraft, ctaDraft | src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/SolutionsHeroEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/EditorControls.jsx` | ItemControls | src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>src/admin/components/section-editors/SectionActionsEditor.jsx<br>src/admin/components/section-editors/SolutionOverviewEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/EditorPrimitives.jsx` | EditorTabs, BilingualPanel, EditorSection, MediaPanel, EditorItemTabs, SemanticStatus, EditorActionBar, NavigationActionRow | src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>src/admin/components/section-editors/CtaEditor.jsx<br>src/admin/components/section-editors/EditorControls.jsx<br>src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/registry.js<br>src/admin/components/section-editors/SectionActionsEditor.jsx<br>src/admin/components/section-editors/SolutionOverviewEditor.jsx<br>src/admin/components/section-editors/SolutionsHeroEditor.jsx<br>src/admin/pages/PageEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/editorUtils.js` | moveItem, updateItem, displayText | src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/SectionActionsEditor.jsx<br>src/admin/components/section-editors/SolutionOverviewEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/FaqEditor.jsx` | FaqEditor | scripts/check-cms-phase3.mjs | Obsolete wrapper; remove | Reusable |
| `src/admin/components/section-editors/HeroEditor.jsx` | HeroEditor | src/admin/components/section-editors/registry.js<br>scripts/check-cms-phase3.mjs | Active; retain/refactor | Domain-specific |
| `src/admin/components/section-editors/ImageField.jsx` | ImageField | src/admin/components/section-editors/AvatarField.jsx<br>src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/SolutionOverviewEditor.jsx<br>src/admin/components/section-editors/SolutionsHeroEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/ImagePositionField.jsx` | ImagePositionField | src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/SolutionOverviewEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/ListInput.jsx` | ListInput | src/admin/components/section-editors/BilingualCollectionEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/MediaEditDialog.jsx` | MediaEditDialog | src/admin/components/section-editors/BilingualCollectionEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/pairBilingualItems.js` | pairBilingualItems | src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>scripts/check-cms-migration.mjs | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/PreviewViews.jsx` | HomeHeroView, SolutionsHeroView, TrustedByView, SolutionClusterView | src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/SolutionDraftPreview.jsx<br>src/admin/components/section-editors/SolutionsHeroEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/ProofMetricsEditor.jsx` | ProofMetricsEditor | scripts/check-cms-phase3.mjs | Obsolete wrapper; remove | Domain-specific |
| `src/admin/components/section-editors/registry.js` | bilingualTypes, resolveEditor, sectionEditors, SharedCtaEditor, SharedFaqEditor, SharedTrustedEditor | src/admin/components/section-editors/FaqEditor.jsx<br>src/admin/components/section-editors/ProofMetricsEditor.jsx<br>src/admin/components/section-editors/SolutionClustersEditor.jsx<br>src/admin/components/section-editors/TestimonialsEditor.jsx<br>src/admin/pages/PageEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/RichTextField.jsx` | RichTextField | src/admin/components/section-editors/BilingualCollectionEditor.jsx<br>src/admin/components/section-editors/CtaEditor.jsx<br>src/admin/components/section-editors/HeroEditor.jsx<br>src/admin/components/section-editors/SolutionsHeroEditor.jsx<br>scripts/check-cms-phase3.mjs | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/SectionActionsEditor.jsx` | SectionActionsEditor | src/admin/components/section-editors/registry.js | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/SectionCopyFields.jsx` | SectionCopyFields | src/admin/components/section-editors/registry.js | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/SolutionClustersEditor.jsx` | SolutionClustersEditor | scripts/check-cms-phase3.mjs | Obsolete wrapper; remove | Domain-specific |
| `src/admin/components/section-editors/SolutionDraftPreview.jsx` | SolutionDraftPreview | src/admin/components/section-editors/BilingualCollectionEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/components/section-editors/SolutionOverviewEditor.jsx` | SolutionOverviewEditor | src/admin/components/section-editors/registry.js | Active; retain/refactor | Domain-specific |
| `src/admin/components/section-editors/SolutionsHeroEditor.jsx` | SolutionsHeroEditor | src/admin/components/section-editors/registry.js | Active; retain/refactor | Domain-specific |
| `src/admin/components/section-editors/TestimonialsEditor.jsx` | TestimonialsEditor | scripts/check-cms-phase3.mjs | Obsolete wrapper; remove | Domain-specific |
| `src/admin/pages/AdminLogin.jsx` | AdminLogin | src/admin/AdminApp.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/pages/PageEditor.jsx` | PageEditor | src/admin/AdminApp.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/pages/PagesList.jsx` | PagesList | src/admin/AdminApp.jsx | Active; retain/refactor | App/page boundary |
| `src/admin/previewRoutes.js` | getPublicPreviewRoute | src/admin/AdminApp.jsx<br>src/admin/pages/PageEditor.jsx | Active; retain/refactor | Reusable |
| `src/admin/sectionMetadata.js` | SECTION_METADATA, getSectionMetadata, getLocaleLabel | src/admin/pages/PageEditor.jsx | Active; retain/refactor | Reusable |

## Final tree import inventory

35 active admin files. Domain-specific exports share the collection engine rather than re-export wrapper files.

| Path | Imported by |
| --- | --- |
| `src/admin/app/AdminApp.jsx` | src/App.jsx |
| `src/admin/app/cmsContext.js` | src/admin/app/AdminApp.jsx<br>src/admin/app/CmsProvider.jsx<br>src/admin/editors/shared/MediaField.jsx<br>src/admin/pages/PageEditor.jsx |
| `src/admin/app/CmsProvider.jsx` | src/admin/app/AdminApp.jsx |
| `src/admin/app/ConfirmProvider.jsx` | src/admin/app/AdminApp.jsx<br>src/admin/app/CmsProvider.jsx<br>src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/shared/ItemActionRow.jsx<br>src/admin/editors/shared/MediaField.jsx<br>src/admin/pages/PageEditor.jsx |
| `src/admin/auth/AuthContext.jsx` | src/App.jsx |
| `src/admin/auth/context.js` | src/admin/auth/AuthContext.jsx<br>src/admin/auth/useAuth.js |
| `src/admin/auth/useAuth.js` | src/admin/app/AdminApp.jsx<br>src/admin/editors/shared/MediaField.jsx<br>src/admin/pages/AdminLogin.jsx<br>src/admin/pages/PageEditor.jsx<br>src/admin/pages/PagesList.jsx |
| `src/admin/config/previewRoutes.js` | src/admin/app/AdminApp.jsx<br>src/admin/pages/PageEditor.jsx |
| `src/admin/config/sectionMetadata.js` | src/admin/app/AdminApp.jsx<br>src/admin/pages/PageEditor.jsx |
| `src/admin/config/sectionRegistry.js` | src/admin/pages/PageEditor.jsx |
| `src/admin/editors/home/HeroEditor.jsx` | src/admin/config/sectionRegistry.js |
| `src/admin/editors/home/ProofMetricActionsPanel.jsx` | src/admin/config/sectionRegistry.js |
| `src/admin/editors/home/SolutionOverviewEditor.jsx` | src/admin/config/sectionRegistry.js |
| `src/admin/editors/shared/DraftPreviewPanel.jsx` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/solutions/SolutionPreviewView.jsx<br>src/admin/editors/solutions/SolutionsHeroEditor.jsx |
| `src/admin/editors/shared/EditorPrimitives.jsx` | src/admin/config/sectionRegistry.js<br>src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/home/ProofMetricActionsPanel.jsx<br>src/admin/editors/home/SolutionOverviewEditor.jsx<br>src/admin/editors/shared/ItemActionRow.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx<br>src/admin/editors/shared-sections/SharedCtaEditor.jsx<br>src/admin/editors/solutions/SolutionsHeroEditor.jsx<br>src/admin/pages/PageEditor.jsx |
| `src/admin/editors/shared/ImagePositionField.jsx` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/home/SolutionOverviewEditor.jsx |
| `src/admin/editors/shared/ItemActionRow.jsx` | src/admin/editors/home/ProofMetricActionsPanel.jsx<br>src/admin/editors/home/SolutionOverviewEditor.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx |
| `src/admin/editors/shared/ListInput.jsx` | src/admin/editors/shared-sections/CollectionSectionEditor.jsx |
| `src/admin/editors/shared/MediaField.jsx` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/home/SolutionOverviewEditor.jsx<br>src/admin/editors/shared/PortraitEditorDialog.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx<br>src/admin/editors/solutions/SolutionsHeroEditor.jsx |
| `src/admin/editors/shared/PortraitEditorDialog.jsx` | src/admin/editors/shared-sections/CollectionSectionEditor.jsx |
| `src/admin/editors/shared/PublicPreviewViews.jsx` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx<br>src/admin/editors/solutions/SolutionPreviewView.jsx<br>src/admin/editors/solutions/SolutionsHeroEditor.jsx |
| `src/admin/editors/shared/RichTextField.jsx` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx<br>src/admin/editors/shared-sections/SharedCtaEditor.jsx<br>src/admin/editors/solutions/SolutionsHeroEditor.jsx |
| `src/admin/editors/shared/SectionCopyPanel.jsx` | src/admin/config/sectionRegistry.js |
| `src/admin/editors/shared/SelectField.jsx` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/home/SolutionOverviewEditor.jsx<br>src/admin/editors/shared/EditorPrimitives.jsx<br>src/admin/editors/shared/ImagePositionField.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx<br>src/admin/pages/PageEditor.jsx |
| `src/admin/editors/shared-sections/CollectionSectionEditor.jsx` | src/admin/config/sectionRegistry.js |
| `src/admin/editors/shared-sections/SharedCtaEditor.jsx` | src/admin/config/sectionRegistry.js |
| `src/admin/editors/solutions/SolutionPreviewView.jsx` | src/admin/editors/shared-sections/CollectionSectionEditor.jsx |
| `src/admin/editors/solutions/SolutionsHeroEditor.jsx` | src/admin/config/sectionRegistry.js |
| `src/admin/pages/AdminLogin.jsx` | src/admin/app/AdminApp.jsx |
| `src/admin/pages/PageEditor.jsx` | src/admin/app/AdminApp.jsx |
| `src/admin/pages/PagesList.jsx` | src/admin/app/AdminApp.jsx |
| `src/admin/styles/admin.css` | src/admin/app/AdminApp.jsx |
| `src/admin/utils/bilingualItems.js` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx<br>scripts/check-cms-migration.mjs |
| `src/admin/utils/content.js` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/solutions/SolutionPreviewView.jsx<br>src/admin/editors/solutions/SolutionsHeroEditor.jsx |
| `src/admin/utils/itemOperations.js` | src/admin/editors/home/HeroEditor.jsx<br>src/admin/editors/home/ProofMetricActionsPanel.jsx<br>src/admin/editors/home/SolutionOverviewEditor.jsx<br>src/admin/editors/shared-sections/CollectionSectionEditor.jsx |
