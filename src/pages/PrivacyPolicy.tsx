import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto flex items-center gap-4 px-4 sm:px-6 h-16">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to Isi Ngala
          </Link>
          <span className="font-display text-base font-bold text-foreground">Isi Ngala</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 prose prose-sm sm:prose max-w-none text-foreground">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: July 10, 2026</p>

        <p>Isi Ngala ("we", "our", or "us") operates the Isi Ngala platform available at <strong>isingala.com</strong> and the Isi Ngala Android application. This Privacy Policy explains how we collect, use, and protect your personal information when you use our services.</p>

        <p>By using Isi Ngala, you agree to the collection and use of information in accordance with this policy. If you do not agree, please do not use our services.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">1. Information We Collect</h2>

        <h3 className="font-semibold text-foreground mt-5 mb-2">1.1 Information You Provide Directly</h3>
        <ul className="space-y-1 text-foreground list-disc pl-5">
          <li><strong>Account information:</strong> Full name, username, email address, and password when you register</li>
          <li><strong>Date of birth:</strong> Collected to verify age eligibility for certain features (Marketplace, Messages)</li>
          <li><strong>Hair profile:</strong> Hair type, porosity, density, pattern, length, goals, and treatments — used to personalise your experience and match you with Hair Twins</li>
          <li><strong>Profile content:</strong> Profile photo, biography, and other information you choose to add to your profile</li>
          <li><strong>User-generated content:</strong> Posts, photos, videos, comments, replies, and messages you create or send</li>
          <li><strong>Seller information:</strong> For users who apply to sell on the Marketplace — bank account details (account name, bank code, account number), business name, CAC registration number, TIN, NIN or BVN, phone number, and address. NIN/BVN data is used solely for identity verification and is deleted after your application is reviewed</li>
          <li><strong>Payment information:</strong> Payment transactions are processed by Paystack. We do not store your card details. We retain transaction records including amounts, references, and timestamps</li>
          <li><strong>Location:</strong> Country and state/province provided during registration. We do not access your device's GPS location</li>
          <li><strong>Communications:</strong> Direct messages you send to other users through our platform</li>
        </ul>

        <h3 className="font-semibold text-foreground mt-5 mb-2">1.2 Information Collected Automatically</h3>
        <ul className="space-y-1 text-foreground list-disc pl-5">
          <li><strong>Usage data:</strong> Pages visited, features used, time spent on the platform, and interactions with content</li>
          <li><strong>Device information:</strong> Browser type, operating system, and device type</li>
          <li><strong>Push notification tokens:</strong> If you grant permission, we store your device's push subscription to send you notifications</li>
          <li><strong>Analytics data:</strong> We use Google Analytics (GA4) to understand how users interact with the platform. This may include anonymised IP addresses and session data</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">2. How We Use Your Information</h2>
        <ul className="space-y-1 text-foreground list-disc pl-5">
          <li>To create and manage your account</li>
          <li>To provide, personalise, and improve the Isi Ngala platform</li>
          <li>To match you with Hair Twins based on your hair profile</li>
          <li>To process seller applications and marketplace transactions</li>
          <li>To facilitate secure payments and escrow services via Paystack</li>
          <li>To send you notifications about activity relevant to your account (likes, comments, mentions, messages, orders)</li>
          <li>To enforce our Terms of Service and Community Guidelines</li>
          <li>To prevent fraud, abuse, and other harmful activity</li>
          <li>To comply with legal obligations</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">3. How We Share Your Information</h2>
        <p>We do not sell your personal data to third parties. We share information only in the following circumstances:</p>
        <ul className="space-y-1 text-foreground list-disc pl-5">
          <li><strong>Other users:</strong> Your profile information, posts, comments, and public activity are visible to other Isi Ngala users</li>
          <li><strong>Paystack:</strong> Payment information is shared with Paystack (our payment processor) to process transactions. Paystack's privacy policy is available at paystack.com/privacy</li>
          <li><strong>Cloudinary:</strong> Media files you upload (photos, videos) are stored and served via Cloudinary. Their privacy policy is available at cloudinary.com/privacy</li>
          <li><strong>Google Analytics:</strong> Anonymised usage data is shared with Google for analytics purposes</li>
          <li><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or to protect the rights and safety of our users or the public</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">4. Data Retention</h2>
        <p>We retain your personal data for as long as your account is active. If you delete your account, we will delete your personal data within 30 days, except where we are required by law to retain it longer. Seller application data (including NIN/BVN) is deleted within 7 days of a review decision being made.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="space-y-1 text-foreground list-disc pl-5">
          <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
          <li><strong>Correction:</strong> Update or correct inaccurate information through your Profile settings</li>
          <li><strong>Deletion:</strong> Request deletion of your account and associated personal data</li>
          <li><strong>Opt out of notifications:</strong> Disable push notifications through your device settings at any time</li>
          <li><strong>Withdraw consent:</strong> Where processing is based on consent, you may withdraw it at any time</li>
        </ul>
        <p>To exercise any of these rights, contact us at <strong>privacy@isingala.com</strong></p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">6. Children's Privacy</h2>
        <p>Isi Ngala is not directed at children under the age of 13. Users under 16 have restricted access to certain features (Marketplace and direct Messages). We do not knowingly collect personal data from children under 13. If you believe a child under 13 has provided us with personal data, please contact us and we will delete it promptly.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">7. Security</h2>
        <p>We implement appropriate technical and organisational security measures to protect your personal data, including encrypted data transmission (HTTPS), secure password hashing, and JWT-based authentication. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">8. Cookies and Tracking</h2>
        <p>Isi Ngala uses browser localStorage to store your authentication session. We use Google Analytics which may set cookies for analytics purposes. We do not use advertising cookies or sell data to advertisers.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">9. International Data Transfers</h2>
        <p>Isi Ngala is operated from Nigeria. Your data may be processed and stored on servers located outside your country of residence (including servers operated by Railway, Vercel, and Cloudinary). By using our services, you consent to this transfer.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">10. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on the platform. Your continued use of Isi Ngala after changes are posted constitutes your acceptance of the updated policy.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">11. Contact Us</h2>
        <p>If you have any questions about this Privacy Policy or how we handle your data, please contact us:</p>
        <ul className="space-y-1 text-foreground list-disc pl-5">
          <li>Email: <strong>privacy@isingala.com</strong></li>
          <li>Website: <strong>isingala.com</strong></li>
        </ul>
      </main>

      <footer className="border-t border-border py-6 px-4 text-center">
        <p className="text-xs text-muted-foreground">© 2026 Isi Ngala. All rights reserved.</p>
        <div className="flex items-center justify-center gap-4 mt-2">
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link>
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;