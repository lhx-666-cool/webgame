"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useMemo, useRef, useState } from "react";
import { Toaster, toast } from "sonner";
import { useI18n } from "@/components/LanguageProvider";
import styles from "./arrow-domain-game.module.css";

type ArrowDir = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";
type DifficultyId = "easy" | "normal" | "hard" | "expert" | "master";
type GamePhase = "idle" | "animating" | "resolved";
type ResolveResult = "success" | "fail";

type ArrowBlock = {
  id: string;
  row: number;
  col: number;
  dirs: ArrowDir[];
};

type DirectionCast = {
  dir: ArrowDir;
  toId: string | null;
  rayCells: Array<[number, number]>;
};

type WaveSource = {
  fromId: string;
  casts: DirectionCast[];
};

type AttemptWave = {
  sources: WaveSource[];
};

type PuzzleState = {
  serial: number;
  difficulty: DifficultyId;
  rows: number;
  cols: number;
  initialBlocks: ArrowBlock[];
  solutionStartId: string;
};

type DifficultyConfig = {
  rows: number;
  cols: number;
  maxDirs: number;
  extraDirChance: number;
  leafDecoyChance: number;
};

type Point = {
  row: number;
  col: number;
};

type GrowthTree = {
  root: Point;
  childrenByKey: Map<string, Point[]>;
};

type AttemptResult = {
  waves: AttemptWave[];
  success: boolean;
};

type RayVisual = {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  hit: boolean;
};

type ArrowIconGeometry = {
  shaftX: number;
  shaftY: number;
  tipX: number;
  tipY: number;
  leftX: number;
  leftY: number;
  rightX: number;
  rightY: number;
};

const DIFFICULTY_CONFIGS: Record<DifficultyId, DifficultyConfig> = {
  easy: {
    rows: 5,
    cols: 5,
    maxDirs: 2,
    extraDirChance: 0.12,
    leafDecoyChance: 0.84
  },
  normal: {
    rows: 6,
    cols: 6,
    maxDirs: 2,
    extraDirChance: 0.14,
    leafDecoyChance: 0.8
  },
  hard: {
    rows: 7,
    cols: 7,
    maxDirs: 2,
    extraDirChance: 0.16,
    leafDecoyChance: 0.76
  },
  expert: {
    rows: 8,
    cols: 8,
    maxDirs: 2,
    extraDirChance: 0.18,
    leafDecoyChance: 0.72
  },
  master: {
    rows: 9,
    cols: 9,
    maxDirs: 2,
    extraDirChance: 0.2,
    leafDecoyChance: 0.68
  }
};

const INITIAL_SEED: Record<DifficultyId, number> = {
  easy: 1573,
  normal: 2987,
  hard: 4431,
  expert: 6163,
  master: 7993
};

const ALL_DIRECTIONS: ArrowDir[] = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

const DIR_VECTORS: Record<ArrowDir, readonly [number, number]> = {
  N: [-1, 0],
  NE: [-1, 1],
  E: [0, 1],
  SE: [1, 1],
  S: [1, 0],
  SW: [1, -1],
  W: [0, -1],
  NW: [-1, -1]
};

const DELTA_TO_DIR = new Map<string, ArrowDir>(
  ALL_DIRECTIONS.map((dir) => {
    const [dr, dc] = DIR_VECTORS[dir];
    return [`${dr},${dc}`, dir];
  })
);

const STEP_ACTIVATE_MS = 180;
const STEP_RAY_MS = 260;
const STEP_HIT_MS = 150;
const STEP_GAP_MS = 80;
const FAIL_RESET_MS = 820;
const GENERATE_RETRIES = 220;
const TARGET_MAX_WINNERS = 2;
const WINNER_SCAN_STOP = TARGET_MAX_WINNERS + 1;

const createSeededRandom = (seed: number) => {
  let current = seed >>> 0;
  return () => {
    current ^= current << 13;
    current ^= current >>> 17;
    current ^= current << 5;
    return (current >>> 0) / 4294967296;
  };
};

const randomInt = (rng: () => number, min: number, max: number) =>
  min + Math.floor(rng() * (max - min + 1));

const chooseRandom = <T,>(values: readonly T[], rng: () => number): T =>
  values[randomInt(rng, 0, values.length - 1)];

const shuffle = <T,>(items: T[], rng: () => number): T[] => {
  const values = [...items];
  for (let index = values.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(rng, 0, index);
    const temp = values[index];
    values[index] = values[swapIndex];
    values[swapIndex] = temp;
  }
  return values;
};

const coordKey = (row: number, col: number) => `${row}:${col}`;

const inBounds = (row: number, col: number, rows: number, cols: number) =>
  row >= 0 && row < rows && col >= 0 && col < cols;

const cloneBlocks = (blocks: ArrowBlock[]) =>
  blocks.map((block) => ({
    ...block,
    dirs: [...block.dirs]
  }));

const createRandomSeed = () => (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const getNeighborEntries = (
  row: number,
  col: number,
  rows: number,
  cols: number
): Array<{ dir: ArrowDir; row: number; col: number; key: string }> =>
  ALL_DIRECTIONS.map((dir) => {
    const [dr, dc] = DIR_VECTORS[dir];
    const nextRow = row + dr;
    const nextCol = col + dc;
    return {
      dir,
      row: nextRow,
      col: nextCol,
      key: coordKey(nextRow, nextCol)
    };
  }).filter((next) => inBounds(next.row, next.col, rows, cols));

const directionBetween = (from: Point, to: Point): ArrowDir | null => {
  const dr = to.row - from.row;
  const dc = to.col - from.col;
  return DELTA_TO_DIR.get(`${dr},${dc}`) ?? null;
};

const buildAllPoints = (rows: number, cols: number): Point[] => {
  const points: Point[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      points.push({ row, col });
    }
  }
  return points;
};

const buildRandomGrowthTree = (
  rows: number,
  cols: number,
  maxDirs: number,
  rng: () => number
): GrowthTree | null => {
  const allPoints = buildAllPoints(rows, cols);
  if (allPoints.length === 0) {
    return null;
  }

  const root = chooseRandom(allPoints, rng);
  const rootKey = coordKey(root.row, root.col);
  const pointByKey = new Map<string, Point>(
    allPoints.map((point) => [coordKey(point.row, point.col), point])
  );
  const childrenByKey = new Map<string, Point[]>(allPoints.map((point) => [coordKey(point.row, point.col), []]));
  const inTree = new Set<string>([rootKey]);
  const unassigned = new Set<string>(pointByKey.keys());
  unassigned.delete(rootKey);
  const outCount = new Map<string, number>([[rootKey, 0]]);

  while (unassigned.size > 0) {
    const expandableParents = Array.from(inTree).filter((key) => {
      if ((outCount.get(key) ?? 0) >= maxDirs) {
        return false;
      }
      const point = pointByKey.get(key);
      if (!point) {
        return false;
      }
      return getNeighborEntries(point.row, point.col, rows, cols).some((neighbor) =>
        unassigned.has(neighbor.key)
      );
    });

    if (expandableParents.length === 0) {
      return null;
    }

    const parentKey = chooseRandom(expandableParents, rng);
    const parent = pointByKey.get(parentKey);
    if (!parent) {
      return null;
    }

    const nextCandidates = getNeighborEntries(parent.row, parent.col, rows, cols).filter((neighbor) =>
      unassigned.has(neighbor.key)
    );
    if (nextCandidates.length === 0) {
      continue;
    }

    const childEntry = chooseRandom(nextCandidates, rng);
    const child = pointByKey.get(childEntry.key);
    if (!child) {
      return null;
    }

    childrenByKey.get(parentKey)?.push(child);
    outCount.set(parentKey, (outCount.get(parentKey) ?? 0) + 1);
    outCount.set(childEntry.key, outCount.get(childEntry.key) ?? 0);
    inTree.add(childEntry.key);
    unassigned.delete(childEntry.key);
  }

  return {
    root,
    childrenByKey
  };
};

const buildArrowIconGeometry = (): Record<ArrowDir, ArrowIconGeometry> => {
  const center = 50;
  const tipDistance = 31;
  const headLength = 8;
  const headWidth = 4.8;
  const shaftShorten = 7;

  const geometry = {} as Record<ArrowDir, ArrowIconGeometry>;

  ALL_DIRECTIONS.forEach((dir) => {
    const [dr, dc] = DIR_VECTORS[dir];
    const magnitude = Math.hypot(dc, dr);
    const ux = dc / magnitude;
    const uy = dr / magnitude;

    const tipX = center + ux * tipDistance;
    const tipY = center + uy * tipDistance;
    const shaftX = tipX - ux * shaftShorten;
    const shaftY = tipY - uy * shaftShorten;
    const baseX = tipX - ux * headLength;
    const baseY = tipY - uy * headLength;
    const perpX = -uy;
    const perpY = ux;

    geometry[dir] = {
      shaftX,
      shaftY,
      tipX,
      tipY,
      leftX: baseX + perpX * headWidth,
      leftY: baseY + perpY * headWidth,
      rightX: baseX - perpX * headWidth,
      rightY: baseY - perpY * headWidth
    };
  });

  return geometry;
};

const ARROW_ICON_GEOMETRY = buildArrowIconGeometry();

const castNearest = (
  block: ArrowBlock,
  dir: ArrowDir,
  byCoord: Map<string, string>,
  rows: number,
  cols: number
): DirectionCast => {
  const [dr, dc] = DIR_VECTORS[dir];
  const rayCells: Array<[number, number]> = [];
  let row = block.row + dr;
  let col = block.col + dc;

  while (inBounds(row, col, rows, cols)) {
    rayCells.push([row, col]);
    const hitId = byCoord.get(coordKey(row, col));
    if (hitId) {
      return {
        dir,
        toId: hitId,
        rayCells
      };
    }
    row += dr;
    col += dc;
  }

  return {
    dir,
    toId: null,
    rayCells
  };
};

const simulateAttempt = (
  blocks: ArrowBlock[],
  startId: string,
  rows: number,
  cols: number
): AttemptResult => {
  const layoutById = new Map<string, ArrowBlock>(blocks.map((block) => [block.id, block]));
  const aliveById = new Map<string, ArrowBlock>(blocks.map((block) => [block.id, block]));
  const byCoord = new Map<string, string>(
    blocks.map((block) => [coordKey(block.row, block.col), block.id])
  );

  const waves: AttemptWave[] = [];
  let frontier = new Set<string>([startId]);

  while (frontier.size > 0) {
    const currentWaveIds = Array.from(frontier).filter((id) => aliveById.has(id));
    if (currentWaveIds.length === 0) {
      break;
    }

    // Same-wave cells vanish together before any rays are cast.
    currentWaveIds.forEach((id) => {
      const block = aliveById.get(id);
      if (!block) {
        return;
      }
      aliveById.delete(id);
      byCoord.delete(coordKey(block.row, block.col));
    });

    const sources: WaveSource[] = currentWaveIds.flatMap((id) => {
      const block = layoutById.get(id);
      if (!block) {
        return [];
      }
      return [
        {
          fromId: id,
          casts: block.dirs.map((dir) => castNearest(block, dir, byCoord, rows, cols))
        }
      ];
    });

    const nextFrontier = new Set<string>();
    sources.forEach((source) => {
      source.casts.forEach((cast) => {
        if (cast.toId && aliveById.has(cast.toId)) {
          nextFrontier.add(cast.toId);
        }
      });
    });

    waves.push({
      sources
    });
    frontier = nextFrontier;
  }

  return {
    waves,
    success: aliveById.size === 0
  };
};

const collectWinningStarts = (
  blocks: ArrowBlock[],
  rows: number,
  cols: number,
  stopAfter: number
): string[] => {
  const winners: string[] = [];

  for (const block of blocks) {
    const attempt = simulateAttempt(blocks, block.id, rows, cols);
    if (!attempt.success) {
      continue;
    }
    winners.push(block.id);
    if (winners.length >= stopAfter) {
      break;
    }
  }

  return winners;
};

const createSparseBlocksFromTree = (
  tree: GrowthTree,
  serial: number,
  config: DifficultyConfig,
  rng: () => number
): ArrowBlock[] => {
  const blocks: ArrowBlock[] = [];

  for (let row = 0; row < config.rows; row += 1) {
    for (let col = 0; col < config.cols; col += 1) {
      const point: Point = { row, col };
      const key = coordKey(row, col);
      const children = tree.childrenByKey.get(key) ?? [];
      const dirs = new Set<ArrowDir>();

      children.forEach((child) => {
        const dir = directionBetween(point, child);
        if (dir) {
          dirs.add(dir);
        }
      });

      if (dirs.size < config.maxDirs && rng() < config.extraDirChance) {
        const extraCandidates = getNeighborEntries(row, col, config.rows, config.cols)
          .map((entry) => entry.dir)
          .filter((dir) => !dirs.has(dir));
        if (extraCandidates.length > 0) {
          dirs.add(chooseRandom(extraCandidates, rng));
        }
      }

      if (dirs.size === 0 && rng() < config.leafDecoyChance) {
        const neighbors = getNeighborEntries(row, col, config.rows, config.cols).map(
          (entry) => entry.dir
        );
        if (neighbors.length > 0) {
          dirs.add(chooseRandom(neighbors, rng));
        }
      }

      if (dirs.size === 0) {
        const neighbors = getNeighborEntries(row, col, config.rows, config.cols).map(
          (entry) => entry.dir
        );
        if (neighbors.length > 0) {
          dirs.add(chooseRandom(neighbors, rng));
        }
      }

      blocks.push({
        id: `arrow-${serial}-${row}-${col}`,
        row,
        col,
        dirs: shuffle([...dirs], rng)
      });
    }
  }

  return blocks;
};

const createPuzzle = (difficulty: DifficultyId, rng: () => number, serial: number): PuzzleState => {
  const config = DIFFICULTY_CONFIGS[difficulty];
  let fallback:
    | {
        blocks: ArrowBlock[];
        solutionStartId: string;
        winnerCount: number;
      }
    | null = null;

  for (let attempt = 0; attempt < GENERATE_RETRIES; attempt += 1) {
    const tree = buildRandomGrowthTree(config.rows, config.cols, config.maxDirs, rng);
    if (!tree) {
      continue;
    }

    const blocks = createSparseBlocksFromTree(tree, serial, config, rng);
    const solutionStartId = `arrow-${serial}-${tree.root.row}-${tree.root.col}`;
    const rootValidation = simulateAttempt(blocks, solutionStartId, config.rows, config.cols);
    if (!rootValidation.success) {
      continue;
    }

    const winners = collectWinningStarts(blocks, config.rows, config.cols, WINNER_SCAN_STOP);
    const winnerCount = winners.length;

    if (!fallback || winnerCount < fallback.winnerCount) {
      fallback = {
        blocks,
        solutionStartId,
        winnerCount
      };
    }

    if (winnerCount <= TARGET_MAX_WINNERS) {
      return {
        serial,
        difficulty,
        rows: config.rows,
        cols: config.cols,
        initialBlocks: blocks,
        solutionStartId
      };
    }
  }

  if (fallback) {
    return {
      serial,
      difficulty,
      rows: config.rows,
      cols: config.cols,
      initialBlocks: fallback.blocks,
      solutionStartId: fallback.solutionStartId
    };
  }

  const emergencyTree = buildRandomGrowthTree(config.rows, config.cols, 1, () => 0.5);
  if (emergencyTree) {
    const emergencyConfig: DifficultyConfig = {
      ...config,
      maxDirs: 1,
      extraDirChance: 0,
      leafDecoyChance: 0.5
    };
    const emergencyBlocks = createSparseBlocksFromTree(emergencyTree, serial, emergencyConfig, () => 0.7);
    return {
      serial,
      difficulty,
      rows: config.rows,
      cols: config.cols,
      initialBlocks: emergencyBlocks,
      solutionStartId: `arrow-${serial}-${emergencyTree.root.row}-${emergencyTree.root.col}`
    };
  }

  const basicBlocks: ArrowBlock[] = buildAllPoints(config.rows, config.cols).map((point) => ({
    id: `arrow-${serial}-${point.row}-${point.col}`,
    row: point.row,
    col: point.col,
    dirs: [chooseRandom(getNeighborEntries(point.row, point.col, config.rows, config.cols).map((entry) => entry.dir), () => 0.5)]
  }));

  return {
    serial,
    difficulty,
    rows: config.rows,
    cols: config.cols,
    initialBlocks: basicBlocks,
    solutionStartId: basicBlocks[0].id
  };
};

const buildRayVisuals = (
  sourceStep: WaveSource,
  geometryById: Map<string, ArrowBlock>,
  rows: number,
  cols: number,
  visualPrefix: string
): RayVisual[] => {
  const source = geometryById.get(sourceStep.fromId);
  if (!source) {
    return [];
  }

  const from = {
    x: source.col + 0.5,
    y: source.row + 0.5
  };

  return sourceStep.casts.map((cast, index) => {
    if (cast.toId) {
      const target = geometryById.get(cast.toId);
      if (target) {
        return {
          id: `${visualPrefix}-${index}`,
          from,
          to: {
            x: target.col + 0.5,
            y: target.row + 0.5
          },
          hit: true
        };
      }
    }

    if (cast.rayCells.length > 0) {
      const [lastRow, lastCol] = cast.rayCells[cast.rayCells.length - 1];
      return {
        id: `${visualPrefix}-${index}`,
        from,
        to: {
          x: lastCol + 0.5,
          y: lastRow + 0.5
        },
        hit: false
      };
    }

    const [dr, dc] = DIR_VECTORS[cast.dir];
    return {
      id: `${visualPrefix}-${index}`,
      from,
      to: {
        x: Math.max(0.12, Math.min(cols - 0.12, from.x + dc * 0.9)),
        y: Math.max(0.12, Math.min(rows - 0.12, from.y + dr * 0.9))
      },
      hit: false
    };
  });
};

export default function ArrowDomainGame() {
  const { t } = useI18n();

  const initialPuzzle = useMemo(
    () => createPuzzle("normal", createSeededRandom(INITIAL_SEED.normal), 1),
    []
  );

  const serialRef = useRef(initialPuzzle.serial);
  const animationRunRef = useRef(0);

  const [puzzle, setPuzzle] = useState<PuzzleState>(initialPuzzle);
  const [blocks, setBlocks] = useState<ArrowBlock[]>(() => cloneBlocks(initialPuzzle.initialBlocks));
  const [attempts, setAttempts] = useState(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [activeBlockIds, setActiveBlockIds] = useState<string[]>([]);
  const [hitBlockIds, setHitBlockIds] = useState<string[]>([]);
  const [rayVisuals, setRayVisuals] = useState<RayVisual[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hintStartId, setHintStartId] = useState<string | null>(null);

  const totalBlocks = puzzle.initialBlocks.length;
  const aliveIdSet = useMemo(() => new Set(blocks.map((block) => block.id)), [blocks]);
  const activeIdSet = useMemo(() => new Set(activeBlockIds), [activeBlockIds]);
  const hitIdSet = useMemo(() => new Set(hitBlockIds), [hitBlockIds]);
  const columnLabels = useMemo(
    () => Array.from({ length: puzzle.cols }, (_, index) => String.fromCharCode(65 + index)),
    [puzzle.cols]
  );
  const rowLabels = useMemo(
    () => Array.from({ length: puzzle.rows }, (_, index) => `${index + 1}`),
    [puzzle.rows]
  );

  const controlsLocked = phase === "animating";

  const statusText = useMemo(() => {
    if (phase === "animating") {
      return t("arrow.status.animating");
    }
    if (resolveResult === "success") {
      return t("arrow.status.success");
    }
    if (resolveResult === "fail") {
      return t("arrow.status.fail");
    }
    return t("arrow.status.idle");
  }, [phase, resolveResult, t]);

  const clearTransientVisuals = useCallback(() => {
    setActiveBlockIds([]);
    setHitBlockIds([]);
    setRayVisuals([]);
  }, []);

  const applyPuzzle = useCallback(
    (nextPuzzle: PuzzleState) => {
      animationRunRef.current += 1;
      setPuzzle(nextPuzzle);
      setBlocks(cloneBlocks(nextPuzzle.initialBlocks));
      setAttempts(0);
      setResolveResult(null);
      setPhase("idle");
      setShowSuccessModal(false);
      setHintStartId(null);
      clearTransientVisuals();
    },
    [clearTransientVisuals]
  );

  const generateFreshPuzzle = useCallback((difficulty: DifficultyId) => {
    serialRef.current += 1;
    return createPuzzle(difficulty, createSeededRandom(createRandomSeed()), serialRef.current);
  }, []);

  const restartCurrentPuzzle = useCallback(() => {
    animationRunRef.current += 1;
    setBlocks(cloneBlocks(puzzle.initialBlocks));
    setAttempts(0);
    setResolveResult(null);
    setPhase("idle");
    setShowSuccessModal(false);
    setHintStartId(null);
    clearTransientVisuals();
  }, [clearTransientVisuals, puzzle.initialBlocks]);

  const changeDifficulty = useCallback(
    (difficulty: DifficultyId) => {
      if (controlsLocked && difficulty !== puzzle.difficulty) {
        return;
      }
      const nextPuzzle = generateFreshPuzzle(difficulty);
      applyPuzzle(nextPuzzle);
    },
    [applyPuzzle, controlsLocked, generateFreshPuzzle, puzzle.difficulty]
  );

  const newPuzzleSameDifficulty = useCallback(() => {
    if (controlsLocked) {
      return;
    }
    const nextPuzzle = generateFreshPuzzle(puzzle.difficulty);
    applyPuzzle(nextPuzzle);
  }, [applyPuzzle, controlsLocked, generateFreshPuzzle, puzzle.difficulty]);

  const replaySolvedPuzzle = useCallback(() => {
    restartCurrentPuzzle();
  }, [restartCurrentPuzzle]);

  const nextPuzzleAfterSuccess = useCallback(() => {
    const nextPuzzle = generateFreshPuzzle(puzzle.difficulty);
    applyPuzzle(nextPuzzle);
  }, [applyPuzzle, generateFreshPuzzle, puzzle.difficulty]);

  const showFeasibleSolution = useCallback(() => {
    if (controlsLocked) {
      return;
    }
    setHintStartId(puzzle.solutionStartId);
  }, [controlsLocked, puzzle.solutionStartId]);

  const playAttempt = useCallback(
    (startId: string) => {
      if (controlsLocked || blocks.length === 0) {
        return;
      }
      if (!blocks.some((block) => block.id === startId)) {
        return;
      }

      const attempt = simulateAttempt(blocks, startId, puzzle.rows, puzzle.cols);
      if (attempt.waves.length === 0) {
        return;
      }

      const runId = animationRunRef.current + 1;
      animationRunRef.current = runId;

      setAttempts((count) => count + 1);
      setShowSuccessModal(false);
      setResolveResult(null);
      setHintStartId(null);
      setPhase("animating");
      clearTransientVisuals();

      const geometryById = new Map<string, ArrowBlock>(
        puzzle.initialBlocks.map((block) => [block.id, block])
      );

      void (async () => {
        const isStale = () => animationRunRef.current !== runId;

        for (let waveIndex = 0; waveIndex < attempt.waves.length; waveIndex += 1) {
          const wave = attempt.waves[waveIndex];
          if (isStale()) {
            return;
          }

          if (wave.sources.length === 0) {
            continue;
          }

          const sourceIds = wave.sources.map((source) => source.fromId);
          setActiveBlockIds(sourceIds);
          setHitBlockIds([]);
          setRayVisuals([]);
          await wait(STEP_ACTIVATE_MS);
          if (isStale()) {
            return;
          }

          const sourceSet = new Set(sourceIds);
          setBlocks((prev) => prev.filter((block) => !sourceSet.has(block.id)));

          const rays = wave.sources.flatMap((source, sourceIndex) =>
            buildRayVisuals(
              source,
              geometryById,
              puzzle.rows,
              puzzle.cols,
              `ray-${runId}-${waveIndex}-${sourceIndex}`
            )
          );
          setRayVisuals(rays);

          await wait(STEP_RAY_MS);
          if (isStale()) {
            return;
          }

          const hitIds = Array.from(
            new Set(
              wave.sources.flatMap((source) =>
                source.casts.map((cast) => cast.toId).filter((id): id is string => Boolean(id))
              )
            )
          );

          if (hitIds.length > 0) {
            setHitBlockIds(hitIds);
            await wait(STEP_HIT_MS);
            if (isStale()) {
              return;
            }
          }

          setRayVisuals([]);
          setHitBlockIds([]);
          setActiveBlockIds([]);
          await wait(STEP_GAP_MS);
        }

        if (isStale()) {
          return;
        }

        setPhase("resolved");
        setResolveResult(attempt.success ? "success" : "fail");
        clearTransientVisuals();

        if (attempt.success) {
          toast.success(t("arrow.messages.success"));
          setShowSuccessModal(true);
          return;
        }

        toast.error(t("arrow.messages.fail"));
        await wait(FAIL_RESET_MS);
        if (isStale()) {
          return;
        }

        setBlocks(cloneBlocks(puzzle.initialBlocks));
        setPhase("idle");
        setResolveResult(null);
        clearTransientVisuals();
        toast(t("arrow.messages.resetting"));
      })();
    },
    [
      blocks,
      clearTransientVisuals,
      controlsLocked,
      puzzle.cols,
      puzzle.initialBlocks,
      puzzle.rows,
      t
    ]
  );

  return (
    <div className={styles.shell}>
      <Toaster richColors closeButton position="top-center" />

      <div className={styles.topStats}>
        <article className={styles.statBox}>
          <span>{t("arrow.stats.remaining")}</span>
          <strong>{`${blocks.length}/${totalBlocks}`}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("arrow.stats.attempts")}</span>
          <strong>{attempts}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("arrow.stats.board")}</span>
          <strong>{`${puzzle.rows} x ${puzzle.cols}`}</strong>
        </article>
        <article className={styles.statBox}>
          <span>{t("arrow.stats.status")}</span>
          <strong>{statusText}</strong>
        </article>
      </div>

      <div className={styles.mainGrid}>
        <section className={styles.boardPanel}>
          <div className={styles.boardWrap}>
            <div
              className={styles.matrixShell}
              style={
                {
                  "--rows": puzzle.rows,
                  "--cols": puzzle.cols
                } as React.CSSProperties
              }
            >
              <div />
              <div className={styles.axisTop}>
                {columnLabels.map((label) => (
                  <span key={`top-${label}`} className={styles.axisCell}>
                    {label}
                  </span>
                ))}
              </div>
              <div />

              <div className={styles.axisLeft}>
                {rowLabels.map((label) => (
                  <span key={`left-${label}`} className={styles.axisCell}>
                    {label}
                  </span>
                ))}
              </div>

              <div className={styles.boardStage}>
                <svg
                  className={styles.rayLayer}
                  viewBox={`0 0 ${puzzle.cols} ${puzzle.rows}`}
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <AnimatePresence>
                    {rayVisuals.map((rayVisual) => (
                      <motion.line
                        key={rayVisual.id}
                        x1={rayVisual.from.x}
                        y1={rayVisual.from.y}
                        x2={rayVisual.to.x}
                        y2={rayVisual.to.y}
                        className={rayVisual.hit ? styles.rayHit : styles.rayMiss}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ pathLength: 1, opacity: 0 }}
                        transition={{ duration: STEP_RAY_MS / 1000, ease: "easeOut" }}
                      />
                    ))}
                  </AnimatePresence>
                </svg>

                <div className={styles.cellGrid}>
                  {puzzle.initialBlocks.map((block) => {
                    const alive = aliveIdSet.has(block.id);
                    const active = activeIdSet.has(block.id);
                    const hit = hitIdSet.has(block.id);
                    const hinted = hintStartId === block.id && alive;
                    const dirLabel = block.dirs.map((dir) => t(`arrow.dir.${dir}`)).join(" / ");

                    return (
                      <motion.button
                        key={block.id}
                        type="button"
                        className={`${styles.blockCell} ${active ? styles.blockActive : ""} ${
                          hit ? styles.blockHit : ""
                        } ${hinted ? styles.blockHint : ""} ${
                          alive ? styles.blockAlive : styles.blockGone
                        }`}
                        style={{
                          gridRow: block.row + 1,
                          gridColumn: block.col + 1
                        }}
                        onClick={() => playAttempt(block.id)}
                        disabled={controlsLocked || !alive}
                        aria-label={t("arrow.aria.block", {
                          row: block.row + 1,
                          col: block.col + 1,
                          dir: dirLabel
                        })}
                        initial={false}
                        animate={{
                          opacity: alive ? 1 : 0.18,
                          scale: active ? 1.08 : hit ? 1.05 : 1
                        }}
                        transition={{
                          duration: 0.2,
                          ease: [0.2, 0.9, 0.25, 1]
                        }}
                        whileHover={controlsLocked || !alive ? undefined : { scale: 1.04 }}
                      >
                        <span className={styles.cellGlow} aria-hidden="true" />
                        {alive ? (
                          <svg className={styles.arrowGlyph} viewBox="0 0 100 100" aria-hidden="true">
                            <circle cx="50" cy="50" r="5.2" className={styles.arrowHub} />
                            {block.dirs.map((dir) => {
                              const geometry = ARROW_ICON_GEOMETRY[dir];
                              return (
                                <g key={`${block.id}-${dir}`}>
                                  <line
                                    x1="50"
                                    y1="50"
                                    x2={geometry.shaftX}
                                    y2={geometry.shaftY}
                                    className={styles.arrowStem}
                                  />
                                  <polygon
                                    points={`${geometry.tipX},${geometry.tipY} ${geometry.leftX},${geometry.leftY} ${geometry.rightX},${geometry.rightY}`}
                                    className={styles.arrowHead}
                                  />
                                </g>
                              );
                            })}
                          </svg>
                        ) : (
                          <span className={styles.goneMark} aria-hidden="true">
                            ·
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              <div className={styles.axisRight}>
                {rowLabels.map((label) => (
                  <span key={`right-${label}`} className={styles.axisCell}>
                    {label}
                  </span>
                ))}
              </div>

              <div />
              <div className={styles.axisBottom}>
                {columnLabels.map((label) => (
                  <span key={`bottom-${label}`} className={styles.axisCell}>
                    {label}
                  </span>
                ))}
              </div>
              <div />
            </div>
          </div>
        </section>

        <section className={styles.rightPane}>
          <div className={styles.panel}>
            <h2>{t("arrow.controls.title")}</h2>
            <div className={styles.field}>
              <span>{t("arrow.controls.difficulty")}</span>
              <div className={styles.segmented}>
                {(["easy", "normal", "hard", "expert", "master"] as DifficultyId[]).map(
                  (difficulty) => (
                    <button
                      key={difficulty}
                      type="button"
                      className={`${styles.segmentButton} ${
                        puzzle.difficulty === difficulty ? styles.segmentActive : ""
                      }`}
                      onClick={() => changeDifficulty(difficulty)}
                      disabled={controlsLocked}
                    >
                      {t(`arrow.difficulty.${difficulty}`)}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={newPuzzleSameDifficulty}
                disabled={controlsLocked}
              >
                {t("arrow.controls.newPuzzle")}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={restartCurrentPuzzle}
                disabled={controlsLocked}
              >
                {t("arrow.controls.restart")}
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={showFeasibleSolution}
                disabled={controlsLocked}
              >
                {t("arrow.controls.showSolution")}
              </button>
            </div>
          </div>

          <div className={styles.panel}>
            <h2>{t("arrow.guide.title")}</h2>
            <p className={styles.hint}>{t("arrow.guide.hint")}</p>
            <ul className={styles.guideList}>
              <li>{t("arrow.guide.1")}</li>
              <li>{t("arrow.guide.2")}</li>
              <li>{t("arrow.guide.3")}</li>
              <li>{t("arrow.guide.4")}</li>
            </ul>
          </div>
        </section>
      </div>

      {showSuccessModal ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <h3>{t("arrow.modal.title")}</h3>
            <p>{t("arrow.modal.description")}</p>
            <div className={styles.buttonRow}>
              <button type="button" className={styles.secondaryBtn} onClick={replaySolvedPuzzle}>
                {t("arrow.modal.replay")}
              </button>
              <button type="button" className={styles.primaryBtn} onClick={nextPuzzleAfterSuccess}>
                {t("arrow.modal.next")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
