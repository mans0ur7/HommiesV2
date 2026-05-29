import { forwardRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Instagram } from "lucide-react";
import hommiesLogo from "@/assets/hommies-logo.png";

interface FooterProps {}

const Footer = forwardRef<HTMLElement, FooterProps>((_, ref) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleScrollToSection = (path: string, sectionId: string) => {
    navigate(path);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const links = [
    { label: t("landing.footerAbout"), action: () => handleScrollToSection("/about", "about") },
    { label: t("landing.footerContact"), to: "/contact" },
    { label: t("landing.footerMoving"), to: "/flytteservice" },
    { label: t("landing.footerPrivacy"), to: "/privacy" },
  ];

  return (
    <footer
      ref={ref}
      className="hidden md:block bg-primary text-primary-foreground border-t border-primary-foreground/10"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-5 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center shrink-0">
          <img src={hommiesLogo} alt="Hommies" className="h-6" />
        </Link>

        {/* Links */}
        <nav className="flex items-center gap-5 lg:gap-7">
          {links.map((link, i) =>
            link.to ? (
              <Link
                key={i}
                to={link.to}
                className="text-xs lg:text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={link.action}
                className="text-xs lg:text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
              >
                {link.label}
              </button>
            )
          )}
        </nav>

        {/* Right: copyright + socials */}
        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden lg:inline text-xs text-primary-foreground/50">
            {t("landing.footerCopyright")} · CVR 43244590
          </span>
          <div className="flex items-center gap-3">
            <a
              href="https://www.instagram.com/hommies_dk/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://www.facebook.com/profile.php?id=61586080021799"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@hommies_dk"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = "Footer";

export default Footer;
