# Repliery billing decision artifact

Status: current implementation contract as of 21 August 2026. This is a final-state snapshot, not a research diary. Replace a superseded decision instead of retaining history or alternatives.

## Scope

Build the complete Stripe-backed billing and Repliery Service Credit foundation. The implementation includes manual credit purchases, automatic credit purchases, exact credit accounting, Business spending limits, payment methods, refunds, disputes, fraud holds, deletion, retention, tax and document seams, exports, permissions, webhooks, and a professional Billing experience.

The implementation does not include Twilio, OpenRouter, a general notification-delivery system, final legal prose, Stripe Connect, downstream agency-to-Business collection, provider reconciliation UI, or enterprise postpaid credit lines. Those systems have explicit boundaries below so they do not require billing redesign later.

## Canonical language

- **Repliery Service Credit** is the contractual product. After it is defined once, the UI may use **credit** and **credit balance**.
- **Billing** is the Organization-level product area.
- **Credit purchase** is a payment that grants purchased credit.
- **Automatic credit purchase** is the optional rule that purchases credit when the available balance is low. Do not use `top-up`, `recharge`, `reload`, or `replenishment` in product or code names.
- **Minimum balance**, **target balance**, and **monthly limit** are the three user controls for automatic credit purchases.
- **Soft spending limit** warns without blocking. **Hard spending limit** blocks a new Business operation.
- **Available credit** is posted credit minus reserved and frozen credit. **Reserved credit** covers initiated but unsettled operations. **Frozen credit** cannot be spent or refunded while a fraud, dispute, or legal hold is unresolved.
- **Platform billing** means Repliery charging an Organization. **Downstream billing** means a future agency charging a Business. Keep these namespaces and money flows separate.
- Use Stripe object names only for actual Stripe objects: Customer, Checkout Session, PaymentIntent, SetupIntent, Invoice, Refund, Credit Note, Dispute, and Customer Portal.
- Use one lifecycle verb for one operation: `delete` an object, `cancel` a PaymentIntent or recurring term, `void` an Invoice or Credit Note, `refund` a payment, `detach` a PaymentMethod, `expire` promotional credit, `revoke` access, `freeze` and `release` credit, and `redact` personal data. Do not use `remove` as a synonym.
- An Organization is the tenant and payer. A Business belongs to an Organization. “Agency” and “freelancer” are customer descriptions, not alternate tenant types.

## Product and legal contract

- Repliery Service Credit is denominated only in USD, issued and accepted only by Repliery, non-transferable, non-withdrawable, non-interest-bearing, and usable only for Repliery-supplied business services.
- It is not cash, funds, a deposit, a bank balance, a payment method, or a wallet. A refund returns eligible unused purchased credit to its source payment; it is not a cash-out feature.
- A Business spending limit is an internal allocation from its Organization. A Business never owns or receives a separate transferable balance.
- The product is B2B-only. An Organization must provide its legal business name, legal billing address, country of establishment, business-purpose attestation, applicable tax IDs, and the accepted Terms and Refund Policy version.
- The product is deliberately an issuer-only multi-purpose voucher under Irish and EU VAT rules. The future service, tax code, place of supply, rate, and jurisdiction are not fixed when credit is purchased. Credit purchase therefore creates no VAT; tax arises when the underlying Repliery service is supplied.
- The issuer-only design is not electronic money because nobody other than Repliery accepts the credit. Re-evaluate the regulatory classification before making credit transferable, withdrawable, provider-accepted, or convertible to a Connect payout.
- Purchased credit never expires and has no inactivity fee. Promotional credit may expire only under its disclosed promotion terms. Dormancy never turns purchased credit into revenue automatically.
- Unused purchased credit is refundable under the deterministic policy below. Promotional credit is not refundable.
- “Worldwide” means every B2B jurisdiction and person that Repliery, Stripe, sanctions rules, export controls, and Repliery’s configured tax registrations lawfully support. Eligibility is a data-driven jurisdiction policy, not a hard-coded US-only launch and not an unsafe promise to transact everywhere.
- A country, customer, or service with unknown tax, sanctions, or registration status is blocked before a billable service is initiated. The system never guesses a zero rate.

## Commercial model

- Organizations buy credit from Repliery. Stripe processes the payment; Stripe fees are Repliery expenses and never reduce the credit granted or appear as a hidden surcharge.
- A successful $100 credit purchase grants exactly $100 of purchased credit. Because this is a multi-purpose voucher purchase, the purchase itself has zero tax.
- Future Repliery-authored recurring Business access is paid from credit through a local recurring service term, not a Stripe Subscription. The first product implementation should use monthly anniversary terms, plan changes effective at the next term, no automatic proration, and no negative credit balance.
- If a recurring access debit fails, automatic credit purchase runs first. A bounded 72-hour grace period may keep Repliery-authored access available, but operations that create third-party cost remain blocked without sufficient available credit. This rule is implemented with the future access gate, not guessed into the current product.
- Future third-party usage is charged at exact provider cost. A versioned percentage markup may later transform that cost globally or for explicit scopes. Do not invent model tiers, channel tiers, token bundles, task units, or retail rate cards.
- Raw cost pass-through is a pricing formula, not a provider disbursement. Repliery remains principal for its integrated service, records gross service revenue, and records provider cost separately even when the markup is zero.

## Authority and account model

- Stripe is authoritative for external payment, Invoice, Refund, Credit Note, Dispute, and PaymentMethod state.
- Convex is authoritative for Repliery credit, lots, allocations, reservations, Business limits, recurring service charges, tax-document state, and the immutable financial ledger.
- Clerk is authoritative for Organization membership, roles, and permission claims. Convex still authorizes every billing query and mutation.
- A local BillingAccount is the payer abstraction. Initially there is exactly one active BillingAccount and one Stripe Customer per Organization.
- A BillingAccount is not embedded into an Organization document. It can later represent a different payer without rewriting the ledger.
- Every Stripe reference stores the Stripe account scope and `livemode` alongside the object ID. Platform Stripe objects and future connected-account objects can therefore never collide.
- Financial records never depend on a Clerk user, Organization, or Business continuing to exist.

## PaymentMethod and authorization continuity

- A Stripe PaymentMethod is attached to the BillingAccount's Stripe Customer, never to a Repliery user. The BillingAccount owns the product configuration; the human who configured it is the authorization actor and evidence source, not the continuing owner of that configuration.
- Saving a PaymentMethod requires the actor to attest that they are authorized to bind the Organization and are the cardholder or have the cardholder's permission. The UI should recommend a company-authorized PaymentMethod and must not imply that Organization membership alone proves authority over a personal card.
- Store the consent version and text hash, actor, Organization, Stripe Customer and PaymentMethod, permitted use, amount formula, timing/frequency, limits, cancellation method, and acceptance time. Retain only Stripe IDs plus necessary display metadata such as brand, last four digits, and expiration; never store PAN or CVC.
- Losing `org:billing:manage`, leaving the Organization, or deleting the Repliery user immediately removes the person's ability to view or change billing. It does not detach the PaymentMethod, refund completed purchases, or revoke an already-active Organization automatic-credit-purchase agreement.
- The continuing agreement belongs to the Organization and remains within its recorded minimum, target, and monthly limit until an authorized Organization manager or the payment instrument's payer withdraws it. The original actor's departure alone is not evidence that a company PaymentMethod became unauthorized.
- A payer can withdraw consent for future automatic payments even after losing Repliery access. An authenticated billing manager uses Billing; a former member or separate cardholder uses the published support email/site shown in Checkout, documents, and policy pages, identifying the Stripe-hosted Receipt or Invoice and only non-sensitive PaymentMethod metadata such as brand and last four digits. A maintainer verifies the request against the existing Stripe billing contact/evidence and invokes one narrow internal revocation command; never request PAN or CVC. A bank-level recurring-payment block or Stripe authorization-revocation decline enters the same state. The future support system will route this existing command rather than redefine revocation.
- Do not build a staff dashboard or add `STAFF:`/`TODO(staff):` for this edge. Implement the narrow revocation command, its authorization boundary, evidence reference, audit effect, and Stripe synchronization now. A maintainer can invoke it through trusted backend tooling; direct Stripe Dashboard detachment is an emergency escape hatch whose webhook enters the same local state. A future authenticated Operator Console or support system calls the existing command and is covered by `TODO(support):` routing.
- Verified revocation immediately makes that PaymentMethod ineligible, cancels its scheduled retries, voids a safe unpaid Invoice when no other consented method can complete it, and detaches the PaymentMethod after active payment state permits it. Revoking the Primary enters `action_required`; revoking only the Backup leaves the Primary agreement active. Revocation does not reverse an already-irrevocable payment automatically.
- A BillingAccount names one **Primary PaymentMethod** and may name one **Backup PaymentMethod**. Those are the only PaymentMethods eligible for automatic credit purchase; Stripe Customer defaults and other attached PaymentMethods are ignored. Do not build an arbitrary fallback chain.
- Primary and Backup PaymentMethods are assigned and consented separately. Different billing managers or cardholders may add them, but each actor must independently attest authority and cardholder permission for the same automatic-purchase rule. The UI states that Repliery may charge the Backup PaymentMethod only when the Primary PaymentMethod cannot complete that same purchase and never grants or invoices the purchase twice.
- Losing access or leaving does not detach a PaymentMethod that the actor previously authorized for the Organization. A verified payer may revoke their own PaymentMethod's future use. Revoking the Backup leaves the Primary agreement active; revoking the Primary never silently promotes the Backup and enters `action_required` until a billing manager explicitly assigns and consents to a new Primary.
- Replacing a PaymentMethod, changing its Primary or Backup assignment, selecting a different Customer default, or materially changing the amount rule enters `action_required` until a billing manager accepts the applicable new consent record.
- A same-brand network account update may continue under the existing agreement. If `payment_method.automatically_updated` changes the card brand, stop merchant-initiated payments and require a new cardholder agreement before resuming, as Stripe's current card-network guidance requires.
- Clerk `organizationMembership.updated`, `organizationMembership.deleted`, `user.updated`, `user.deleted`, and `organization.deleted` lifecycle changes must invalidate or close affected pending actor-authorized billing changes. `user.updated` matters only when a user becomes banned, locked, or otherwise ineligible; ordinary profile changes have no financial effect. This extends the repository's existing deletion lifecycle rather than creating a second authorization system.
- Clerk webhooks accelerate revocation but are eventually consistent and are not the synchronous authorization boundary. Every billing request verifies the current Active Organization, exact Organization ID, custom permission, eligible user state, and absence of an impersonation `act` claim. A pending Checkout or Setup completion also verifies fresh Clerk membership and role state before applying a financial effect. A disagreement or global role/permission drift without a trustworthy occurrence time fails closed into `support_required`; it never guesses whether to grant credit.
- Invitations, Verified Domain enrollment, and default-member creation grant no billing access because the Clerk Member role has neither custom billing permission. Promotion grants only future access; demotion, membership deletion, user ban/lock/deletion, and session revocation terminate future actor authority. Organization name or slug changes do not change the BillingAccount or historical legal snapshot.
- Route and mutation authorization bind the requested Organization ID to the token's Active Organization. This is required because Clerk keeps Active Organization state per tab while the browser session cookie is shared; a stale or mismatched tab must return 404 rather than acting on whichever Organization happens to be in the cookie.
- Pending Checkout and Setup flows use a local authorization generation and the minimum Stripe Checkout lifetime of 30 minutes. Permission loss expires open Stripe flows. Fulfillment compares Stripe completion time with Clerk's authoritative revocation occurrence time: a payment completed first remains valid; a payment completed after authority was revoked grants no credit and enters automatic Refund processing. If exact ordering cannot be established, hold the effect as `support_required` rather than risking duplicate credit or an improper Refund.
- Automatic purchases already initiated by the Organization's active standing agreement are not actor-pending flows and do not stop merely because the original actor leaves. They stop only under the agreement's normal disable, limit, PaymentMethod, revocation, fraud, or Organization-closure rules.
- At least one active member must have `org:billing:manage` before automatic credit purchase can be enabled. Assign both billing permissions to the Organization admin role. If external role changes temporarily leave no billing manager, keep the existing capped agreement intact, record `billing_administration_orphaned`, prevent configuration changes, and require an Organization administrator or verified support recovery to restore management.
- Changing administrators does not require new consent while the same legal Organization and PaymentMethod agreement continue. A change of legal contracting entity or tax identity creates a new BillingAccount and Stripe Customer and requires new billing details and consent; renaming the same entity does not rewrite historical documents.
- Authorization and consent evidence survives user deletion through the existing pseudonymous financial-retention policy. Ordinary UI may show that a PaymentMethod was configured by a former member, while immutable audit evidence retains the minimum proof required for payment disputes and legal claims.

## Exact money and pricing

- Stripe payments, refunds, and purchase documents use integer USD cents.
- Internal credit, provider cost, customer charge, tax reserve, and ledger amounts use signed integer nano-USD: `1 USD = 1,000,000,000 nanoUSD`. Convex stores these as `v.int64`/`bigint`. Binary floating point is forbidden.
- A purchased cent converts exactly to `10,000,000 nanoUSD`. This supports sub-cent provider usage without drift and still permits balances above $9 billion.
- Parse provider decimal strings once in the provider adapter. Never convert through JavaScript `number`.
- A percentage markup is stored as an integer basis-point policy plus a version. Calculation uses integer arithmetic and deterministic round-half-even. Every posted charge snapshots exact provider cost, markup version, markup amount, customer charge, tax-exclusive amount, tax, gross amount, currency, FX evidence, and provider reconciliation reference.
- Customer-facing balance and purchase values display cents. A sub-cent usage line may display up to nine trimmed decimal places. CSV exports preserve the exact integer and normalized decimal. One shared money module owns parsing, rounding, formatting, symbols, and negative presentation.
- Tax documents aggregate compatible micro-usage before cent rounding. A sub-cent purchased balance refund rounds up to the next cent in the customer’s favor, capped by the remaining refundable amount on the source payments, and records the rounding difference as Repliery expense.

## Ledger, lots, and race-free effects

- The financial ledger is immutable and append-only. Corrections use compensating entries; no posted entry is edited or deleted.
- Every balance-changing Convex mutation writes the ledger entry, lot allocations, relevant aggregate, and balance snapshot atomically.
- Every financial effect has a unique local effect key. Stripe idempotency keys protect API attempts; local effect keys protect the ledger forever.
- Credit lots have `fundingKind: purchased | promotional` and a separate `sourceKind` such as purchase, promotion, correction, or migration. A correction must explicitly select its economic funding kind; “manual adjustment” is not a vague third refundability class.
- A purchased lot retains its original amount, source payment, refundable remainder, and immutable grant entry. Promotional lots retain their terms and optional expiration.
- Debit allocation order is: earliest-expiring promotional credit, non-expiring promotional credit, then purchased credit oldest first. This is promotional FEFO followed by purchased FIFO. Every debit records exact lot allocations.
- “Credit loss” is not a product term. The underlying problem is losing proof of how much purchased value remains refundable after purchased and promotional credit are mixed. Lot allocations remove that ambiguity.
- External billable work uses `reserve -> settle | release`. The reservation includes a conservative service and tax maximum. The hard Business limit and Organization available credit are checked in the same atomic mutation that creates the reservation.
- A known provider success settles the actual amount and releases the remainder. A known failure releases the reservation. An ambiguous outcome stays reserved for reconciliation and is never blindly retried.
- Duplicate or out-of-order webhooks, action retries, browser refreshes, and reconciliation runs cannot create duplicate credit, duplicate refunds, or duplicate service charges.

## Business spending limits and recurring access

- Business Settings contains a monthly soft spending limit and monthly hard spending limit. These limits are provider-neutral and belong in the initial billing implementation even before a billable provider exists.
- Billing periods and automatic-purchase monthly limits use UTC. The UI shows the exact reset date and `UTC`; it does not invent an Organization timezone only for billing.
- Soft-limit crossing records one durable domain event per period and does not block.
- Hard-limit evaluation uses posted usage plus active reservations. Crossing the hard limit blocks a new operation before any external side effect.
- Usage by Business means credit consumed by each Business in the selected period. Organization-level charges use an explicit Organization row. Deleted Businesses remain attributable through stable IDs and a “Deleted business” display label.
- The future recurring Business access scheduler calls the same intent-based charge interface as any other Repliery service. It cannot write the ledger, consume lots, or manipulate access state directly.

## Manual credit purchase

- Use hosted Stripe Checkout with `mode=payment`, one existing Stripe Customer, USD, a server-derived amount, a local purchase ID in `client_reference_id` and metadata, required billing address, tax-ID collection, and required Terms acceptance.
- Use one stable Repliery Service Credit Product and a dynamic one-time Price amount. Use Stripe tax code `txcd_10502000` for an electronically purchased multi-purpose voucher and explicit exclusive tax behavior. Stripe Tax should calculate zero at purchase under the chosen MPV design.
- Use an explicit Stripe Payment Method Configuration limited initially to cards and Link. Apple Pay and Google Pay can appear through eligible card wallets. Do not let Dashboard defaults silently enable asynchronous payment methods.
- Enable Checkout post-purchase Invoice creation. A successful purchase produces a Stripe Receipt and credit-purchase Invoice. The Invoice describes the MPV purchase and is not a tax invoice for an underlying service.
- Create the local pending purchase before the Checkout Session. Grant credit only from verified Stripe state through the webhook processor. The success URL shows pending or completed local state and never fulfills the purchase.
- Manual purchase presets are $50, $100, $250, $500, and $1,000, with a custom amount from $25 to $10,000 per Checkout Session. The limits are server configuration and risk controls, not Stripe technical limits. The UI has no dead “contact sales” action.

## Automatic credit purchase

- Automatic credit purchase is part of the initial implementation. It is not a second phase.
- The user contract is: “When available credit falls below the minimum balance, automatically purchase enough credit to restore it to the target balance, subject to the monthly limit.” This threshold-and-target model is clearer and safer than a fixed purchase that can underfund or overshoot.
- User controls are only enabled, Primary PaymentMethod, optional Backup PaymentMethod, minimum balance, target balance, and monthly limit. Internal retry, cooldown, idempotency, and circuit-breaker settings are not exposed as confusing product controls.
- Validate `target balance > minimum balance`, require at least a $25 possible purchase, cap one automatic purchase at $10,000, and cap a user-configured monthly limit at $100,000. These are server-configurable risk ceilings.
- If the user enables the feature while below the minimum balance, show the exact immediate purchase preview and require confirmation.
- Enabling or materially changing the amount rule or a PaymentMethod assignment stores fresh affirmative consent: wording/hash, Terms version, actor, billing permission, Stripe Customer, PaymentMethod, Primary or Backup role, minimum, target, monthly limit, USD, and timestamp. Generic Terms acceptance is not consent for unscheduled off-session payments.
- Save the PaymentMethod for `off_session` use through Checkout or a dedicated hosted SetupIntent flow. A BillingAccount can have only one active automatic-purchase attempt.
- A committed ledger operation evaluates available credit, including reservations and frozen amounts. One atomic mutation creates an attempt only when the balance crosses below the minimum and no attempt is active.
- Purchase principal is `target balance - available credit`, clamped by the remaining monthly limit and server risk ceiling. If the remaining limit cannot fund the minimum $25 purchase, enter `limit_reached`; do not create a tiny charge.
- Use a one-off Stripe Invoice with `collection_method=charge_automatically` for the purchase. Create its item, finalize it, and pay it explicitly under code control. Grant credit only after `invoice.payment_succeeded` and verification of the linked successful PaymentIntent, expected Customer, amount, currency, and local purchase ID. `invoice.paid` alone cannot grant credit because Stripe also emits it when an Invoice is marked paid out of band.
- Do not use Stripe’s default eight-attempt/two-week Smart Retry policy for this unscheduled purchase. Allow at most three executed payment attempts across all PaymentMethods within 24 hours and only while the balance remains below the minimum. Without a Backup, all eligible retries use the Primary. Never create a second Invoice for a retry.
- With a Backup PaymentMethod, attempt the Primary once and, only after Stripe has definitively failed it in an eligible alternative-method category, pay the same Invoice with the Backup. Any remaining soft-decline retry budget stays on the Backup; never alternate between methods. Never attempt the Backup while the PaymentIntent is successful, processing, ambiguous, or awaiting an unknown API result.
- Centralize decline classification in the Stripe adapter. A PaymentMethod-specific issuer decline or unavailable method may permit the Backup. A Stripe/Radar fraud or policy block, `highest_risk_level`, merchant-authorization revocation, sanctions/account restriction, duplicate-risk signal, or unknown classification stops the whole purchase. Never scatter decline-code decisions through domain code.
- Missing or detached PaymentMethods, exhausted eligible attempts, fraud review, or `requires_action` enters `action_required`. The Billing page links to the Hosted Invoice Page or hosted Setup flow for recovery. The user must explicitly resume after resolving the PaymentMethod or consented amount rule.
- If credit is restored, the feature is disabled, or Organization closure begins before an unpaid retry, void the open Invoice. A scheduled reconciliation job catches missed triggers and verifies every active attempt.
- The monthly limit counts successfully purchased principal, not failed attempts or tax. The UI shows the UTC period and exact remaining allowance.

## Tax, accounting, and financial documents

- A credit purchase increases cash and an unearned-service contract liability. It is not service revenue.
- A service redemption decreases the contract liability and recognizes Repliery service revenue and applicable tax. Provider cost is a separate expense/payable.
- Promotional credit is a discount before tax. Purchased credit then pays the discounted service amount plus applicable tax.
- A future service debit snapshots the exact underlying service tax code and explicit exclusive tax behavior. Do not reuse the MPV tax code for the service.
- Do not call Stripe Tax once per SMS, token, or other micro-operation. Group compatible usage by BillingAccount, customer tax evidence, service tax code, jurisdiction, tax rule version, and document period. Maintain a conservative tax reservation during usage; create a finalized Stripe Tax Calculation and Transaction for the aggregate; then settle the reserve exactly.
- If customer location, tax ID validity, registration, rate, or service classification changes, close the current tax group and start a new snapshot. A tax calculation or registration failure blocks further affected usage instead of charging a guessed rate.
- Maintain a jurisdiction-registration registry. Stripe Tax calculates only where Repliery is configured to collect; its threshold monitor is advisory and does not decide wholesale status, marketplace status, or legal registration duties.
- The balance pays both service subtotal and tax. A $100 taxable service at 23% consumes $123 of credit.
- **Receipt** proves a Stripe payment succeeded. **Credit-purchase Invoice** documents an MPV purchase. **Tax Invoice** documents supplied services. **Credit Note** reduces a Tax Invoice. **Refund** returns money against a payment. **Billing statement** summarizes ledger activity. **Export** is machine-readable activity.
- Generate canonical structured Tax Invoices and Credit Notes from the internal service and tax ledger. Do not treat a Stripe PDF as the only legal record. Support sequential numbers, supplier/customer snapshots, supply dates, service lines, tax-exclusive amounts, rates, tax, totals, reverse-charge wording, and required currency conversions.
- Default to one summary Tax Invoice per Organization per calendar month where the governing jurisdiction permits it. The document model can split periods or issue immediate documents when a jurisdiction requires that.
- For Irish VAT documents denominated in USD, retain and show the required EUR equivalents using the applicable Central Bank selling rate or another consistently approved method.
- Store structured invoice data suitable for future EN 16931 output. Do not build the 2028/2029 Irish e-invoice transport before it is required.
- Repliery owns its Terms, Refund Policy, and Privacy Policy. Stripe Checkout and the Customer Portal link to them but do not author them. Production purchasing remains disabled until valid configured URLs and versioned consent text exist.

## Consent and legal UX

- Do not create checkbox theatre. Privacy is a required notice and link, not consent for processing necessary to perform the B2B contract. Tax IDs, billing addresses, USD/foreign-exchange disclosure, MPV treatment, no-expiry rules, and Refund Policy summaries are fields or notices, not separate legal checkboxes.
- Before the first billing-changing action, capture the Organization's legal details and B2B/business-purpose attestation. The current Terms and Refund Policy are accepted through the first applicable Stripe Checkout consent or the in-app automatic-purchase review and are recorded on the Organization; capture acceptance again only after a material contract change. The actor must have `org:billing:manage`, must not be impersonated, and must strictly reverify with Clerk.
- A manual credit-purchase Checkout Session uses Stripe-hosted `consent_collection.terms_of_service=required` only when the Organization has not accepted the current material Terms version. Every Session still shows the configured Privacy Policy, Refund Policy, and support contact. Record Stripe's returned consent evidence against the local pending purchase when acceptance is required; do not ask repeat buyers to perform checkbox theatre.
- Enabling or changing automatic credit purchase uses a review panel with the exact minimum, target, possible purchase formula, monthly limit, currency, cancellation method, and assigned PaymentMethod. An unchecked affirmation confirms authority to bind the Organization and cardholder permission; the explicit action label is **Enable automatic credit purchase** or **Save automatic credit purchase**. The hosted Setup flow separately handles PaymentMethod authentication and reuse disclosure.
- Adding or assigning a Backup PaymentMethod has its own unchecked affirmation and exact fallback disclosure. A prior Primary consent never authorizes the Backup. Disabling automatic credit purchase or revoking a PaymentMethod requires clear consequence confirmation but no new legal acceptance.
- A material Terms, Refund Policy, or automatic-charge rule change enters `action_required` before another automatic purchase until a billing manager reviews and accepts it. A non-material wording or Privacy Policy update does not manufacture consent as a legal basis or silently invalidate an otherwise valid payment agreement.
- Require one-use Clerk reverification for enabling or materially changing automatic credit purchase, assigning, swapping, or detaching Primary or Backup PaymentMethods, changing the legal billing identity or tax evidence, requesting a Refund, and closing an Organization. Add Clerk's signed `reverification_id` session claim in both instances, bind it to the exact action details, and reject reuse. This protects the Repliery account; Stripe SetupIntent or Checkout authentication remains the payment-network authorization and is not replaced by Clerk.
- Organization closure uses a destructive consequence confirmation that previews purchase blocking, reservation settlement, purchased-credit Refunds, promotional-credit expiry, retained documents, and completion timing. Refund and PaymentMethod-detachment actions use consequence confirmations, not Terms checkboxes.
- Configure the same legal URLs, public business details, statement descriptor, support email/site, Checkout policy display, Customer Portal legal links, and customer emails in Stripe sandbox and live mode. A deploy-time/configuration verifier fails production readiness when either side is missing or drifts from the checked contract.

## Refund, dispute, and fraud policy

- Refund only the remaining purchased portion of traceable lots. Never refund consumed, promotional, already refunded, disputed, frozen, or reserved value.
- Refund to the original payment route, without a refund fee. Repliery bears non-returned Stripe fees.
- Spending consumes purchased lots oldest first, but a refund uses the newest eligible purchased payment first because its original route is most likely still usable.
- A normal eligible refund is automatic. Manual handling is only an exception for a fraud/legal hold, unresolved Dispute, failed original-route Refund, or inconsistent financial state.
- If Stripe cannot complete the Refund, retain `refund_pending` and a payable obligation. Request a verified resolution route; never silently forfeit or recognize the amount as revenue.
- A Dispute or early fraud warning freezes the unspent purchased credit attributable to the affected payment. Already consumed value becomes a separate dispute receivable/risk exposure, never a negative prepaid balance.
- A won Dispute releases only the frozen value. A lost Dispute posts compensating ledger effects for frozen value and records the loss or receivable resolution. Never edit the original grant.
- Prevent duplicate compensation through both Refund and chargeback paths. An open Dispute blocks a Refund for the same payment.
- Reverse a Stripe Tax Transaction and issue a Credit Note only when the underlying taxable service is actually reversed. A payment Dispute alone does not prove the service was reversed.
- Radar default blocks remain enabled. A purchase under manual review remains pending/frozen and cannot grant spendable credit until approved. Store evidence needed for a later Dispute without copying unnecessary personal data into Stripe metadata or logs.

## Delete, close, redact, and retain

- Deleting a Business is a stateful financial saga: enter `deleting`, block new reservations and charges, settle or release active operations, disable limits, retain the stable Business ID and minimum financial tombstone, then delete ordinary product data.
- Business deletion does not refund credit because its spending limit was only an Organization allocation. Historical activity shows “Deleted business”; a legal document keeps the immutable legal snapshot it originally used.
- The only ordinary end-user deletion path remains inside the Clerk OrganizationProfile opened by the existing OrganizationSwitcher. Disable Clerk's immediate built-in delete affordance for new and existing Organizations, then add Clerk's supported custom **Delete Organization** profile page. This keeps Organization management in its current Clerk-owned location while allowing the financial preflight Clerk cannot perform.
- Use Clerk's stable custom-page slot, not its experimental composable OrganizationProfile primitives and not DOM/CSS interception. Clerk continues to own the modal, navigation, routing, accessibility, and focus behavior; the custom content is one small Repliery consequence panel and confirmation built from existing shared primitives.
- After strict one-use reverification and a consequence preview, one Convex mutation enters `closing`, records the deletion command, blocks new spending and purchases, disables automatic credit purchase, and expires safe Checkout flows. The closure saga then voids safe unpaid Invoices, settles reservations and in-flight payments, submits automatic Refunds for all undisputed unused purchased lots, and finalizes required tax/document work.
- Call Clerk's official Backend API `deleteOrganization()` only after the local block is durable, all required external commands are durably accepted, and no unresolved state still needs Organization-member action. A pending Stripe settlement may finish afterward because its retained BillingAccount and financial evidence do not depend on the Clerk Organization. If human action is required, keep the Organization restricted in `closing` and show the recovery state instead of deleting its only access path.
- Promotional credit expires on closure only under its disclosed terms. A failed Refund, Dispute, legal hold, or unresolved invariant keeps the Organization in `closing`; it never justifies forfeiture.
- Detach PaymentMethods and delete or redact the Stripe Customer only after all active payment, Invoice, Refund, and Dispute work is resolved. Stripe redaction is irreversible and is never used while evidence or recovery rights remain.
- A Clerk `organization.deleted` webhook has two idempotent meanings, not two user flows: it confirms the expected final Clerk deletion when it matches the local command, or starts emergency closure when an operator or Backend API bypass deleted Clerk first. The latter uses Clerk's event occurrence time to reject, cancel, or compensate later financial effects. It never cascades deletion into the immutable financial ledger.
- Retention is category-specific through `retainUntil`, not one operational purge rule.
- Retain balances and lot allocations while the liability exists. After the final related event, retain the canonical ledger, allocations, Invoices, Credit Notes, tax calculations/transactions, Refunds, Disputes, consent, authorization snapshot, legal customer snapshot, and reconciliation evidence for 10 years after the end of that financial year, or longer under a legal hold or stricter applicable rule.
- Retain raw Stripe webhook bodies for at most 30 days unless a specific legal hold applies. Retain the sanitized event identity, object identity, API version, hash, processing result, and financial effects for the financial period.
- User deletion breaks the live user link and keeps only a pseudonymous actor ID and minimum authorization evidence. Do not put names or emails in ledger entries.
- Issued document snapshots are immutable and do not change when live Organization details change.
- At final retention expiry, purge or irreversibly anonymize personal data while preserving lawful non-personal aggregates.
- Track jurisdiction, last-owner activity, dormancy date, due-diligence state, reporting state, and remittance state for purchased balances. A jurisdiction policy decides unclaimed-property handling; no global dormancy duration is hard-coded.

## Stripe integration

- Install the current stable `stripe` Node package with the lockfile and pin API requests and both webhook endpoints to GA `2026-07-29.dahlia`. Do not use preview API versions, Stripe Billing Credits, or Stripe Managed Payments.
- Keep the Stripe secret and webhook secret in each Convex deployment. Keep development/sandbox and production/live credentials, Customer data, endpoint secrets, Payment Method Configurations, Customer Portal configurations, tax registrations, and legal URLs separate and symmetric.
- Use a restricted Stripe API key with the minimum resource permissions required. Never expose a secret or restricted key to Next.js or a browser.
- Convex owns the authoritative application origin for Checkout success/cancel and Portal return URLs through a validated `APP_ORIGIN`; a Next.js/Vercel variable is not implicitly available in Convex.
- The endpoint is `/webhooks/stripe`, parallel to but independent from `/webhooks/clerk`.
- A Convex HTTP action reads the exact raw body and `Stripe-Signature`. A separate `"use node"` internal action verifies the signature with stripe-node if the web runtime cannot. Only verified events reach one atomic persistence mutation.
- Durably store and enqueue the sanitized event before returning `2xx`. Use `@convex-dev/workpool` for bounded idempotent processing and retries. Return non-`2xx` only when verification or durable enqueue fails.
- Event delivery order is irrelevant. A handler retrieves current Stripe object state when a snapshot is insufficient, applies a unique financial effect, and treats already-applied effects as success.
- Store event ID, type, object ID, Stripe account, `livemode`, API version, Stripe creation time, receive time, processing state, attempt count, error category, body hash, and resulting effect IDs. Unknown verified events are recorded and acknowledged without effects.
- A scheduled reconciliation job queries pending or failed local work and current Stripe state. It repairs missed processing through the same effect functions; it never writes an alternate ledger path.

### Webhook event set

Configure only the events used by the implemented resources:

- Checkout: `checkout.session.completed`, `checkout.session.expired`.
- SetupIntent: `setup_intent.succeeded`, `setup_intent.setup_failed`, `setup_intent.requires_action`, `setup_intent.canceled`.
- PaymentIntent: `payment_intent.succeeded`, `payment_intent.processing`, `payment_intent.payment_failed`, `payment_intent.requires_action`, `payment_intent.canceled`.
- Invoice: `invoice.finalized`, `invoice.finalization_failed`, `invoice.paid`, `invoice.payment_succeeded`, `invoice.payment_failed`, `invoice.payment_action_required`, `invoice.marked_uncollectible`, `invoice.voided`, `invoice.deleted`.
- Customer and PaymentMethod: `customer.updated`, `customer.deleted`, `customer.tax_id.created`, `customer.tax_id.updated`, `customer.tax_id.deleted`, `payment_method.attached`, `payment_method.detached`, `payment_method.automatically_updated`.
- Refund and Credit Note: `refund.created`, `refund.updated`, `refund.failed`, `credit_note.created`, `credit_note.updated`, `credit_note.voided`.
- Dispute and fraud: `charge.dispute.created`, `charge.dispute.updated`, `charge.dispute.closed`, `charge.dispute.funds_withdrawn`, `charge.dispute.funds_reinstated`, `radar.early_fraud_warning.created`, `radar.early_fraud_warning.updated`, `review.opened`, `review.closed`.

Cards and Link are synchronous, so Checkout asynchronous-payment events are intentionally omitted. Add them only if an asynchronous PaymentMethod is deliberately enabled later.

## Permissions and navigation

- Add exactly two Clerk custom permissions: `org:billing:read` and `org:billing:manage`. These are Repliery product permissions, not Clerk’s `org:sys_billing:*` permissions.
- Roles that receive `manage` must also receive `read`; Clerk does not infer permission implication. Configure and verify the permissions and role assignments in both development and production.
- Keep permission strings in the shared Clerk contract. Central authorization helpers own their meaning; pages and mutations do not repeat ad hoc role checks.
- The server Billing page uses Clerk’s stable `auth.protect({ permission: "org:billing:read" })` behavior. Unauthorized direct navigation returns 404, the Billing navigation item is hidden, and Convex repeats the read or manage permission check for every operation.
- Billing mutations also reject Clerk impersonation and use strict, one-use reverification where listed in the consent contract. Client visibility is convenience only; the server and Convex enforce the same Organization and permission binding.
- Canonical route: `/organizations/[organizationSlug]/billing`. It is an Organization destination and never appears as a child of the selected Business.
- A user assigned to one Business with no Organization billing permission keeps the existing one-Business navigation and sees no Billing route, balance, purchase, document, export, or exact monetary usage.
- Business spending-limit editing requires `org:billing:manage` and access to that Business. Exact Business monetary usage requires `org:billing:read` by default. Do not invent a partial Business billing role before a real downstream payer product exists.
- Future Business payers are not necessarily Clerk Organization members. Downstream customer access must use a separate payer/customer authorization model instead of overloading `businessMemberships`.

## Billing and Business Settings experience

- The Billing page follows the repository’s existing simple PageContainer/PageHeader hierarchy and responsive behavior. It is a polished financial workspace, not a bare dashboard or placeholder.
- Summary shows available credit, reserved/frozen credit when nonzero, current-period spend, automatic credit purchase status, and any state that blocks spending or purchasing.
- A primary **Purchase credit** action opens a focused dialog with presets, exact custom amount, USD disclosure, PaymentMethod summary, zero-tax MPV explanation, Refund Policy and Terms links, and the Stripe-hosted continuation.
- Automatic credit purchase settings show the minimum, target, monthly limit, Primary and optional Backup PaymentMethods, current-period amount, next reset, last purchase, next scheduled retry if any, and clear `active | action_required | limit_reached | disabled` state. Each PaymentMethod card supports explicit assign, swap, replace, and detach actions without exposing a generic ordering UI.
- Usage by Business has a date filter, an accessible time/comparison chart, and a corresponding exact table. The chart and table serve different jobs and coexist.
- Billing activity is paginated and filterable. It includes purchase, automatic purchase, service usage, recurring access, reservation, release, refund, reversal, promotion, expiration, and dispute effects with Business, time, exact amount, status, balance-after, and source/document link.
- Purchases and documents show Receipt, credit-purchase Invoice, Tax Invoice, Credit Note, Refund, status, and recoverable hosted links. Stripe receipt links can expire, so store object IDs and regenerate or retrieve current links rather than treating URLs as permanent records.
- Payment settings use Stripe Customer Portal for billing details, tax IDs, Stripe Invoice history, and generic attached-PaymentMethod maintenance. Repliery's Primary and Backup assignment actions use the hosted Setup flow plus Repliery consent; a PaymentMethod added through the Portal remains unassigned until that flow is completed. Portal Sessions are created on demand and never stored as durable URLs.
- CSV export uses the same filters as the exact activity view and deterministic columns: timestamps, IDs, effect kind, Business ID/label, source, exact nanoUSD and normalized USD, service subtotal, discount, tax, total, lot allocations, status, and document references. An export is not a Receipt or Invoice.
- Business Settings contains the Business usage summary plus soft and hard monthly spending limits for billing managers. Members without billing read access see no monetary summary.
- Use the project’s official shadcn React Aria registry and CLI for needed primitives. The official Chart component with Recharts is appropriate when the data exists. Do not add a third-party registry or speculative domain-component inventory before repetition reveals the correct boundaries.
- Centralize the money display behavior from the start. Extract other domain components by repeated behavior and ownership, not by predicting filenames in a planning document.

## Domain events and future notifications

- Do not implement a general email, notification, or operator-alert delivery system in this billing change.
- Every material billing transition atomically appends a typed billing domain event/outbox record with kind, audience class, entity references, dedupe key, time, and structured context. It contains no delivery channel or final copy.
- The Billing page can show current state directly. Stripe may send its native Receipt, Refund, failed Invoice, and authentication-action messages because those are processor communications, not Repliery’s future notification system.
- Add a terse `TODO(notifications):` at the owning transition or future dispatcher for low balance, soft/hard limit, automatic purchase trigger/success/failure/action/limit/circuit breaker, PaymentMethod expiry/detach, recurring access renewal failure, tax evidence/calculation/registration failure, Refund pending/failure, Dispute/fraud state, Organization closure, webhook poison event, ledger invariant failure, reconciliation mismatch, sanctions eligibility change, and unclaimed-property due diligence.
- Include billing-authority loss, orphaned billing administration, payer revocation, and PaymentMethod reauthorization in the same durable domain-event and `TODO(notifications):` treatment.
- Include Primary failure, Backup attempt/success/failure, and Backup reauthorization in the same durable domain-event and `TODO(notifications):` treatment.
- Model exceptional human resolution as a real `support_required` state with a closed reason-code union, safe context, affected entity references, and a visible support path. Initial reasons include payer revocation, Refund destination unavailable, orphaned billing administration, legal/fraud hold, external configuration drift, and irreconcilable financial state. Use `TODO(support):` only where the future support system must route that durable state; do not build a generic ticketing abstraction in this change.
- Each currently actionable `support_required` reason owns a narrow audited internal command rather than depending on a hypothetical dashboard. Future operator or support UI is an adapter over those commands, not a second business-logic path.
- Use `LEGAL:` only for a non-obvious compliance invariant and its reason, `FUTURE:` only for an intentional seam and the condition that activates it, `LEGACY:` only for compatibility and its removal condition, and `TODO(scope):` only for concrete unfinished work owned at that location. `TODO(notifications):` names future event delivery and `TODO(support):` names future human-case routing; `GENERAL:` does not exist. Comments are not a shadow backlog.

## Future downstream billing and Stripe Connect

- Usage attribution, statements, markup calculation, and exports do not require Stripe Connect. Repliery can build those before it moves money for agencies.
- The likely later model is agency-as-merchant: one Stripe connected account per Organization, each downstream Business as a Customer on that connected account, direct charges owned by the agency, and an optional Repliery application fee. The agency then owns its customer price, tax, Invoice, Refund, Dispute, and negative-balance obligations.
- If Repliery instead becomes merchant of record, destination charges may fit one agency recipient. Separate charges and transfers are justified only for multiple recipients or delayed allocation. That choice changes tax, refund, Dispute, statement descriptor, liability, and support duties and requires its own implementation plan.
- Do not create connected-account fields, onboarding, transfers, payouts, application fees, or downstream Customers now.
- Preserve the real seams now: BillingAccount separate from Organization/Business, Stripe IDs scoped by account, immutable provider cost and customer charge snapshots, operation-to-ledger-to-payment lineage, and separate platform-billing and downstream-billing modules.
- A future Business payer portal and its permissions are separate from today’s internal Business memberships.

## Future enterprise payment terms

- A paid one-off Invoice that grants credit after payment is prepaid funding. It can be added without changing the credit model when bank-transfer and procurement demand justify the payment-method work.
- Usage first and Invoice later is postpaid credit. It creates a receivable, underwriting risk, credit limits, due dates, dunning, collections, bad debt, and suspension policy. It must never be represented as a negative prepaid balance.
- Preserve a future settlement strategy of `prepaid | postpaid` around the immutable service-usage record. Do not create a postpaid schema or a nonfunctional “Contact sales” path until that distinct product is planned and operated.

## Operational implementation contract

- No material billing decision may survive only in a Codex conversation or this planning artifact. During implementation, place each invariant in its strongest durable home: schema/type/state machine for enforceable truth, deterministic test for failure behavior, module/API name for discoverability, and one terse `LEGAL:` or `FUTURE:` comment only when the reason remains non-obvious from correct code.
- After implementation, run a context-survival audit against this artifact. For every decision, identify its durable code, test, configuration, comment, or maintained document; add the missing carrier or delete obsolete planning prose. A future agent must be able to reconstruct the current contract without reading a Codex task.
- Read the installed Next.js 16 documentation and Convex generated guidelines before implementation. Next route parameters are asynchronous; Convex is the only runtime that receives Stripe secrets.
- Add new shadcn primitives only with `pnpm exec shadcn add ...` and inspect the generated diff.
- Use the Clerk CLI/API to create and verify `org:billing:read` and `org:billing:manage` in development and production after explicit approval for those external mutations. The CLI is a development tool and does not belong in runtime dependencies; `pnpm dlx clerk` is sufficient when no global binary is on PATH.
- Before billing release, use the Clerk CLI/API and Dashboard to verify both instances' Role Sets, role-to-permission mappings, session-token claims, reverification factors, Organization creation/default-role rules, deletion affordances for new and existing Organizations, and exact webhook subscriptions. Both instances currently subscribe to `organization.deleted`, `organizationMembership.deleted`, and `user.deleted`; the billing implementation adds `organizationMembership.updated` plus filtered `user.updated` handling symmetrically.
- The Clerk Hobby-compatible baseline uses strict reverification with the strongest currently available first factor plus Clerk's signed one-use `reverification_id` claim in both instances. Billing never depends on paid MFA. When Clerk Pro is enabled, turn on optional authenticator-app MFA and backup codes without globally requiring MFA; the same strict reverification code automatically uses the stronger enrolled factor.
- Clerk Hobby also supports the fixed Admin/Member roles, custom permissions on those roles, custom session-token claims, webhooks, and Backend API used here. Do not create a paid custom role: assign `org:billing:read` and `org:billing:manage` to the existing Admin role and leave Member without them. Paid custom roles remain a future collaboration refinement, not a billing dependency.
- Convex Free supports the required functions, HTTP actions, scheduled work, search, and local-backend testing, so development and initial low-volume operation require no paid-plan branch. Its resource caps are hard; before Repliery promises uninterrupted third-party-cost fulfillment, upgrade the production team to at least Starter/pay-as-you-go and configure usage limits so exhausted free capacity cannot disable billing mutations mid-service. This is a production-readiness configuration gate, not a code fork.
- Add a checked external-configuration contract and verification command for Clerk and Stripe sandbox/live symmetry. The command reports drift without printing secrets and is the source of truth; comments do not duplicate Dashboard instructions.
- Install and authenticate the Stripe CLI as a development tool after explicit approval. Use it to create/inspect sandbox and live webhook endpoints, forward local events, replay fixtures, and verify the pinned API version. It does not belong in runtime dependencies.
- Use Convex and Vercel CLIs for environment configuration only after explicit approval. Report every changed external object and verify both environments separately.
- Reuse the committed test architecture rather than creating a parallel billing framework. Put pure billing tests in `test/unit`, Convex behavior in `test/integration/convex/mock`, genuine backend fidelity gaps in `test/integration/convex/local`, Stripe sandbox contracts in `test/integration/contract/stripe`, browser journeys in `test/e2e`, and shared machinery in `test/support`. Extend the existing exhaustive package-script umbrellas instead of bypassing them.
- Test concurrent reservations, duplicate and out-of-order events, Checkout refresh, automatic-purchase races, retry cancellation, lot allocation, sub-cent rounding, Refund/Dispute overlap, Business and Organization deletion, permission denial, and reconciliation repair at the lowest faithful layer. One durable behavior has one primary test owner; do not duplicate contracts across layers or use coverage/mutation scores as gates.
- Never modify the user’s existing Git staging state.

## Primary authorities

- Stripe GA versioning and SDK policy: https://docs.stripe.com/api/versioning and https://docs.stripe.com/sdks/versioning
- Stripe Checkout fulfillment and idempotency: https://docs.stripe.com/checkout/fulfillment and https://docs.stripe.com/api/idempotent_requests
- Stripe automatic Invoice collection and retries: https://docs.stripe.com/invoicing/automatic-collection and https://docs.stripe.com/billing/revenue-recovery/smart-retries
- Stripe PaymentMethod attachment, Invoice payment selection, off-session consent, and merchant-initiated card rules: https://docs.stripe.com/api/payment_methods/attach, https://docs.stripe.com/api/invoices/pay, https://docs.stripe.com/payments/setup-intents, https://docs.stripe.com/payments/save-and-reuse, and https://docs.stripe.com/payments/cits-and-mits
- Stripe Checkout consent, legal policies, support details, and Customer Portal configuration: https://docs.stripe.com/api/checkout/sessions/create, https://docs.stripe.com/get-started/account/branding, and https://docs.stripe.com/customer-management/configure-portal
- Stripe Irish pricing: https://stripe.com/ie/pricing
- Stripe Tax codes, registrations, monitoring, and reporting limits: https://docs.stripe.com/tax/tax-codes?type=services, https://docs.stripe.com/tax/registering, https://docs.stripe.com/tax/monitoring, and https://docs.stripe.com/tax/reports
- Stripe Refunds, Disputes, and privacy deletion: https://docs.stripe.com/refunds, https://docs.stripe.com/disputes/how-disputes-work, and https://docs.stripe.com/privacy/deletion-requests
- Stripe Connect charge models: https://docs.stripe.com/connect/charges
- Irish Revenue MPV guidance and EU voucher directive: https://www.revenue.ie/en/tax-professionals/tdm/value-added-tax/part05-taxable-amount/single-purpose-vouchers-and-multi-purpose-vouchers/single-purpose-vouchers-and-multi-purpose-vouchers.pdf and https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32016L1065
- Central Bank of Ireland electronic-money definition: https://www.centralbank.ie/regulation/industry-market-sectors/electronic-money-institutions
- Irish B2B place-of-supply and Invoice rules: https://www.revenue.ie/en/vat/vat-on-services/when-is-vat-charged-on-services/general-place-of-supply-rules-for-services.aspx and https://www.revenue.ie/en/vat/vat-records-invoices-credit-notes/invoices/information-required-vat-invoice.aspx
- Irish financial retention and GDPR erasure limits: https://www.revenue.ie/en/starting-a-business/starting-a-business/keeping-records.aspx, https://www.dataprotection.ie/en/faqs/responsibilities-data-controllers/how-long-should-personal-data-be-held-meet-obligations-imposed-gdpr, and https://dataprotection.ie/en/individuals/know-your-rights/right-erasure-articles-17-19-gdpr
- Clerk custom authorization, strict reverification, impersonation detection, and per-tab Organization state: https://clerk.com/docs/guides/secure/authorization-checks, https://clerk.com/docs/guides/secure/reverification, https://clerk.com/docs/guides/users/impersonation, and https://clerk.com/docs/guides/organizations/overview
- Clerk membership lifecycle and eventual webhook delivery: https://clerk.com/docs/reference/types/organization-membership and https://clerk.com/docs/guides/development/webhooks/syncing
- PSD2 consent withdrawal for future payment transactions: https://eur-lex.europa.eu/legal-content/EN/ALL/?uri=CELEX%3A02015L2366-20240408
- Convex HTTP actions, actions, and atomicity: https://docs.convex.dev/functions/http-actions, https://docs.convex.dev/functions/actions, and https://docs.convex.dev/database/advanced/occ
