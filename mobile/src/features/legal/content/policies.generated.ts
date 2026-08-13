/**
 * AUTO-GENERATED — do not edit by hand.
 * Legal policy documents bundled into the app (source: legal markdown, v1.0).
 * Regenerate via scratchpad/gen-policies.js if the source documents change,
 * and bump CURRENT_POLICY_VERSION so existing users are re-prompted to accept.
 */

/** Stable id for each policy — used in navigation params and the consent list. */
export type PolicyId =
  | 'privacy'
  | 'terms'
  | 'community'
  | 'coins'
  | 'deletion'
  | 'safety'
  | 'copyright'
  | 'disclaimer';

export type Policy = {
  id: PolicyId;
  title: string;
  markdown: string;
};

/** Bump this whenever any bundled document changes (v1.0 -> v1.1 -> ...). */
export const CURRENT_POLICY_VERSION = 'v1.0';

/** All policies, in the order shown in the User Agreement. */
export const POLICIES: readonly Policy[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    markdown: `# Privacy Policy

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

Welcome to Dangg, a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd. We value your privacy and are committed to protecting your personal information. This Privacy Policy explains what information we collect, how we use it, how we store it, and the choices available to you.

By creating an account or using Dangg, you agree to the collection and use of your information in accordance with this Privacy Policy.

---

## 1. Eligibility

Dangg is intended only for individuals who are 18 years of age or older.

By registering and using the application, you confirm that you are at least 18 years old.

If we discover that an account belongs to a person below the age of 18, we reserve the right to suspend or permanently remove that account and delete all associated data.

---

## 2. Information We Collect

To provide our services, we collect the following information.

### 2.1 Personal Information

During registration and profile creation, we may collect:

- Mobile Number
- Full Name
- Gender
- Date of Birth
- Bio/About Information
- Profile Photos

### 2.2 User Generated Content

While using Dangg, you may create or upload:

- Text Messages
- Images
- Videos
- Profile Information

This content is collected solely for providing the services offered within the application.

### 2.3 Technical Information

To improve security and performance, we may automatically collect certain technical information including:

- Device Model
- Device Operating System
- Application Version
- Device Identifier (where permitted)
- IP Address
- Login Time
- Crash Reports
- Diagnostic Information

---

## 3. OTP Authentication

Dangg uses mobile number verification through One-Time Password (OTP) authentication. We do not use passwords for user login. Your mobile number serves as your primary identifier and is verified each time you log in through an OTP sent to your registered number.

---

## 4. How We Use Your Information

We use your information to:

- Create and manage your account.
- Verify your identity using OTP.
- Display your profile to other users.
- Enable messaging between users.
- Store uploaded images and videos.
- Improve and personalize your experience.
- Prevent fraud, abuse, spam, and unauthorized activities.
- Respond to customer support requests.
- Monitor platform safety and moderate content.
- Comply with applicable legal obligations.
- Communicate with you about updates, safety, and support.

---

## 5. How We Share Your Information

We do not sell your personal information. We never share your data with third parties for their own marketing purposes.

We may share your information only in the following circumstances:

- **Service Providers:** Trusted third parties who help us operate the application, including cloud hosting, OTP verification, analytics, crash reporting, and customer support platforms. These providers process information only as necessary to provide services on our behalf and are contractually bound to protect your data.

- **Legal Requirements:** If required by law, regulation, or legal process (such as a court order or subpoena), or to protect our rights, safety, or property, or the rights, safety, or property of others.

- **With Your Consent:** When you explicitly choose to share information with other users as part of the application's functionality (such as your profile and messages).

---

## 6. Media Storage

Images and videos uploaded to Dangg are securely stored using trusted cloud storage infrastructure. Media files are stored only for providing application functionality and are protected through appropriate access controls.

---

## 7. Chat Data

Messages exchanged between users are stored securely on our servers to provide messaging functionality.

Currently, chats are not end-to-end encrypted. However, user conversations are not publicly accessible and are protected through appropriate access controls.

Access to stored messages is limited and may occur only when reasonably necessary for:

- Investigating reported abuse
- Responding to user complaints
- Maintaining platform security
- Complying with legal obligations

Messages may also be automatically deleted according to our retention policies.

---

## 8. User Safety and Complaints

Dangg provides an in-app complaint system to promote user safety. Users may report abuse, harassment, fake profiles, inappropriate content, or policy violations through the application.

All complaints are reviewed individually, and WelBuilt AI Solutions Pvt. Ltd. may take appropriate action based on the available evidence.

For detailed information on our safety practices, reporting process, and moderation actions, please refer to our Safety & Reporting Policy.

---

## 9. Data Retention

We retain your information for as long as your account is active or as needed to provide the Service. If you delete your account, we will delete your personal data within 30 days, except where retention is required by law for fraud prevention, dispute resolution, legal compliance, or backup restoration.

---

## 10. Data Security

We implement reasonable administrative, technical, and organizational safeguards to protect user information against unauthorized access, disclosure, alteration, or destruction. These include encryption, secure servers, and regular security audits.

Although we continuously work to protect your information, no electronic storage or transmission method over the Internet can guarantee absolute security.

---

## 11. Account Deletion

Users may permanently delete their account through the application settings. When an account is deleted, personal information is removed or scheduled for deletion in accordance with our data retention practices.

For a complete explanation of the deletion process, including what information is deleted, what may be retained, and how virtual coins are handled, please refer to our Account Deletion Policy.

---

## 12. Cookies

We use essential cookies to operate the Service and analytics cookies to understand usage patterns and improve your experience. You can control cookie preferences through your browser or device settings. Disabling certain cookies may affect the functionality of the application.

---

## 13. Third-Party Services

To operate and improve Dangg, we may use trusted third-party service providers, including but not limited to:

- Cloud Storage Providers
- OTP Verification Services
- Analytics Services
- Crash Reporting Services
- Customer Support Platforms

These providers process information only as necessary to provide services on our behalf and are contractually prohibited from using your data for any other purpose.

---

## 14. Children's Privacy

Dangg is strictly intended for adults aged 18 years and above.

We do not knowingly collect personal information from children. If we become aware that an underage user has registered, we reserve the right to immediately suspend or permanently remove the account and delete all associated data.

---

## 15. User Responsibility

Users are responsible for the information they share and the interactions they have with others on the platform. Dangg does not verify the authenticity of every profile, and users should exercise caution when communicating with or meeting other users.

Never share sensitive personal information, banking details, passwords, or financial information through the application.

For expected user behaviour and prohibited activities, please refer to our Community Guidelines.

---

## 16. Your Rights

Depending on applicable laws, users may have the right to:

- Access the personal information we hold about you.
- Request correction of inaccurate or incomplete information.
- Request deletion of your account and associated data.
- Object to or restrict processing of your data.
- Data portability — receive a copy of your data in a structured format.
- Withdraw consent at any time where processing is based on consent.
- Contact us regarding privacy-related concerns.

To exercise any of these rights, contact us at support@dangg.app. We will respond to your request within the timeframe required by applicable law.

---

## 17. Community Guidelines

Dangg maintains a separate Community Guidelines document that outlines expected user behavior, prohibited activities, and the consequences of violations. All users are expected to read and comply with the Community Guidelines in addition to this Privacy Policy.

For detailed information on acceptable use and community standards, please refer to the Community Guidelines document available on our website and within the application.

---

## 18. Changes to This Privacy Policy

We may update this Privacy Policy from time to time.

If significant changes are made, we will notify you through the application or via email before they take effect. Continued use of Dangg after any updates constitutes acceptance of the revised Privacy Policy.

We encourage you to review this Privacy Policy periodically.

---

## 19. Contact Us

If you have any questions regarding this Privacy Policy or your personal information, you may contact us.

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
  {
    id: 'terms',
    title: 'Terms & Conditions',
    markdown: `# Terms & Conditions

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

Welcome to Dangg, a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd.

These Terms & Conditions ("Terms") govern your access to and use of the Dangg application, website, and related services.

By creating an account or using Dangg, you acknowledge that you have read, understood, and agreed to these Terms. If you do not agree, you must not use the application.

---

## 1. Acceptance of Terms

By accessing or using Dangg, you agree to comply with these Terms, our Privacy Policy, Community Guidelines, and any additional policies published by WelBuilt AI Solutions Pvt. Ltd. These documents collectively form the binding agreement between you and WelBuilt AI Solutions Pvt. Ltd. regarding your use of the platform.

---

## 2. Eligibility

To use Dangg, you must:

- Be at least 18 years of age.
- Be legally capable of entering into a binding agreement.
- Provide accurate information during registration.
- Comply with all applicable laws.

WelBuilt AI Solutions Pvt. Ltd. reserves the right to suspend or terminate accounts that do not satisfy these requirements.

---

## 3. User Accounts

Users must register using a valid mobile number verified through One-Time Password (OTP) authentication. You are responsible for:

- Maintaining access to your registered mobile number.
- Keeping your profile information accurate.
- Updating information whenever necessary.

You are responsible for all activity occurring through your account. You must not create multiple accounts or share your account with others.

---

## 4. Mobile Number & OTP Authentication

Dangg uses mobile number verification through OTP authentication as the sole method of user authentication. No passwords are used for login.

Your mobile number serves as your primary account identifier. Each time you log in, an OTP is sent to your registered mobile number for verification.

You must not attempt to bypass, intercept, or manipulate the OTP authentication process. Any such attempt may result in immediate suspension or termination of your account.

---

## 5. User Profiles

Users agree that all information provided during profile creation must be truthful and accurate. You must not:

- Create fake identities.
- Impersonate another person.
- Use another individual's photographs without authorization.
- Misrepresent your age or identity.

WelBuilt AI Solutions Pvt. Ltd. may remove misleading profiles without prior notice.

---

## 6. Acceptable Use

Dangg is intended for building genuine friendships and meaningful relationships. You agree to use the platform respectfully and lawfully.

You must not use Dangg for:

- Fraudulent activities.
- Illegal purposes.
- Harassment, threats, or bullying.
- Spam or unsolicited commercial messages.
- Commercial advertising without permission.
- Sharing harmful, malicious, or deceptive content.
- Attempting to access another user's account without permission.
- Interfering with the platform's operation or security.

Further behavioral expectations are described in the Community Guidelines.

---

## 7. User Content

You retain ownership of the content you upload, including profile information, messages, images, and videos.

By uploading content to Dangg, you grant WelBuilt AI Solutions Pvt. Ltd. a limited, non-exclusive, royalty-free license to store, display, and process such content solely for operating and improving the platform.

You represent that your content does not violate any third-party rights or applicable laws. You are solely responsible for the content you publish.

---

## 8. Virtual Coin System

Dangg includes a virtual coin system that enables access to certain in-app features.

Virtual coins:

- Have no cash value.
- Cannot be exchanged for money unless expressly permitted under an official policy published by WelBuilt AI Solutions Pvt. Ltd.
- Are non-transferable between users.
- May expire or be modified in accordance with future platform policies.

Additional details regarding purchases, refunds, and usage are provided in the separate Virtual Coin & Payment Policy.

---

## 9. In-App Complaints & Moderation

Users may submit complaints through the in-app complaint system regarding abuse, harassment, fake profiles, inappropriate content, technical issues, or policy violations.

WelBuilt AI Solutions Pvt. Ltd. reviews every complaint and may investigate reported accounts or content. Based on the investigation, WelBuilt AI Solutions Pvt. Ltd. may take appropriate action including:

- Issuing warnings.
- Removing content.
- Temporarily restricting platform access.
- Suspending accounts.
- Permanently terminating accounts.

Administrative decisions are made in good faith to maintain community safety.

---

## 10. Account Suspension & Termination

WelBuilt AI Solutions Pvt. Ltd. reserves the right to suspend or terminate any account that:

- Violates these Terms.
- Violates the Community Guidelines.
- Engages in illegal activities.
- Attempts to compromise platform security.
- Repeatedly receives verified complaints.

Termination may occur without prior notice where necessary to protect users or the platform. Users may also delete their account at any time through the application settings.

---

## 11. Intellectual Property

The Dangg name, logo, branding, application design, software, graphics, and related intellectual property are owned by WelBuilt AI Solutions Pvt. Ltd. unless otherwise stated. Dangg is developed by Spark AI, the software development brand of WelBuilt AI Solutions Pvt. Ltd.

Users may not:

- Copy, modify, or redistribute any part of Dangg.
- Reverse engineer the application.
- Commercially exploit any part of Dangg without written permission from WelBuilt AI Solutions Pvt. Ltd.

---

## 12. Third-Party Services

Dangg may use trusted third-party service providers to operate certain features, including cloud storage, OTP verification, analytics, crash reporting, and customer support platforms. Their services are governed by their own policies.

WelBuilt AI Solutions Pvt. Ltd. is not responsible for the independent practices of third-party providers.

---

## 13. Service Availability

While WelBuilt AI Solutions Pvt. Ltd. aims to provide uninterrupted service, we do not guarantee continuous availability.

Services may be temporarily unavailable due to:

- Maintenance.
- Technical failures.
- Security updates.
- Events beyond our reasonable control.

---

## 14. Disclaimer

Dangg provides a platform that enables users to connect with one another. The service is provided "as is" and "as available" without warranties of any kind, either express or implied.

WelBuilt AI Solutions Pvt. Ltd. does not guarantee:

- The authenticity of every user.
- The success of any friendship or relationship.
- The behavior of individual users.
- Compatibility between users.
- That the Service will be uninterrupted, secure, or error-free.

Users are responsible for exercising appropriate caution during interactions, both online and offline.

---

## 15. Limitation of Liability

To the maximum extent permitted by applicable law, WelBuilt AI Solutions Pvt. Ltd. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of your use of the Service, including but not limited to:

- User disputes.
- Loss of personal relationships.
- User-generated content.
- Unauthorized user behavior.
- Loss of data or profits.

Nothing in these Terms excludes liability that cannot legally be excluded under applicable law.

---

## 16. Indemnification

You agree to indemnify and hold harmless WelBuilt AI Solutions Pvt. Ltd., Spark AI, and their respective directors, employees, contractors, and affiliates from any claims, damages, losses, liabilities, and expenses arising from:

- Your misuse of Dangg.
- Your violation of these Terms.
- Your violation of applicable law.
- Your infringement of another person's rights.

---

## 17. Changes to These Terms

WelBuilt AI Solutions Pvt. Ltd. may modify these Terms from time to time. Material changes will be communicated through the application or other appropriate channels before they take effect.

Continued use of Dangg after such changes constitutes acceptance of the revised Terms. We encourage you to review these Terms periodically.

---

## 18. Governing Law

These Terms shall be governed by and interpreted in accordance with the laws of the Republic of India.

Any disputes arising from these Terms shall be subject to the jurisdiction of the competent courts in Mumbai, India, unless otherwise required by applicable law.

---

## 19. Contact Us

For questions regarding these Terms & Conditions:

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
  {
    id: 'community',
    title: 'Community Guidelines',
    markdown: `# Community Guidelines

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

Welcome to Dangg, a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd.

Our goal is to create a respectful, welcoming, and safe environment where users can build meaningful friendships and relationships.

By using Dangg, you agree to follow these Community Guidelines. Failure to follow these guidelines may result in warnings, content removal, temporary restrictions, suspension, or permanent account termination.

---

## 1. Respect Others

Treat every user with kindness and respect.

You must not:

- Harass or bully others.
- Threaten or intimidate users.
- Use abusive or offensive language.
- Discriminate based on race, religion, nationality, gender, disability, or any other protected characteristic.
- Encourage violence or self-harm.

---

## 2. Be Honest

Your profile should represent you accurately.

You must not:

- Create fake profiles.
- Impersonate another person.
- Use another person's photographs without permission.
- Misrepresent your age or identity.
- Pretend to represent any organization or company.

Authentic profiles create a better experience for everyone.

---

## 3. Appropriate Content

Only share content that is appropriate for a respectful dating and friendship community.

Do not upload or share:

- Illegal content.
- Sexually explicit or pornographic material.
- Nudity intended for sexual purposes.
- Violent or graphic content.
- Hate speech.
- Content promoting terrorism or criminal activity.
- Copyright-infringing material.

---

## 4. Private Conversations

Respect the privacy of other users.

Do not:

- Share another user's personal information without consent.
- Publish screenshots of private conversations to harass or embarrass others.
- Attempt to obtain confidential information through deception.

---

## 5. Spam and Misuse

Dangg is intended for genuine social connections.

Do not use the platform to:

- Send spam.
- Send repeated unwanted messages.
- Promote businesses without authorization.
- Conduct scams or phishing.
- Request banking information, passwords, or OTPs.
- Spread malware or harmful links.

---

## 6. Meet Safely

If you decide to meet another user in person:

- Meet only in public places.
- Inform a trusted friend or family member.
- Never feel pressured into meeting someone.
- Leave immediately if you feel unsafe.

Dangg cannot guarantee the behavior or identity of individual users. Always use your own judgment.

---

## 7. Report Problems

If you encounter fake profiles, harassment, abuse, spam, inappropriate content, or technical issues, please use the in-app complaint system. Every complaint is reviewed by our administrative team.

---

## 8. Enforcement

WelBuilt AI Solutions Pvt. Ltd. may take action against accounts that violate these Community Guidelines. Depending on the seriousness of the violation, actions may include:

- Educational warning.
- Content removal.
- Temporary feature restrictions.
- Temporary suspension.
- Permanent account termination.

Repeated violations may result in immediate account removal.

---

## 9. Illegal Activities

The platform must never be used for unlawful activities. This includes:

- Human trafficking.
- Financial fraud.
- Blackmail.
- Extortion.
- Identity theft.
- Child exploitation.
- Distribution of illegal material.
- Sale of prohibited goods or services.

Any activity that appears to violate applicable law may be reported to the appropriate authorities where required.

---

## 10. Respect Intellectual Property

Only upload content that you own or have permission to use. Do not upload copyrighted images, videos, or other materials without authorization.

---

## 11. Updates to These Guidelines

These Community Guidelines may be updated periodically to improve user safety and comply with legal or regulatory requirements. If significant changes are made, we will notify you through the application or other appropriate channels. Continued use of Dangg after updates constitutes acceptance of the revised guidelines.

---

## 12. Contact Us

If you have questions regarding these Community Guidelines, or if you believe they have been applied incorrectly, please contact us.

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
  {
    id: 'coins',
    title: 'Virtual Coin & Payment Policy',
    markdown: `# Virtual Coin & Payment Policy

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

This Virtual Coin & Payment Policy explains how Dangg's virtual coin system operates. Dangg is a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd.

By purchasing or using Dangg Coins, you agree to this policy together with our Terms & Conditions and other applicable legal documents.

---

## 1. About Dangg Coins

Dangg Coins are virtual digital credits used within the Dangg application.

They are provided solely for use within Dangg and do not represent:

- Real currency
- Electronic money
- Cryptocurrency
- Securities
- Financial assets

Coins have value only within the Dangg platform.

---

## 2. Purpose of Coins

Coins may be used to access eligible in-app features made available by Dangg. The availability, pricing, and usage of features may change over time.

---

## 3. Purchasing Coins

Coins may be purchased through payment methods officially supported by Dangg. Prices, packages, taxes, and applicable charges will be displayed before purchase.

---

## 4. Promotional Coins

From time to time, Dangg may offer:

- Welcome bonuses
- Promotional rewards
- Referral rewards
- Event rewards

Promotional coins may have different conditions from purchased coins. Such conditions will be communicated when the promotion is offered.

---

## 5. Ownership of Coins

Users receive a limited, revocable license to use virtual coins within Dangg. Coins remain part of Dangg's virtual services and do not create ownership rights outside the platform.

---

## 6. Non-Transferability

Coins:

- Cannot be transferred between accounts.
- Cannot be gifted.
- Cannot be traded.
- Cannot be sold.
- Cannot be exchanged for cash or other property unless expressly permitted by an official written policy.

---

## 7. Refund Policy

Except where required by applicable law or by the policies of the payment platform used, purchases of virtual coins are generally considered final.

Refund requests will be evaluated in accordance with applicable consumer protection laws and platform requirements.

---

## 8. Fraud Prevention

WelBuilt AI Solutions Pvt. Ltd. reserves the right to investigate activities that may involve:

- Payment fraud
- Chargebacks
- Unauthorized transactions
- Abuse of promotional offers
- Attempts to manipulate the virtual coin system

Accounts involved in fraudulent activities may be restricted or permanently terminated.

---

## 9. Changes to Coin Values

WelBuilt AI Solutions Pvt. Ltd. may update:

- Coin packages
- Prices
- Promotions
- Available features
- Redemption methods

Such changes will not affect completed transactions unless required by law.

---

## 10. Account Deletion

If a user permanently deletes their account:

- Remaining virtual coins may be forfeited.
- Unused promotional rewards may expire.
- Purchase history may be retained where legally required.

Account deletion does not automatically create eligibility for refunds.

---

## 11. Payment Disputes

Users who believe they were charged incorrectly should contact our support team promptly. Where necessary, we may request additional information to investigate the issue.

---

## 12. Taxes

Where applicable, taxes may be included in or added to the purchase price in accordance with local laws.

---

## 13. Future Features

This policy also applies to future virtual products introduced by Dangg, including but not limited to:

- Premium memberships
- Subscription plans
- Virtual gifts
- Event passes
- Digital upgrades

Additional feature-specific terms may be published if required.

---

## 14. Policy Updates

We may revise this Virtual Coin & Payment Policy from time to time. Material changes will be communicated through the application or other appropriate channels.

Continued use of Dangg after such changes constitutes acceptance of the updated policy.

---

## 15. Contact Us

If you have questions regarding payments or virtual coins, please contact us.

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
  {
    id: 'deletion',
    title: 'Account Deletion Policy',
    markdown: `# Account Deletion Policy

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

This Account Deletion Policy explains how users can permanently delete their Dangg account and what happens to their information after deletion.

Dangg is a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd.

By using Dangg, you agree to this Account Deletion Policy together with our Privacy Policy, Terms & Conditions, Community Guidelines, and other applicable policies.

---

## 1. Right to Delete Your Account

Users have the right to permanently delete their Dangg account at any time through the application.

Deleting your account is considered a permanent action. Before proceeding, please review this policy carefully to understand how your information will be handled.

---

## 2. How to Delete Your Account

Users can permanently delete their account directly from their profile page within the Dangg application.

To delete your account:

1. Open the Dangg application.
2. Navigate to your Profile page.
3. Tap the **Delete Account** button.
4. Review the confirmation message.
5. Confirm your deletion request.

Once confirmed, the account deletion process will begin in accordance with this policy.

---

## 3. Information That Will Be Deleted

When your account deletion request has been processed, the following information will be removed from our active systems or scheduled for deletion:

- Profile Information (Name, Bio)
- Profile Photos
- Uploaded Images
- Uploaded Videos

This information will no longer be accessible through the application.

---

## 4. Chat Messages

Chat messages associated with your account may be removed according to our data retention procedures.

However, certain chat records may be retained for a limited period where reasonably necessary for:

- Fraud prevention
- Abuse investigations
- Complaint handling
- Security monitoring
- Legal compliance
- Backup restoration

Such retained records are protected and are not retained for general platform use.

---

## 5. Virtual Coins

If you permanently delete your account:

- Any remaining Dangg Coins will be permanently forfeited.
- Promotional or bonus coins will also be forfeited.
- Account deletion does not entitle users to refunds or compensation for unused virtual coins unless required by applicable law.

Please review our Virtual Coin & Payment Policy for additional information.

---

## 6. Information That May Be Retained

Although your account is deleted, WelBuilt AI Solutions Pvt. Ltd. may retain certain information for a limited period where necessary to:

- Comply with applicable laws.
- Resolve disputes.
- Prevent fraud.
- Investigate abuse.
- Protect platform security.
- Restore system backups.
- Maintain platform integrity.

In addition, records relating to complaints, abuse reports, moderation actions, or legal investigations may be retained where reasonably necessary to investigate misconduct, comply with legal obligations, or protect the rights, safety, and security of users and the platform.

Any retained information will be handled in accordance with our Privacy Policy.

---

## 7. Account Recovery

Once an account deletion request has been fully processed, the deleted account cannot be restored.

If you choose to register again after deleting your account, it will be treated as a completely new account. Previously associated profile information, conversations, uploaded media, virtual coins, and other account-related data may not be recoverable.

---

## 8. User Responsibilities Before Deleting an Account

Before permanently deleting your account, you should ensure that you:

- Understand that account deletion is permanent.
- Understand that any remaining virtual coins will be forfeited.
- No longer require access to your conversations or uploaded content.
- Have reviewed all applicable Dangg policies.

---

## 9. Changes to This Policy

WelBuilt AI Solutions Pvt. Ltd. may update this Account Deletion Policy from time to time. Where significant changes are made, users will be notified through the Dangg application or other appropriate communication channels.

Continued use of Dangg after such updates constitutes acceptance of the revised policy.

---

## 10. Contact Us

If you have any questions regarding this Account Deletion Policy or require assistance with deleting your account, please contact us.

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
  {
    id: 'safety',
    title: 'Safety & Reporting Policy',
    markdown: `# Safety & Reporting Policy

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

This Safety & Reporting Policy explains how Dangg promotes user safety, handles complaints, and investigates reports of misconduct on the platform.

Dangg is a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd.

This policy should be read together with our Privacy Policy, Terms & Conditions, Community Guidelines, and other applicable policies.

---

## 1. Our Commitment to Safety

Dangg is committed to providing a respectful, safe, and welcoming environment for all users.

While we work to reduce harmful behaviour through moderation and platform policies, no online platform can guarantee that every interaction will always be safe. Users are encouraged to exercise good judgment when communicating with others.

---

## 2. Reporting a User

If you believe another user has violated our policies or engaged in inappropriate behaviour, you may submit a complaint through the in-app complaint system.

Reports may relate to, including but not limited to:

- Harassment
- Abuse
- Hate speech
- Fake profiles
- Spam
- Fraud or scams
- Inappropriate content
- Impersonation
- Threats
- Any violation of our Community Guidelines or Terms & Conditions

---

## 3. Review Process

Every complaint is reviewed individually by the Dangg moderation team.

When assessing a report, we may consider:

- Information provided by the reporting user.
- Chat records where available.
- Uploaded media where relevant.
- Previous violations associated with the reported account.
- Other available evidence.

Submitting a report does not guarantee that action will be taken. Decisions are based on the available evidence and applicable platform policies.

---

## 4. Moderation Actions

Where appropriate, Dangg may take one or more of the following actions:

- Issue a warning.
- Restrict account functionality.
- Remove content that violates our policies.
- Temporarily suspend an account.
- Permanently terminate an account.
- Take any other reasonable moderation action necessary to protect users and the platform.

---

## 5. False Reports

Users must not intentionally submit false, misleading, or malicious complaints.

Knowingly abusing the reporting system may itself result in moderation action against the reporting account.

---

## 6. User Safety Responsibilities

Users are responsible for protecting their own safety while using Dangg.

We encourage users to:

- Avoid sharing sensitive personal information.
- Exercise caution when communicating with unknown individuals.
- Verify information before placing trust in another user.
- Immediately report suspicious behaviour.

---

## 7. Meeting Offline

If users choose to meet in person after interacting on Dangg, they do so entirely at their own discretion and risk.

For your safety, consider:

- Meeting in a public place.
- Informing a trusted friend or family member.
- Arranging your own transportation.
- Leaving immediately if you feel uncomfortable.

Dangg is not responsible for events occurring during offline meetings between users.

---

## 8. Scams and Fraud

Users should remain alert to scams, requests for money, impersonation, or other fraudulent activities.

Never send money or share financial information with individuals you do not know or trust.

If you suspect fraudulent activity, report it immediately using the in-app complaint system.

---

## 9. Emergency Situations

Dangg is not an emergency service.

If you believe you or another person is in immediate danger, contact your local emergency services or law enforcement without delay.

---

## 10. Cooperation with Authorities

Where required by applicable law, court order, or lawful request from competent authorities, WelBuilt AI Solutions Pvt. Ltd. may cooperate with law enforcement agencies and provide information as permitted by law.

---

## 11. Retention of Complaint Records

To investigate reports, resolve disputes, prevent fraud, and comply with legal obligations, Dangg may retain complaint records, moderation decisions, and related evidence for a reasonable period, even if an account has been deleted.

Such information is handled in accordance with our Privacy Policy.

---

## 12. Policy Updates

WelBuilt AI Solutions Pvt. Ltd. may revise this Safety & Reporting Policy from time to time.

Material changes may be communicated through the Dangg application or other appropriate channels.

Continued use of Dangg after such updates constitutes acceptance of the revised policy.

---

## 13. Contact Us

If you have questions regarding this Safety & Reporting Policy or wish to raise concerns about user safety, please contact us.

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
  {
    id: 'copyright',
    title: 'Copyright & Intellectual Property Policy',
    markdown: `# Copyright & Intellectual Property

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

This Copyright & Intellectual Property Policy outlines the ownership and protection of intellectual property rights associated with Dangg.

Dangg is a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd.

By using Dangg, you agree to respect the intellectual property rights described in this policy together with our Terms & Conditions and other applicable legal documents.

---

## 1. Ownership of Dangg IP

All intellectual property rights in Dangg, including but not limited to the application name, logo, brand elements, tagline, software code, design, graphics, user interface, and underlying technology, are owned by WelBuilt AI Solutions Pvt. Ltd.

Dangg is developed by Spark AI, the software development brand of WelBuilt AI Solutions Pvt. Ltd.

Nothing in any Dangg policy or agreement transfers ownership of any intellectual property to users.

---

## 2. Trademarks

The name "Dangg", the Dangg logo, the tagline "Talk with Love", and all related branding elements are proprietary trademarks or brand assets of WelBuilt AI Solutions Pvt. Ltd.

Users may not use these trademarks or brand assets without prior written permission from WelBuilt AI Solutions Pvt. Ltd.

---

## 3. User Content

Users retain ownership of the content they upload to Dangg, including profile information, messages, images, and videos. By uploading content, users grant WelBuilt AI Solutions Pvt. Ltd. a limited, non-exclusive, royalty-free license to store, display, and process such content solely for operating and improving the platform.

Users represent that their content does not infringe upon the intellectual property rights of any third party.

For further details regarding user content, please refer to Section 7 of our Terms & Conditions.

---

## 4. Prohibited Uses

Users must not:

- Copy, reproduce, or redistribute any part of the Dangg application or its content without authorization.
- Modify, adapt, or create derivative works based on Dangg.
- Reverse engineer, decompile, or disassemble the application.
- Use Dangg's name, logo, or branding in a way that suggests affiliation or endorsement without written permission.
- Scrape, extract, or harvest data from Dangg for any unauthorized purpose.

---

## 5. Copyright Infringement

WelBuilt AI Solutions Pvt. Ltd. respects the intellectual property rights of others. If you believe that your copyrighted work has been reproduced or distributed on Dangg in a way that constitutes copyright infringement, please contact us with the following information:

- A description of the copyrighted work you claim has been infringed.
- A description of where the infringing material is located within the application.
- Your contact information.
- A statement that you believe in good faith that the use is not authorized by the copyright owner.
- A statement that the information in your notice is accurate.

Reports of copyright infringement may be sent to support@dangg.app.

---

## 6. Repeat Infringers

WelBuilt AI Solutions Pvt. Ltd. may terminate the accounts of users who are determined to be repeat infringers of intellectual property rights.

---

## 7. Policy Updates

WelBuilt AI Solutions Pvt. Ltd. may update this Copyright & Intellectual Property Policy from time to time. Material changes will be communicated through the application or other appropriate channels.

Continued use of Dangg after such updates constitutes acceptance of the revised policy.

---

## 8. Contact Us

If you have questions regarding this Copyright & Intellectual Property Policy or wish to report a potential infringement, please contact us.

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
  {
    id: 'disclaimer',
    title: 'Disclaimer',
    markdown: `# Disclaimer

**Version:** 1.0

**Effective Date:** [Launch Date]

**Last Updated:** 21 July 2026

This Disclaimer governs the use of Dangg and limits the liability of WelBuilt AI Solutions Pvt. Ltd.

Dangg is a dating and friendship platform developed by Spark AI (the software development brand of WelBuilt AI Solutions Pvt. Ltd.) and owned, operated, and published by WelBuilt AI Solutions Pvt. Ltd.

By using Dangg, you acknowledge and accept the limitations and disclaimers set out in this document. This Disclaimer should be read together with our Terms & Conditions and other applicable policies.

---

## 1. General Disclaimer

Dangg provides a platform that enables users to connect with one another for dating and friendship purposes. The service is provided on an "as is" and "as available" basis.

WelBuilt AI Solutions Pvt. Ltd. makes no representations or warranties of any kind, express or implied, regarding the operation, availability, or functionality of the platform.

---

## 2. No Guarantee of User Authenticity

WelBuilt AI Solutions Pvt. Ltd. does not guarantee the authenticity, accuracy, or truthfulness of any user's profile, identity, or intentions. Users are solely responsible for evaluating the trustworthiness of other users.

---

## 3. No Guarantee of Relationship Outcomes

Dangg provides a platform for connection but does not guarantee:

- The success of any friendship, relationship, or interaction.
- Compatibility between users.
- That any user will find a match or meaningful connection.

---

## 4. No Warranty of Uninterrupted Service

While WelBuilt AI Solutions Pvt. Ltd. strives to provide a reliable service, we do not warrant that Dangg will be uninterrupted, timely, secure, or error-free. The platform may be temporarily unavailable due to maintenance, technical issues, or events beyond our reasonable control.

---

## 5. User Conduct

WelBuilt AI Solutions Pvt. Ltd. is not responsible for the conduct of any user, whether online or offline. Users assume all risk associated with their interactions, including meeting other users in person.

---

## 6. Third-Party Content and Services

Dangg may provide access to third-party services or contain links to third-party platforms. WelBuilt AI Solutions Pvt. Ltd. is not responsible for the content, practices, or policies of any third-party service.

---

## 7. Limitation of Liability

To the maximum extent permitted by applicable law, WelBuilt AI Solutions Pvt. Ltd. shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to the use of Dangg, including but not limited to:

- User disputes.
- Loss of personal relationships.
- User-generated content.
- Unauthorized user behavior.
- Loss of data or profits.

Nothing in this Disclaimer excludes or limits liability that cannot be excluded or limited under applicable law.

---

## 8. No Professional Advice

Dangg does not provide professional advice of any kind, including legal, medical, psychological, or financial advice. Users should seek appropriate professional guidance for any concerns.

---

## 9. Jurisdiction

This Disclaimer shall be governed by and interpreted in accordance with the laws of the Republic of India. Any disputes shall be subject to the jurisdiction of the competent courts in Mumbai, India.

---

## 10. Policy Updates

WelBuilt AI Solutions Pvt. Ltd. may update this Disclaimer from time to time. Material changes will be communicated through the application or other appropriate channels.

Continued use of Dangg after such updates constitutes acceptance of the revised Disclaimer.

---

## 11. Contact Us

If you have questions regarding this Disclaimer, please contact us.

**Company:** WelBuilt AI Solutions Pvt. Ltd.

**Development Brand:** Spark AI

**Application:** Dangg

**Email:** support@dangg.app

**Website:** https://dangg.app`,
  },
];

const BY_ID: Record<PolicyId, Policy> = POLICIES.reduce(
  (acc, p) => {
    acc[p.id] = p;
    return acc;
  },
  {} as Record<PolicyId, Policy>,
);

export function getPolicy(id: PolicyId): Policy {
  return BY_ID[id];
}
