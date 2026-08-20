# Cal.com booking setup

The booking page is complete and displays a safe walk-in fallback until the
shop's Cal.com account is connected. No placeholder scheduler or simulated
booking is used.

## 1. Create the Cal.com account

1. Create the merchant-owned Cal.com account using an inbox the shop controls.
2. Set the organization/display name to **Upper East Watch Repair**.
3. Set the time zone to **America/New_York**.
4. Set the in-person location to **233 East 84th Street, New York, NY 10028**.
5. Add the shop's real notification email and calendar connection.

## 2. Add event types

Create these public event types:

| Event | Suggested duration | Purpose |
| --- | ---: | --- |
| Watch Repair Consultation | 20 minutes | Mechanical, quartz, vintage, and high-end watch assessment |
| Battery Replacement | 10 minutes | Swiss battery replacement and water-resistance care |
| Jewelry Repair | 20 minutes | Ring resizing, chain repair, diamond replacement, and prong repair |

Use the confirmed shop capacity when deciding buffers and simultaneous bookings.
Do not promise completion during the appointment; the appointment is for intake
and assessment unless the shop explicitly changes that policy.

## 3. Configure availability

Temporary site hours are:

- Monday–Friday: 10:00 am–6:00 pm
- Saturday: closed
- Sunday: 11:00 am–5:00 pm

These remain provisional. Confirm them with the client before copying them into
Cal.com or publishing the final site.

## 4. Connect the website

1. Choose the Cal.com routing page or event type that should appear first.
2. Copy only the link path, such as `upper-east-watch-repair/consultation`.
3. Add a shared Replit environment variable named `VITE_CAL_LINK` with that path.
   This is public configuration, not a secret.
4. Restart the `artifacts/watch-repair: web` workflow.
5. Open `/book` and confirm the inline scheduler replaces the setup fallback.

The page loads Cal.com's official embed script only when `VITE_CAL_LINK` is
present.

## 5. Required launch test

Before launch, complete one real end-to-end booking:

1. Select each event type at 375 px and desktop widths.
2. Book a disposable test appointment.
3. Confirm the customer email arrives.
4. Confirm the appointment appears on the connected calendar and Cal.com
   dashboard.
5. Use the email's reschedule link and verify both systems update.
6. Cancel the test booking and confirm the cancellation notification.

This test cannot be completed until the shop owns and connects its Cal.com
account.