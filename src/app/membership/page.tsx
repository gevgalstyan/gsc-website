import { Award, CalendarCheck, CircleUserRound, Heart, LockKeyhole, Sparkles } from "lucide-react";
import { PublicPageShell } from "@/components/public-page-shell";
import { AuthAwareCta } from "@/components/auth-aware-cta";
import { editablePageMetadata, getPublicContent } from "@/lib/site-content";
import { getViewer } from "@/lib/viewer";

export const revalidate = 60;

export const generateMetadata = () => editablePageMetadata("membership", "GSC Membership and Loyalty", "See what Galstyan’s Speaking Club member access currently supports: profiles, attendance, question progress, favorites, and qualifying-visit rewards.", "/membership");

export default async function MembershipPage() {
  const [content, viewer] = await Promise.all([getPublicContent(), getViewer()]);
  return <PublicPageShell eyebrow="Membership" title={content["membership.hero.title"] || "A member space that keeps your progress close"} intro={content["membership.intro"] || "Keep your profile, question progress, favorites, bookings, attendance and rewards together."} breadcrumbLabel="Membership" breadcrumbPath="/membership">
    <section className="section public-section membership-grid-section"><div><span className="eyebrow">Your member account</span><h2>Keep the useful parts of GSC <em>together.</em></h2></div><div className="membership-feature-list"><article><CircleUserRound /><div><h3>Profile</h3><p>Manage your display name, profile photo, and Telegram username in the protected member space.</p></div></article><article><CalendarCheck /><div><h3>Bookings and attendance</h3><p>See your confirmed bookings and the attendance recorded by the club.</p></div></article><article><Heart /><div><h3>Questions and favorites</h3><p>Explore the question library, save favorites and continue your practice across devices with the same account.</p></div></article><article><Award /><div><h3>Achievements and rewards</h3><p>Track qualifying visits and available rewards, including a free meetup after six qualifying paid visits.</p></div></article></div></section>
    <section className="section public-section loyalty-explainer"><div className="loyalty-explainer-copy"><span className="eyebrow">Your loyalty reward</span><h2>Six qualifying visits. <em>One reward.</em></h2><p>Six visits recorded as attended and paid qualify for one free-meetup reward. Track your progress and available rewards in your account.</p><AuthAwareCta kind="profile" role={viewer.role} /></div><div className="loyalty-rule-card"><Sparkles /><strong>Current reward rule</strong><span>6 paid qualifying visits</span><i>↓</i><span>1 free meetup reward</span></div></section>
    <section className="section public-section membership-status-section"><div className="membership-status-card available"><LockKeyhole /><div><span className="eyebrow">Available now</span><h2>Profile, progress, attendance, and rewards.</h2><p>Use your account to manage bookings, review attendance and follow your progress.</p></div></div><div className="membership-status-card future"><Award /><div><span className="eyebrow">Not currently offered</span><h2>Bronze, Silver, Gold, and Founding Legend tiers.</h2><p>Named membership tiers and QR check-in are not currently offered. The club records attendance, and your account shows the rewards available to you.</p></div></div></section>
  </PublicPageShell>;
}
