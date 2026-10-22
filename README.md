# JioFlow CRM — Interactive Demo

A responsive English-first CRM built with dependency-free HTML, CSS and JavaScript. The demo includes the Ecory catalog supplied by the owner, original JioFlow styling, customer follow-up, orders, packing and courier simulation.

## GitHub → Vercel

1. Extract the ZIP and upload the contents of `jioflow-demo` to the GitHub repository root. `package.json` must be at that root.
2. Import that repository in Vercel.
3. Framework: Other. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. The included `vercel.json` sets these defaults. No secrets or environment variables are needed for this browser-only demo.

Use Node.js 18+ (Node 20+ recommended). `npm test` checks core logic, `npm run test:upgrade` checks login, store separation, profit allocation and report filtering. `npm run build` creates `dist/`. Serve `dist/` over HTTPS; password hashing requires Web Crypto in a secure context. No npm dependencies are required.

## Login and separate panels

The first screen is Login / Create Account. Create an Admin account using a **test password**. The first registered store starts with the Ecory sample data; later stores start empty. Each store's data is saved under its own browser-local key.

To enable Agent login, Admin adds the person in Users and sets a test password or shares the workspace code for Create Account → Invited Agent. Correct credentials create a Pending request; Admin must approve it in Users before access opens. Passwords are stored as salted PBKDF2 hashes, never plaintext.

**This is not production authentication.** Browser data and account records are local and inspectable. Sessions and role checks are not a server-enforced security boundary. Accounts do not synchronize across browsers or devices. Use only sample customer data and test credentials. Production requires Supabase Auth, tenant/role database policies, server validation and trusted Admin provisioning. Vercel deployment alone does not add those capabilities.

## Dashboard and reports

- Original light JioFlow layout, white/green gradients and subtle raised surfaces.
- Summary metrics first, then work/delivery stages, time-series charts, source distribution, customer outcomes, top products, recent orders and courier overview.
- Reporting dates use Bangladesh calendar boundaries. Customer outcome totals are current profile snapshots; order totals follow the reporting period.
- Agent Reports → click a person's name → full report page. The top row shows Assigned, Completed, Pending, Confirmed, Cancelled, Delivered and Returned. Click a total to filter the customer/order details below on the same page. Open a customer for the complete profile and history.
- Customer Follow-up and Orders & Delivery are separate tabs, since one phone/profile can have several orders.
- Profit includes revenue, costs, discounts, net estimate, margin, time-series charts, source/product/Agent breakdowns and per-order detail. Missing costs are explicitly marked. Product profit allocations include a proportional share of order-level discounts and fees.

## Personal widgets and layout

Refresh is a separate button outside the three-dot menu, beside New Order where available. The three-dot menu includes Edit layout, Add widget, Show/hide sections, Layout settings and Reset layout.

Reorder page sections using drag/drop or arrow buttons. Individual widgets can be reordered within their existing group. Add order totals, revenue, profit (authorized users only), pending follow-ups, sources, calls, delivery progress or a text note. New widgets support small, half and full desktop widths. Choose comfortable/compact spacing and desktop column counts. Save commits the page layout; Cancel discards the draft. Reset affects layout only, not business records. Preferences are per page, account and store in this browser.

The editor rearranges existing data widgets and supported custom widgets; it does not create new database fields, integrations or arbitrary application functionality. Every in-app popup has a close X and supports Escape.

## Other workflows

One phone → one profile/follow-up, combined order history; manual/bulk/equal customer distribution, permanent clients, callbacks, custom statuses and tags. Compact Users cards, individual permissions, per-Agent Table/Card processing view, per-pull size, daily limits and self-pull rules by imported status/source. The local session log simulates approval and revocation.

Multi-product order entry, editable prices/discount permissions, payment method/transaction ID, delivery charges, manual exchange reference, print invoice, order filters/CSV export, packing and simulated Steadfast/Pathao booking. Other courier APIs require an adapter. Courier history is visibly unconnected rather than fabricated.

Products support Active/Featured switches, search/filters, SKU-based CSV import/export, bulk activation and reversible archive. Ecory's 14 displayed default product variants and images are included; verify live prices before business use. Cost prices are blank until supplied. Stock tracking is disabled.

CSV import updates matched Order IDs and phone profiles without treating historical imports as fresh sales. Browser demo cap is 2,000 rows / 5 MB, not a subscription limit. The production target of 50 Agents and 300,000–500,000 historical rows requires indexed server queries and background imports. No order or user package quota is imposed in the demo.

## Production phase

Supabase Auth/Postgres, tenant policies, server-verified permissions, background CSV jobs, audited assignments, cost snapshots and financial reconciliation are not connected. Real courier adapters need server-only credentials, idempotent bookings, retries and verified status/webhook processing. No live courier booking, payment or phone-history API request is sent.

Browser JSON backups export business records for safekeeping; they do not export login credentials or restore themselves. Fonts use Google Fonts with system fallbacks. Product images are bundled locally. No analytics scripts are included.


### Overview and reports update
All Orders includes twelve summary tiles and expandable order/delivery charts, using the selected period and Agent/courier/source/call/response/tag filters. Follow-ups includes twelve current-profile summary tiles and expandable call/status charts. Summary cards filter their corresponding record list. Customer snapshots are not historical event counts.

Agent Reports includes totals, assignment distribution, purchase rate, outcomes, User Codes, and per-metric drill-downs. Agent purchase rate counts unique connected profiles with a confirmed order in the reporting period, divided by the current connected profiles. Repeat purchases count once. This differs from Dashboard's explicitly labeled purchasing/all-profile rate. Missing costs are never estimated as zero. Period comparisons use an equal previous time interval; zero baselines show No previous data.

Workflow settings support renaming unused/in-use labels, optional colors, confirm/callback defaults and separate permanent-client statuses. Removing an in-use option is blocked. Team recognition shows the three leading Agents for the selected period. These remain browser-local demo features.

Run `node tests-metrics.mjs` for the additional overview, percentage, purchase-rate, role-scope and filter checks.


### Rounded theme and Dashboard action cards
The supplied design reference informs rounded shapes, pale grey cards, pill navigation and a white shell; JioFlow keeps lime and charcoal accents. Dashboard adds Ready to Book, today's/overdue callbacks, delivery/return rates over resolved shipments, and a manual delivered COD receipt balance. Packing navigation, routes and controls are removed. Existing stored packing fields are retained only for backward compatibility.

Order lists show current profile assignment and editable order notes. Follow-ups show the latest note and support appending to note history. Top Performers shows three compact ranked Agent summaries with confirmed count, revenue, permission-gated net profit, purchase rate and team revenue share. Clicking a performer opens the full user report, including financial details, work outcomes, delivery/return rates and customer/order records. Rankings can use confirmed orders, revenue, net profit (authorized accounts) or purchase rate.

Comparison badges sit beside the main value; the previous value is below. Financial and order comparisons use equal prior intervals. Previous profile snapshots are recorded locally going forward, and missing historical snapshots display No recorded history rather than fabricated values. Layout edits support renaming page/section titles, changing grid span, reordering, reversible section removal/restoration and custom widgets. Preferences remain scoped to this browser account and page; removing a layout section does not delete business records.

Run `node tests-theme.mjs` for comparison, snapshot, action-card, performer-privacy, assignment, note-column and Packing-removal checks.


### Unified Admin and Agent login
Admin replaces the separate Owner and Super Admin login roles. Existing local Owner/Super Admin accounts migrate on sign-in without changing passwords. A legacy platform account is linked to an existing active workspace (or an initial workspace if none exists). Admin uses the full CRM and workspace directory from a single panel. Admin cannot pause the currently open workspace.

The login page has one common Login form and a Create Account tab. Signup offers Super Admin, Owner and Agent. Super Admin and Owner use the unified Admin panel; Agent opens only its assigned panel after approval. Stored account roles select the panel automatically, without a role selector during login. Legacy Manager accounts migrate to Agent. An Agent can activate an invitation or register against a valid active workspace code; new registrations receive minimal permissions and require Admin approval. Supabase is still required for online shared authentication and server-enforced access.


### Two roles and mandatory Agent approval
Only Admin and Agent remain in the user-facing workflow. Legacy Manager records migrate to Agent. Super Admin and Owner signup types share the Admin panel. Every account uses the same Login form.

Every fresh Agent login creates a Pending request even after correct password validation; the Agent panel remains locked. Admin sees requests in Users and the top-bar approval icon, and can approve, reject or revoke access. Approval resumes across page refresh for that same session; logging in afresh requests approval again. Approving one session revokes the user's other current sessions. Sign-out closes the current approved/pending request. Approval and request updates synchronize between tabs of the same browser in this local demo; shared online approval and security enforcement across devices require the backend.

Dashboard surfaces now use very light white-to-brand-green gradients.

## Workspace hierarchy update

Owner accounts create and switch between any number of shops. Each shop has its own customers, orders, products, users, groups and reports. Owner can add Admin, Manager or Agent accounts; shop Admin can add Manager and Agent accounts. Managers follow configured permissions and cannot manage users or create shops. Add user requires an initial login password and creates the login credential together with the user profile. Agent login still requires Owner/Admin approval. Public registration is limited to the initial Owner setup; staff login directly.

Users can be grouped, and selected customers can be distributed evenly across active Agents in a group. Settings use a vertical account/password/shop layout. Compact user cards show completion and purchase rates, and open the existing detailed report. Dashboard cards use relevant icons and subtle shadows; the profit card uses dark brand styling.

These are browser-local demonstration accounts and isolated browser storage, not server-enforced authentication or tenant security. Cross-device shared login, database permissions and production deployment still require the planned backend integration. Run `node tests-workspaces.mjs` for hierarchy, provisioning, shop/group isolation, distribution, Manager permissions and dashboard ordering checks.

Dashboard refresh: Agent summary cards precede charts; Confirmed and Completed stay next to each other. Soft semantic colors, relevant icons, defined borders and subtle dimensional shadows distinguish each metric. Agent layout customization controls and mutation handlers are disabled. Owner has a separate Admin Management panel, apart from Settings. Settings include the supplied reference's money defaults, discount rules, Hero schedule/message/preview, workflow and permanent statuses, tags, account and password fields. Agent profit visibility stays off under the requested policy. Hero reminders operate during browser use, not as server push notifications. Creator provisioning, verified-email enforcement and hardware-bound device restrictions remain backend work; they are not simulated as verified security.

## Creator prototype update (current hierarchy)

A single Creator performs initial setup. Existing primary Owner accounts can migrate explicitly from Settings when there is no Creator; existing data is retained. Public registration is disabled after setup. Only Creator creates Owners and shops; each shop is assigned to an Owner. Owners manage assigned shops and Admins; Admins manage Managers/Agents. Force logout uses subordinate-account checks and session revocation/version records, with cross-tab updates. Agent sessions are tied to one approved browser installation at a time; approving a replacement revokes old sessions. Hardware/device attestation and cross-device synchronization require the production backend.

New Owner/Admin accounts stay pending email activation. The verification preview explicitly simulates activation, sets emailVerified=false and does not send email or verify mailbox ownership. Production SMTP/Supabase verification remains unconnected. Creator credentials and all demo data live only in this browser, so singleton and permission checks are prototype behavior, not server security.

The shared avatar menu opens My Profile or Sign out. Profile shows account details, current-password-checked password changes and read-only access badges; email changes are held until the real verification service is connected. Cards retain the original palette: black Profit, green Confirmed and light ash gradients elsewhere. Run node tests-creator.mjs for the integrated hierarchy and revocation checks.

## Business workspace refinements (current behavior)

Only Creator sees Shops and the global business selector. Each Owner is restricted to one assigned business and has no Shop menu or selector. Creator has separate Owners, Admins and Agents sections, an aggregate dashboard with clickable details, and a collapsible business navigation under Shops. Selected business name stays in the top bar; business settings, products, customers, orders and staff stay scoped to that business. Existing business data is preserved.

Shop creation requires name, email, phone and assigned Owner; logo, address and website are optional. Business identity is editable in that shop's Workspace Settings. Account profiles support phone, optional job title/address and uploaded profile images. Images are limited to PNG/JPEG/WebP up to 1 MB in this browser prototype. Creator/Owner/Admin can edit subordinate accounts and request recovery; the Forgot password entry explicitly records an unsent local request until an email backend exists. No real password recovery email or verified-mail claim is made.

Purchase rate now uses unique purchasing completed customers divided by completed customer profiles. Agent dashboards expose sales revenue while retaining profit restrictions. Confirmed order charts show Website/Facebook/WhatsApp/Other counts and stacked daily/hourly bars. Cards use flat, thin brand borders and restrained neutral gradients, with black profit and green confirmed highlights. Comparison percentages sit below icons; missing historical baselines remain unavailable rather than fabricated. The logo is a real home link with normal browser context menu behavior. Run node tests-refinements.mjs for the integrated workspace and conversion rules.

Owner/Admin policy: Owner controls per-Admin permissions for staff/groups, assignment,
booking, catalog, imports, exports, profit/cost visibility, general settings, login/device
approval and force logout. Sensitive permissions default off. Action and route guards
apply in this browser prototype; production needs database/server enforcement.
Creator dashboard now shows shops, customer profiles, Owners, Admins, Agents,
customer-based business overview and top Agent completion/confirmation performance.
It excludes platform sales/profit/order/courier financial summary widgets.

Creator shop selection retains the current section, clears shop-specific selections and
unsaved order items, and reloads that section for the selected business. All Shops
provides a read-only per-business overview in the same section; select one shop to
open its records or edit settings. Account Access is grouped into Owners, Admins,
and Agents, scoped to the selected business (or all businesses under All Shops).

Account removal uses a confirmation dialog, disables login, revokes prototype sessions,
archives the member, releases assignments/group membership and keeps historical orders.
Creator may remove Owners/Admins/Agents; Owner may remove shop Admins/Agents; Admin
requires user-management permission and can remove subordinate staff only. Removing
an Owner releases ownership without deleting the shop. Creator/self removal is blocked.
Shops now opens a directory. Open workspace displays shop contact details and a focused
shop sidebar with Back to Shops; top selector changes still preserve the current section.
