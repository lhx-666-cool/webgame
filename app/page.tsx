"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/components/LanguageProvider";
import styles from "./home.module.css";

type GameCard = {
  id: string;
  href: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
};

const normalize = (value: string) => value.toLowerCase().replace(/\s+/g, "");

const fuzzyScore = (target: string, query: string) => {
  const cleanedQuery = normalize(query);
  if (!cleanedQuery) {
    return 1;
  }

  const cleanedTarget = normalize(target);

  if (cleanedTarget.includes(cleanedQuery)) {
    return 220 - cleanedTarget.indexOf(cleanedQuery);
  }

  let queryIndex = 0;
  let lastHit = -1;
  let spanPenalty = 0;

  for (let index = 0; index < cleanedTarget.length; index += 1) {
    if (cleanedTarget[index] !== cleanedQuery[queryIndex]) {
      continue;
    }

    if (lastHit >= 0) {
      spanPenalty += index - lastHit - 1;
    }

    lastHit = index;
    queryIndex += 1;

    if (queryIndex === cleanedQuery.length) {
      break;
    }
  }

  if (queryIndex !== cleanedQuery.length) {
    return 0;
  }

  return Math.max(10, 130 - spanPenalty * 2 - lastHit);
};

export default function HomePage() {
  const { t } = useI18n();
  const [query, setQuery] = useState("");

  const games = useMemo<GameCard[]>(
    () => [
      {
        id: "life",
        href: "/games/life",
        title: t("home.lifeTitle"),
        subtitle: t("home.lifeSubtitle"),
        description: t("home.lifeDescription"),
        tags: [
          t("home.tags.life.rule"),
          t("home.tags.life.pattern"),
          t("home.tags.life.share"),
          t("home.tags.life.shortcuts")
        ]
      },
      {
        id: "tetris",
        href: "/games/tetris",
        title: t("home.tetrisTitle"),
        subtitle: t("home.tetrisSubtitle"),
        description: t("home.tetrisDescription"),
        tags: [
          t("home.tags.tetris.classic"),
          t("home.tags.tetris.halfPhysics"),
          t("home.tags.tetris.fullPhysics"),
          t("home.tags.tetris.guide")
        ]
      },
      {
        id: "spin",
        href: "/games/rotate-sum",
        title: t("home.spinTitle"),
        subtitle: t("home.spinSubtitle"),
        description: t("home.spinDescription"),
        tags: [
          t("home.tags.spin.logic"),
          t("home.tags.spin.rotate"),
          t("home.tags.spin.solver"),
          t("home.tags.spin.difficulty")
        ]
      },
      {
        id: "arrow",
        href: "/games/arrow-domain",
        title: t("home.arrowTitle"),
        subtitle: t("home.arrowSubtitle"),
        description: t("home.arrowDescription"),
        tags: [
          t("home.tags.arrow.chain"),
          t("home.tags.arrow.eightDir"),
          t("home.tags.arrow.oneShot"),
          t("home.tags.arrow.difficulty")
        ]
      }
    ],
    [t]
  );

  const filtered = useMemo(() => {
    const keyword = query.trim();

    return games
      .map((game) => {
        const searchCorpus = [game.title, game.subtitle, game.description, ...game.tags].join(" ");
        const score = fuzzyScore(searchCorpus, keyword);
        return {
          ...game,
          score
        };
      })
      .filter((game) => game.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [games, query]);

  return (
    <section className={styles.wrap}>
      <div className={styles.hero}>
        <p className={styles.kicker}>{t("home.kicker")}</p>
        <h1>{t("home.title")}</h1>
        <p>{t("home.description")}</p>
      </div>

      <div className={styles.searchRow}>
        <label className={styles.searchLabel} htmlFor="game-search">
          {t("home.searchLabel")}
        </label>
        <input
          id="game-search"
          className={styles.searchInput}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("home.searchPlaceholder")}
        />
      </div>

      {filtered.length === 0 ? (
        <p className={styles.empty}>{t("home.noResults")}</p>
      ) : (
        <div className={styles.gameGrid}>
          {filtered.map((game) => (
            <article key={game.id} className={styles.card}>
              <div className={styles.cardHead}>
                <h2>{game.title}</h2>
                <span>{game.subtitle}</span>
              </div>
              <p>{game.description}</p>
              <div className={styles.tags}>
                {game.tags.map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
              <Link href={game.href} className={styles.playButton}>
                {t("home.enterGame")}
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
