import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, MapPin, MessageCircle, Users } from "lucide-react";
import { AuthAwareCta } from "@/components/auth-aware-cta";
import { PublicPageShell } from "@/components/public-page-shell";
import { StructuredData } from "@/components/structured-data";
import { absoluteUrl, SITE_URL } from "@/lib/seo";
import { editablePageMetadata, getPublicContent } from "@/lib/site-content";
import { getViewer } from "@/lib/viewer";

export const revalidate = 60;

export const generateMetadata = () => editablePageMetadata("about", "About Gevorg Galstyan", "Meet Gevorg Galstyan, founder and host of Galstyan’s Speaking Club — an English conversation community in Sergiev Posad.", "/about");

export default async function AboutPage() {
  const [content, viewer] = await Promise.all([getPublicContent(), getViewer()]);
  const hostName = content["about.host.name"] || "Gevorg Galstyan";
  const hostLocation = content["about.host.location"] || "I’m from Yerevan, Armenia 🇦🇲 and currently live in Sergiev Posad.";
  const hostBio = (content["about.host.bio"] || "My name is Gevorg Galstyan, and I’m the host of Galstyan’s Speaking Club.\n\nI’ve been studying English for years, and I genuinely love the people, conversations, confidence, and atmosphere that come with using a language together.\n\nThat’s why I created Galstyan’s Speaking Club: a welcoming place in Sergiev Posad to practise spoken English and build community through real conversation.\n\nCome join us, practise English with real people, meet new friends, and don’t worry about your level.\n\nYou don’t need perfect English to start.\n\nEven my English is not native-level, and I still make mistakes. But I understand native speakers well and can express myself confidently.\n\nPractice makes perfect.").split(/\n\n+/);
  const requestedPhoto = content["about.host.photo"] || "/gevorg-galstyan-host.jpg";
  const hostPhoto = requestedPhoto.startsWith("/") || requestedPhoto.startsWith("https://vmvsxxtaqtvaotrooafq.supabase.co/storage/v1/object/public/site-media/") ? requestedPhoto : "/gevorg-galstyan-host.jpg";
  return (
    <>
    <PublicPageShell
      eyebrow="About the club"
      title={content["about.hero.title"] || "A local English-speaking community in Sergiev Posad"}
      intro={content["about.intro"] || "Galstyan’s Speaking Club is a welcoming place to practice spoken English, meet people, and build confidence through real conversation."}
      breadcrumbLabel="About"
      breadcrumbPath="/about"
    >
      <section className="section public-section public-story">
        <div>
          <span className="eyebrow">Why GSC exists</span>
          <h2>English gets easier when you <em>use it.</em></h2>
        </div>
        <div className="public-copy">
          <p>GSC is for people in Sergiev Posad who want more than a textbook exercise. The club creates a reason to speak: interesting questions, a small group, and a friendly atmosphere where mistakes are part of learning.</p>
          <p>The club is English-first and community-minded. You can come to practice, meet new people, or simply give your English a place in everyday life.</p>
          <Link className="text-link public-inline-link" href="/meetups">See how meetups work <ArrowRight /></Link>
        </div>
      </section>

      <section className="section host-profile-section" aria-labelledby="host-profile-heading">
        <div className="host-profile">
          <figure className="host-photo-frame">
            <Image
              src={hostPhoto}
              alt={content["about.host.photo_alt"] || "Gevorg Galstyan, host of Galstyan’s Speaking Club"}
              fill
              sizes="(max-width: 900px) calc(100vw - 44px), (max-width: 1440px) 42vw, 560px"
            />
            <div className="host-photo-caption" aria-hidden="true"><strong>{hostName}</strong><span>Club host</span></div>
          </figure>

          <div className="host-profile-copy">
            <span className="eyebrow">Meet the host</span>
            <h2 id="host-profile-heading">Meet <em>Gevorg Galstyan.</em></h2>
            <div className="host-profile-text">
              {hostBio[0] && <p>{hostBio[0]}</p>}
              {hostLocation && <p>{hostLocation}</p>}
              {hostBio.slice(1).map((paragraph, index) => <p className={index === hostBio.length - 2 ? "host-profile-closing" : undefined} key={`${index}:${paragraph}`}>{paragraph}</p>)}
            </div>
            <div className="public-actions">
              <AuthAwareCta kind="join" role={viewer.role} loggedOutLabel={content["about.host.cta"] || "Join the club"} loggedOutHref={content["about.host.cta_url"] || "/?auth=register"} />
              <Link className="button button-outline-dark" href="/meetups">Explore meetups <ArrowRight /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section public-section public-card-section">
        <div className="section-heading"><div><span className="eyebrow">The GSC way</span><h2>What you can expect.</h2></div><p>Simple principles keep the conversation open, useful, and human.</p></div>
        <div className="public-card-grid">
          <article><Users /><h3>Small-group connection</h3><p>The public meetup concept is intentionally small so there is room for everyone to speak and listen.</p></article>
          <article><MessageCircle /><h3>Real spoken English</h3><p>Conversation prompts help people move from overthinking to participating in a natural English conversation.</p></article>
          <article><Check /><h3>No judgment</h3><p>Accents, pauses, and mistakes are welcome. Progress matters more than sounding perfect.</p></article>
        </div>
      </section>

      <section className="section public-section location-panel">
        <div><MapPin /><div><span className="eyebrow">Local by design</span><h2>Based in <em>Sergiev Posad.</em></h2><p>Galstyan’s Speaking Club is based in Sergiev Posad, Moscow Region. The exact meetup venue is shared when a session is published.</p></div></div>
        <aside className="language-note" lang="ru"><strong>Коротко по-русски:</strong> Galstyan’s Speaking Club — разговорный клуб английского языка в Сергиевом Посаде для живой практики и общения.</aside>
      </section>
    </PublicPageShell>
    <StructuredData data={{
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${SITE_URL}/about/#gevorg-galstyan`,
      name: "Gevorg Galstyan",
      url: absoluteUrl("/about/"),
      image: absoluteUrl(hostPhoto),
      jobTitle: "Host of Galstyan’s Speaking Club",
      worksFor: { "@id": `${SITE_URL}/#organization` },
      homeLocation: { "@type": "City", name: "Sergiev Posad" },
    }} />
    </>
  );
}
