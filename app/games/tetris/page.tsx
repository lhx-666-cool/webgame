"use client";

import Link from "next/link";
import { useI18n } from "@/components/LanguageProvider";
import TetrisGame from "@/components/TetrisGame";
import styles from "./page.module.css";

export default function TetrisPage() {
  const { t } = useI18n();

  return (
    <section className={styles.wrap}>
      <div className={styles.headRow}>
        <div>
          <p>{t("tetrisPage.featured")}</p>
          <h1>{t("tetrisPage.title")}</h1>
        </div>
        <Link href="/" className={styles.backLink}>
          {t("tetrisPage.back")}
        </Link>
      </div>
      <TetrisGame />
    </section>
  );
}
