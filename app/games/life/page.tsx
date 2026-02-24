"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useI18n } from "@/components/LanguageProvider";
import LifeGame from "@/components/LifeGame";
import styles from "./page.module.css";

export default function LifeGamePage() {
  const { t } = useI18n();

  return (
    <section className={styles.wrap}>
      <div className={styles.headRow}>
        <div>
          <p>{t("lifePage.featured")}</p>
          <h1>{t("lifePage.title")}</h1>
        </div>
        <Link href="/" className={styles.backLink}>
          {t("lifePage.back")}
        </Link>
      </div>
      <Suspense fallback={<p>{t("life.messages.initial")}</p>}>
        <LifeGame />
      </Suspense>
    </section>
  );
}
