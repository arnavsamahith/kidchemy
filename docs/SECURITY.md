# Kidchemy: security, privacy and child safety

Last reviewed 3 Oct 2026. Covers the app, the database and the public site.
Not legal advice: have a lawyer read the processing agreement and the notice
before the first school signs.

## 1. Who is responsible for what

| | Role under the DPDP Act 2023 | What it means day to day |
|---|---|---|
| The school | **Data Fiduciary** | Decides purposes, owns the data, answers families, reports breaches to the Board |
| Kidchemy | **Data Processor** | Runs the software on the school's written instructions only |
| Supabase | Sub-processor | Hosting and database, bound by its DPA |

Children's data (anyone under 18) needs **verifiable parental consent**
(s.9, Rule 10). Schools have a Fourth-Schedule exemption for tracking and
behavioural monitoring "for the educational activities of such institution"
and for child safety, but the parent portal is outside a strict reading of
that, so Kidchemy asks parents for consent anyway. Most operational duties
(notice, security, breach reporting, retention, children's data) apply from
**13 May 2027**. The pilot should behave as if they already apply.

## 2. Gaps found in the v3 audit, and the fix

| # | Gap | Severity | Fix | Where |
|---|---|---|---|---|
| 1 | Any user could set their own `profiles.role` to `admin` from the browser console | Critical | Trigger `kc_guard_profile` blocks changes to role, school, class, suspended | security.sql §3 |
| 2 | Pilot teacher code `VIDYA-7C` printed on the public sign-in page, so anyone could become a teacher | Critical | Hint removed. Rotate the code (security.sql §9) | Login.jsx, seed.js |
| 3 | Every teacher could read and edit every child in every school | Critical | `kc_staff_can()` scopes staff to their own school | security.sql §2, §8 |
| 4 | Any security-definer function could be called with the anonymous key, and some treated "no user" as "SQL editor" | Critical | `kc_is_api()` tells the two apart; execute revoked from `anon` | security.sql §2, §7 |
| 5 | Parent linked by code alone, no consent, unlimited guessing | High | Code + first name, 5 tries/hour, 4 guardians max, consent ledger | `kc_link_child`, ParentHome.jsx |
| 6 | Any teacher could edit or delete another teacher's note | High | Author stamped by the database; only author or admin can change it | `kc_guard_observation`, policies |
| 7 | Audit rows could be forged under any actor, and deleted | High | Server stamps actor and role; update/delete revoked | `kc_stamp_audit` |
| 8 | Suspended accounts kept full access | High | `kc_role()` returns nothing for a suspended account | security.sql §2 |
| 9 | Archived (left) children still visible to parents | Medium | `kc_owns_student()` checks `archived` | security.sql §2 |
| 10 | No way to access, correct or erase, or to complain | High (legal) | `data_requests` queue, parent buttons, admin queue with due dates | ParentHome.jsx, admin/Privacy.jsx |
| 11 | No retention rule; data kept forever | High (legal) | `kc_apply_retention()`, `kc_erase_student()` | security.sql §7 |
| 12 | No record of staff reading a child's record | Medium (Rule 6) | `kc_log_access()` on open, print, export | StudentDetail, ParentProfile, Roster |
| 13 | Admin protected by password only | High | TOTP two-step sign-in; admin powers need `aal2` once enrolled | Login.jsx, admin/Privacy.jsx |
| 14 | Sessions never expired on shared staff-room laptops | Medium | Idle sign-out: staff 30 min, parents 12 h | auth.jsx |
| 15 | Parent access codes from `Math.random()` | Medium | `crypto.getRandomValues` | roster.js, safety.js |
| 16 | Fixed access codes for the pilot class committed to git | High | Rotate all once (`kc_rotate_access_code`) and reprint | security.sql §9 |
| 17 | No security headers (clickjacking, sniffing, referrer leaks) | Medium | HSTS, CSP, frame-ancestors none, no-referrer, Permissions-Policy | vercel.json, public/_headers |
| 18 | `artefact_url` rendered as a raw link (javascript: URLs) | Medium | `safeHref()` allows http(s) only | StudentDetail, ObservationForm |
| 19 | Roster CSV export open to formula injection in Excel | Low | Cells quoted and defused | Roster.jsx |
| 20 | Teachers could put health, caste, religion, family or contact details into a shared note | High (child safety) | Sensitive-detail warning, confirm before sharing | safety.js, ObservationForm |
| 21 | No route for a safeguarding concern | High (child safety) | POCSO prompt; such notes forced school-only | safety.js, ObservationForm |
| 22 | Login `from` redirect accepted any value | Low | Only in-app paths followed | Login.jsx |
| 23 | App pages indexable by search engines | Low | robots.txt, `X-Robots-Tag`, `no-store` | public/robots.txt, vercel.json |

Every row above was tested against a local Postgres with a mock Supabase
`auth` schema: role escalation, cross-school reads and writes, forged audit,
audit deletion, anonymous erasure, link rate-limiting, consent withdrawal,
admin aal1 vs aal2.

## 3. Launch checklist (do before the first school)

**Database**
- [ ] Run `supabase/schema.sql`, then `supabase/security.sql`. Always in that order.
- [ ] Run section 9 of security.sql once: rotate every access code, replace `VIDYA-7C`.
- [ ] Reprint stickers from /teacher/stickers.
- [ ] Schedule retention nightly (Database → Extensions → enable `pg_cron`):
  `select cron.schedule('kc-retention', '30 20 * * *', 'select public.kc_apply_retention()');`
- [ ] Enable Point-in-Time Recovery or at least daily backups.

**Supabase Auth settings**
- [ ] Confirm email: on.
- [ ] Minimum password length: 8. Leaked password protection: on.
- [ ] MFA (TOTP): enabled.
- [ ] Rate limits: keep defaults or lower.
- [ ] Custom SMTP with your own domain, so mails do not land in spam.
- [ ] Site URL and redirect URLs: only the production domain.

**Accounts**
- [ ] Make the first admin by hand (bottom of schema.sql), then enrol two-step sign-in at /admin/privacy straight away.
- [ ] Teacher codes: always set `uses_left` and `expires_at`.

**Paperwork**
- [ ] Fill `SCHOOL_CONTACT` in `src/data/privacy.js` per school, and the grievance officer at /admin/privacy.
- [ ] Sign a processing agreement with each school (outline in §6).
- [ ] Give the school the notice in English and the language most families read.
- [ ] Brief teachers: school-only for concerns, never health/caste/religion/family in notes, safeguarding goes to a person.

**Later**
- [ ] Self-host Instrument Serif and Satoshi in `public/fonts` and drop the Google Fonts and Fontshare links (removes the last third-party request).
- [ ] Move to the Supabase Mumbai region if the project is elsewhere.
- [ ] Rotate the anon key if the repo was ever public.

## 4. If something goes wrong (breach runbook)

1. **Contain** (first hour). Suspend the account, rotate the Supabase keys,
   rotate access codes, revoke sessions (Auth → Users → sign out).
2. **Tell the school** the same day: what, which children, since when.
3. **Tell families** without delay, in plain language: what happened, what it
   means for them, what we did, who to contact (Rule 7(1)).
4. **Tell the Data Protection Board**: first intimation without delay, a
   detailed report within **72 hours** (Rule 7(2)). The school files; we
   prepare the facts.
5. **Write it up**: timeline, root cause, fix. Keep it with the audit export.

## 5. Child-safety principles built into the product

- Children never have accounts, cannot message, and cannot be contacted.
- No ranking or comparison of children, anywhere.
- Notes describe actions, never fixed traits (the existing language check).
- Health, caste, religion, family and contact details are flagged before sharing.
- Possible abuse or self-harm is routed to the school's safeguarding lead,
  per POCSO 2012, and never shared with families through the app.
- Peer voice is appreciation only, and the author is never shown.
- No career suggestions before Class 9.
- No photos of children are stored by Kidchemy; artefacts are links only.

## 6. Processing agreement with a school (outline)

1. Purposes: the three in `PURPOSES` (privacy.js), nothing else.
2. Kidchemy acts only on the school's written instructions.
3. Security measures: section 2 of this file.
4. Sub-processors: Supabase (hosting). New ones only with notice.
5. Breach: Kidchemy tells the school without delay, helps with Board report.
6. Rights requests: routed to the school's queue; Kidchemy carries them out.
7. Retention and return: erase within 30 days of the school leaving, or
   return an export first if the school asks.
8. Audit: the school may ask for the audit export at any time.
9. Staff: only named Kidchemy people may access production, and only to fix
   an issue the school reported.
