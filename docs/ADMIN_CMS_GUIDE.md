# Neotek CMS User Guide

## 1. What this CMS manages

The CMS manages the public Neotek **Home** and **Solutions** pages in Vietnamese and English. Each page is made of sections, such as a hero banner, testimonials, a call to action, or frequently asked questions.

## 2. Starting the local system

```bash
docker compose up -d
```

In separate terminals:

```bash
npm run start:dev
npm run dev
```

Optional database inspection:

```bash
npx prisma studio
```

- Public site: http://localhost:5173
- CMS: http://localhost:5173/admin
- Backend: http://localhost:3000/api
- Prisma Studio: http://localhost:5555

## 3. Logging in

There is no public admin registration. An administrator account is created by the backend bootstrap process. Open `/admin` and use an account provided by the Neotek administrator. Never place passwords or tokens in content.

## 4. Pages

Choose Home or Solutions from the Pages screen. A slug is the internal web name, such as `home` or `solutions`. Status controls whether a page is draft or published.

## 5. Languages

Vietnamese and English content are independent. Select the language tab before editing and save that language separately. Check both languages before publishing.

## 6. Sections

A section is one content block on a webpage. Common examples are Hero, CTA, FAQ, and Testimonials. Section key and type are technical identifiers; normally do not change them.

## 7. Editing content

1. Choose a page.
2. Select Vietnamese or English.
3. Choose a section from Page content.
4. Edit the visual fields.
5. Save the section.
6. Refresh the website preview.
7. Check the public page.

## 8. Typed editors

Visual editors are available for Hero, CTA, FAQ, Proof Metrics, and Testimonials. They group related fields and provide controls for repeated items.

## 9. JSON fallback

Some advanced sections still use an Advanced content editor. Normal operators should not change its structure unless they understand the JSON contract. Invalid JSON cannot be saved.

## 10. Preview

The preview displays saved server content only. Unsaved form changes are not shown until Save succeeds. Use Refresh preview after saving, or open the public page in a new tab.

## 11. Visible / hidden sections

Use **Visible on website** to show or hide a section. Hiding does not delete its content.

## 12. Display order

Use Move up and Move down to change the order of sections or repeated items. Do not use these controls to make structural changes you do not understand.

## 13. SEO

SEO title and SEO description help search engines and link previews describe the page. Keep them clear and appropriate to the selected language.

## 14. ADMIN vs EDITOR

ADMIN users can manage page settings, create sections, and edit content. EDITOR users see only the controls allowed by the current backend permission policy.

## 15. Common problems

- **Cannot log in:** check that the backend and Redis are running, use the correct account, and try again after the session expires.
- **Changes do not appear:** save first, refresh the preview, and check that the backend/cache are running.
- **CMS/API unavailable:** check `http://localhost:3000/api/health`.
- **JSON validation error:** the advanced editor contains invalid JSON or an invalid section structure.

## 16. Database

Prisma Studio is useful for inspection. Prefer the CMS for normal edits and do not manually modify production data through Prisma Studio.

## 17. Safe operating rules

- Do not casually change section keys or types.
- Do not paste secrets into content.
- Check both Vietnamese and English.
- Save before previewing.
- Avoid changing structural data without understanding its effect.
