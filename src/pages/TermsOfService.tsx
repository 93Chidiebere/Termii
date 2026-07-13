import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const TermsOfService = () => {
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 text-foreground">
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">Last updated: July 10, 2026</p>

        <p className="mb-4">Welcome to Isi Ngala. By creating an account or using our platform, you agree to be bound by these Terms of Service ("Terms"). Please read them carefully. If you do not agree to these Terms, do not use Isi Ngala.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">1. About Isi Ngala</h2>
        <p>Isi Ngala is a social community platform for people who celebrate African natural hair. It allows users to share content, connect with others, and buy and sell hair care products. The platform is operated by Isi Ngala and is accessible at isingala.com and via our Android application.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">2. Eligibility</h2>
        <ul className="space-y-1 list-disc pl-5 mb-4">
          <li>You must be at least 13 years old to create an account</li>
          <li>You must be at least 16 years old to access the Marketplace and direct Messages features</li>
          <li>By registering, you confirm that the information you provide is accurate, including your date of birth</li>
          <li>If you are under 18, you confirm you have your parent or guardian's permission to use Isi Ngala</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">3. Your Account</h2>
        <ul className="space-y-1 list-disc pl-5 mb-4">
          <li>You are responsible for keeping your password secure and for all activity under your account</li>
          <li>You may not share your account with others or create accounts on behalf of third parties without permission</li>
          <li>You may not create more than one personal account</li>
          <li>Notify us immediately at support@isingala.com if you suspect unauthorised access to your account</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">4. Acceptable Use</h2>
        <p className="mb-2">You agree not to use Isi Ngala to:</p>
        <ul className="space-y-1 list-disc pl-5 mb-4">
          <li>Post content that is illegal, harmful, threatening, abusive, defamatory, or discriminatory</li>
          <li>Harass, bully, or intimidate other users</li>
          <li>Post sexually explicit content or content that sexualises minors in any way</li>
          <li>Share false or misleading information</li>
          <li>Impersonate any person or entity</li>
          <li>Spam, advertise unsolicited products, or engage in phishing</li>
          <li>Upload malware, viruses, or any harmful code</li>
          <li>Scrape, crawl, or collect data from the platform without our written permission</li>
          <li>Attempt to gain unauthorised access to any part of our systems</li>
          <li>Violate any applicable law or regulation, including Nigerian law and the Nigeria Data Protection Act 2023</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">5. Content Ownership and Licence</h2>
        <p className="mb-2">You retain ownership of the content you post on Isi Ngala. By posting content, you grant Isi Ngala a non-exclusive, royalty-free, worldwide licence to display, distribute, and promote your content in connection with operating the platform.</p>
        <p>You confirm that you have the right to post any content you share, and that it does not infringe the intellectual property rights of others.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">6. Content Moderation</h2>
        <p className="mb-2">We reserve the right to remove any content that violates these Terms or our Community Guidelines, without notice. We may suspend or terminate accounts that repeatedly violate our policies.</p>
        <p>To report content or a user, use the report feature within the app or contact us at support@isingala.com.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">7. Marketplace</h2>
        <ul className="space-y-1 list-disc pl-5 mb-4">
          <li>Only approved sellers may list products for sale. Seller approval requires an application, identity verification, and a non-refundable application fee (₦25,000 for individuals, ₦100,000 for corporate entities)</li>
          <li>Sellers must accurately describe their products. Counterfeit, prohibited, or illegal products are not permitted</li>
          <li>All transactions are processed through our Paystack-powered escrow system. Funds are held until the buyer confirms delivery</li>
          <li>Isi Ngala charges a 10% commission on completed sales, deducted automatically at the point of payout</li>
          <li>Buyers should confirm delivery only when they have physically received their order in satisfactory condition. Once delivery is confirmed, the transaction is final</li>
          <li>Disputes should be raised with us at support@isingala.com within 7 days of a delivery confirmation</li>
          <li>Isi Ngala is not responsible for the quality, safety, or legality of products listed on the platform. Sellers are solely responsible for their products</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">8. Payments and Refunds</h2>
        <ul className="space-y-1 list-disc pl-5 mb-4">
          <li>All prices on the Marketplace are in Nigerian Naira (₦) unless otherwise stated</li>
          <li>Payments are processed securely by Paystack. Isi Ngala does not store card details</li>
          <li>Seller application fees are non-refundable under any circumstances</li>
          <li>In cases of confirmed fraud or item not received, Isi Ngala may issue a refund at our discretion after investigation</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">9. Intellectual Property</h2>
        <p>The Isi Ngala name, logo, platform design, and all associated intellectual property are owned by Isi Ngala. You may not use our name, logo, or brand assets without our written permission.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">10. Disclaimers</h2>
        <ul className="space-y-1 list-disc pl-5 mb-4">
          <li>Isi Ngala is provided "as is" without warranties of any kind</li>
          <li>We do not guarantee that the platform will be uninterrupted, error-free, or free from harmful content</li>
          <li>Hair care advice shared by users is not professional medical or dermatological advice. Always consult a qualified professional for medical concerns</li>
          <li>Isi Ngala is not liable for any loss or damage arising from your use of the platform or reliance on user-generated content</li>
        </ul>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">11. Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, Isi Ngala shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of or inability to use the platform.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">12. Account Termination</h2>
        <p className="mb-2">We may suspend or terminate your account at any time for violating these Terms, with or without notice. You may delete your account at any time through your Profile settings.</p>
        <p>Upon termination, your right to use the platform ceases immediately. Content you have posted may remain visible at our discretion.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">13. Governing Law</h2>
        <p>These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising from these Terms or your use of Isi Ngala shall be subject to the jurisdiction of Nigerian courts.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">14. Changes to These Terms</h2>
        <p>We may update these Terms from time to time. We will notify you of significant changes through the platform. Your continued use of Isi Ngala after changes are posted constitutes your acceptance of the updated Terms.</p>

        <h2 className="font-display text-xl font-semibold text-foreground mt-8 mb-3">15. Contact</h2>
        <p>For any questions about these Terms, contact us at:</p>
        <ul className="space-y-1 list-disc pl-5 mb-4">
          <li>Email: <strong>support@isingala.com</strong></li>
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

export default TermsOfService;