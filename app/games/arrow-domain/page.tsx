"use client";

import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";
import ArrowDomainGame from "@/components/ArrowDomainGame";
import styles from "./page.module.css";

export default function ArrowDomainPage() {
  const { t } = useI18n();

  return (
    <section className={styles.wrap}>
      <div className={styles.headRow}>
        <div>
          <p>{t("arrowPage.featured")}</p>
          <h1>{t("arrowPage.title")}</h1>
        </div>
        <Link href="/" className={styles.backLink}>
          {t("arrowPage.back")}
        </Link>
      </div>
      <ArrowDomainGame />
    </section>
  );
}
