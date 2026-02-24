"use client";

import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";
import SpinPuzzleGame from "@/components/SpinPuzzleGame";
import styles from "./page.module.css";

export default function RotateSumPage() {
  const { t } = useI18n();

  return (
    <section className={styles.wrap}>
      <div className={styles.headRow}>
        <div>
          <p>{t("spinPage.featured")}</p>
          <h1>{t("spinPage.title")}</h1>
        </div>
        <Link href="/" className={styles.backLink}>
          {t("spinPage.back")}
        </Link>
      </div>
      <SpinPuzzleGame />
    </section>
  );
}
