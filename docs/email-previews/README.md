# GSC email review previews

These screenshots render the actual Supabase HTML templates locally with a fake first name and fake one-time credentials. They are not proof of delivered email or native email-client rendering.

| Email | Desktop | iPhone size |
| --- | --- | --- |
| Welcome / verification | [Preview](verification-desktop.png) | [Preview](verification-iphone.png) |
| Password recovery | [Preview](password-reset-desktop.png) | [Preview](password-reset-iphone.png) |

The screenshots load the existing logo from the repository. Separate automated checks block images to verify that the club name, message, and action remain readable. Generate all seven email types and plaintext alternatives with `npm run emails:preview` (requires Go); see [installation and acceptance steps](../BRANDED-AUTH-EMAILS.md).
