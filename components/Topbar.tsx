"use client";

import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";
import type { Locale } from "@/lib/i18n";

export default function Topbar() {
  const { locale, locales, localeLabels, setLocale, t } = useI18n();

  return (
    <header className="topbar">
      <Link href="/" className="brand">
        {t("app.brand")}
      </Link>

      <nav className="top-actions">
        <Link href="/games/life" className="top-link">
          {t("app.navPlayLife")}
        </Link>
        <Link href="/games/tetris" className="top-link">
          {t("app.navPlayTetris")}
        </Link>
        <Link href="/games/rotate-sum" className="top-link">
          {t("app.navPlaySpin")}
        </Link>
        <Link href="/games/arrow-domain" className="top-link">
          {t("app.navPlayArrow")}
        </Link>

        <label className="lang-control" htmlFor="lang-picker">
          <span>{t("app.language")}</span>
          <select
            id="lang-picker"
            className="lang-select"
            value={locale}
            onChange={(event) => setLocale(event.target.value as Locale)}
          >
            {locales.map((code) => (
              <option key={code} value={code}>
                {localeLabels[code]}
              </option>
            ))}
          </select>
        </label>
      </nav>
    </header>
  );
}
