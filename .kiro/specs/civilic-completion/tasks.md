# Civilic Completion — Tasks

- [x] 0. Audit + research + Texsa real-file analysis (docs/, generated-schema.json, table-map.ts)
- [x] 1.1 Steering files (product/ux/tech)
- [x] 1.2 Spec files (requirements/design/tasks)
- [ ] 1.3 Prisma → PostgreSQL provider; add Texsa-compat models; add source fields; extend Message; add CorrespondenceRecipient _(R1,R9)_
- [ ] 1.4 Remove `ignoreBuildErrors`; exclude examples; add scripts; `.env.example`; postinstall _(R11)_
- [ ] 1.5 `src/lib/auth/permissions.ts` — matrix + roles + `requireProjectPermission` _(R2)_
- [ ] 2.1 NextAuth credentials + Prisma adapter; session helper; login/logout; replace hardcoded user _(R3)_
- [ ] 2.2 Real خاتم seed (3 parties, role users, sample payment certs/messages/letters/docs/measurements/adjustment) _(R12)_
- [ ] 3.1 Dashboard «کارتابل من» redesign (action cards, role CTA) _(R10)_
- [ ] 4.1 `src/lib/workflows/payment-certificate.ts` — 13-state machine _(R4)_
- [ ] 4.2 Payment workflow API using lib + audit + notification + system message + versions _(R4)_
- [ ] 4.3 Payment UI: stepper, items table, sticky financial summary, role-based primary action _(R4,R10)_
- [ ] 5.1 Project channels (default + auto payment channel); chat API; read receipts/mentions/system messages _(R6)_
- [ ] 5.2 Chat UI (channel list + thread + composer) _(R6,R10)_
- [ ] 6.1 Correspondence (multi-recipient letters) + documents versioning UI/API _(R7)_
- [ ] 7.1 Measurements/minutes/work-instructions UI/API (Persian labels) _(R8)_
- [ ] 8.1 `src/lib/workflows/adjustment.ts` + adjustment API/UI linked to payment cert _(R5)_
- [ ] 9.1 Texsa import: parse-svzt + analyze-schema + preserve-raw + import-local _(R9)_
- [ ] 9.2 Texsa normalize/* modules _(R9)_
- [ ] 10.1 Texsa export: build-newdataset + serialize-xml + roundtrip-report _(R9)_
- [ ] 11.1 Nav cleanup (advanced settings for raw texsa), RTL polish, rebrand Civilic _(R10)_
- [ ] 11.2 Final: build/typecheck/lint/prisma generate green; worklog; push PR _(R11)_

> ترتیب اجرا تدریجی است؛ پس از هر گروه، build سبز نگه داشته می‌شود و worklog به‌روزرسانی.
