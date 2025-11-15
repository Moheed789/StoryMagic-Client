import { Link } from "wouter";
import { SiTiktok, SiInstagram, SiFacebook, SiYoutube } from "react-icons/si";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "TikTok",
      icon: SiTiktok,
      href: "https://tiktok.com",
      testId: "link-tiktok",
    },
    {
      name: "Instagram",
      icon: SiInstagram,
      href: "https://instagram.com",
      testId: "link-instagram",
    },
    {
      name: "Facebook",
      icon: SiFacebook,
      href: "https://facebook.com",
      testId: "link-facebook",
    },
    {
      name: "YouTube",
      icon: SiYoutube,
      href: "https://youtube.com",
      testId: "link-youtube",
    },
  ];

  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 data-testid="text-brand-name" className="text-lg font-display font-bold text-primary">StoryBloom</h3>
            <p data-testid="text-brand-tagline" className="text-sm text-muted-foreground font-story">
              Creating magical stories that bring imagination to life.
            </p>
          </div>

          {/* Links Section */}
          <div className="space-y-4">
            <h4 data-testid="heading-legal" className="text-sm font-semibold">Legal</h4>
            <div className="flex flex-col gap-2">
              <Link
                href="/terms"
                data-testid="link-terms"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="/privacy"
                data-testid="link-privacy"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>

          {/* Social Media Section */}
          <div className="space-y-4">
            <h4 data-testid="heading-follow" className="text-sm font-semibold">Follow Us</h4>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={social.testId}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t text-center">
          <p data-testid="text-copyright" className="text-sm text-muted-foreground">
            © {currentYear} StoryBloom. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}