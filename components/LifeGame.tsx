"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/LanguageProvider";
import styles from "./life-game.module.css";

type Rule = {
  birth: boolean[];
  survive: boolean[];
  text: string;
};

type DrawMode = "toggle" | "paint" | "erase";
type ThemeName = "arcade" | "sunset" | "terminal";

type Pattern = {
  name: string;
  description: string;
  cells: Array<[number, number]>;
};

type SavedState = {
  v: number;
  rows: number;
  cols: number;
  grid: string;
  generation: number;
  rule: string;
  wrapEdges: boolean;
  fps: number;
  randomDensity: number;
  cellSize: number;
  showGrid: boolean;
  theme: ThemeName;
};

const DEFAULT_RULE_TEXT = "B3/S23";
const DEFAULT_ROWS = 44;
const DEFAULT_COLS = 76;
const DEFAULT_CELL_SIZE = 12;
const DEFAULT_FPS = 12;
const DEFAULT_DENSITY = 0.24;
const STORAGE_KEY = "grid-arcade-life-state-v1";

const THEMES: Record<
  ThemeName,
  { dead: string; alive: string; grid: string; accent: string }
> = {
  arcade: {
    dead: "#0f1829",
    alive: "#7ae2cc",
    grid: "rgba(102, 184, 222, 0.23)",
    accent: "#f4d97d"
  },
  sunset: {
    dead: "#291723",
    alive: "#ff8a55",
    grid: "rgba(255, 185, 119, 0.3)",
    accent: "#ffd387"
  },
  terminal: {
    dead: "#06120c",
    alive: "#61ff9d",
    grid: "rgba(121, 255, 183, 0.22)",
    accent: "#b7ff95"
  }
};

const PATTERNS: Record<string, Pattern> = {
  block: {
    name: "Block",
    description: "Stable 2x2 still life.",
    cells: [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1]
    ]
  },
  blinker: {
    name: "Blinker",
    description: "A period-2 oscillator.",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2]
    ]
  },
  toad: {
    name: "Toad",
    description: "A compact period-2 oscillator.",
    cells: [
      [0, 1],
      [0, 2],
      [0, 3],
      [1, 0],
      [1, 1],
      [1, 2]
    ]
  },
  glider: {
    name: "Glider",
    description: "Moves diagonally forever in open space.",
    cells: [
      [0, 1],
      [1, 2],
      [2, 0],
      [2, 1],
      [2, 2]
    ]
  },
  lwss: {
    name: "Lightweight Spaceship",
    description: "A classic traveling spaceship.",
    cells: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
      [1, 0],
      [1, 4],
      [2, 4],
      [3, 0],
      [3, 3]
    ]
  },
  rPentomino: {
    name: "R-pentomino",
    description: "Chaotic growth before stabilizing.",
    cells: [
      [0, 1],
      [0, 2],
      [1, 0],
      [1, 1],
      [2, 1]
    ]
  },
  acorn: {
    name: "Acorn",
    description: "Tiny seed with long evolution.",
    cells: [
      [0, 1],
      [1, 3],
      [2, 0],
      [2, 1],
      [2, 4],
      [2, 5],
      [2, 6]
    ]
  },
  gosper: {
    name: "Gosper Glider Gun",
    description: "Generates endless gliders.",
    cells: [
      [5, 1],
      [5, 2],
      [6, 1],
      [6, 2],
      [3, 13],
      [3, 14],
      [4, 12],
      [4, 16],
      [5, 11],
      [5, 17],
      [6, 11],
      [6, 15],
      [6, 17],
      [6, 18],
      [7, 11],
      [7, 17],
      [8, 12],
      [8, 16],
      [9, 13],
      [9, 14],
      [1, 25],
      [2, 23],
      [2, 25],
      [3, 21],
      [3, 22],
      [4, 21],
      [4, 22],
      [5, 21],
      [5, 22],
      [6, 23],
      [6, 25],
      [7, 25],
      [3, 35],
      [3, 36],
      [4, 35],
      [4, 36]
    ]
  }
};

const createEmptyGrid = (rows: number, cols: number) => new Uint8Array(rows * cols);

const randomGrid = (rows: number, cols: number, density: number) => {
  const result = createEmptyGrid(rows, cols);
  for (let i = 0; i < result.length; i += 1) {
    result[i] = Math.random() < density ? 1 : 0;
  }
  return result;
};

const countAlive = (grid: Uint8Array) => {
  let total = 0;
  for (let i = 0; i < grid.length; i += 1) {
    total += grid[i];
  }
  return total;
};

const clamp = (value: number, min: number, max: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(min, Math.min(max, value));
};

const parseIntOr = (input: string, fallback: number) => {
  const parsed = Number.parseInt(input, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const parseRule = (input: string): Rule | null => {
  const normalized = input.trim().toUpperCase().replace(/\s+/g, "");
  const match = normalized.match(/^B([0-8]*)\/S([0-8]*)$/);
  if (!match) {
    return null;
  }

  const parseDigits = (value: string) =>
    [
      ...new Set(
        value
          .split("")
          .map((digit) => Number.parseInt(digit, 10))
          .filter((digit) => digit >= 0 && digit <= 8)
      )
    ].sort((a, b) => a - b);

  const birthDigits = parseDigits(match[1]);
  const surviveDigits = parseDigits(match[2]);

  const birth = Array(9).fill(false);
  const survive = Array(9).fill(false);

  for (const digit of birthDigits) {
    birth[digit] = true;
  }
  for (const digit of surviveDigits) {
    survive[digit] = true;
  }

  return {
    birth,
    survive,
    text: `B${birthDigits.join("")}/S${surviveDigits.join("")}`
  };
};

const DEFAULT_RULE = parseRule(DEFAULT_RULE_TEXT) as Rule;

const stepGrid = (
  current: Uint8Array,
  rows: number,
  cols: number,
  rule: Rule,
  wrapEdges: boolean
) => {
  const next = createEmptyGrid(rows, cols);
  let nextPopulation = 0;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let neighbors = 0;

      for (let rowDelta = -1; rowDelta <= 1; rowDelta += 1) {
        for (let colDelta = -1; colDelta <= 1; colDelta += 1) {
          if (rowDelta === 0 && colDelta === 0) {
            continue;
          }

          let nextRow = row + rowDelta;
          let nextCol = col + colDelta;

          if (wrapEdges) {
            nextRow = (nextRow + rows) % rows;
            nextCol = (nextCol + cols) % cols;
          } else if (
            nextRow < 0 ||
            nextRow >= rows ||
            nextCol < 0 ||
            nextCol >= cols
          ) {
            continue;
          }

          neighbors += current[nextRow * cols + nextCol];
        }
      }

      const index = row * cols + col;
      const alive = current[index] === 1;
      const willLive = alive ? rule.survive[neighbors] : rule.birth[neighbors];

      if (willLive) {
        next[index] = 1;
        nextPopulation += 1;
      }
    }
  }

  return { next, nextPopulation };
};

const resizeGridCentered = (
  current: Uint8Array,
  oldRows: number,
  oldCols: number,
  newRows: number,
  newCols: number
) => {
  const resized = createEmptyGrid(newRows, newCols);
  const rowOffset = Math.floor((newRows - oldRows) / 2);
  const colOffset = Math.floor((newCols - oldCols) / 2);

  for (let row = 0; row < oldRows; row += 1) {
    for (let col = 0; col < oldCols; col += 1) {
      const currentIndex = row * oldCols + col;
      if (current[currentIndex] === 0) {
        continue;
      }

      const targetRow = row + rowOffset;
      const targetCol = col + colOffset;

      if (
        targetRow >= 0 &&
        targetRow < newRows &&
        targetCol >= 0 &&
        targetCol < newCols
      ) {
        resized[targetRow * newCols + targetCol] = 1;
      }
    }
  }

  return resized;
};

const encodeGrid = (grid: Uint8Array) => {
  let binary = "";
  for (let index = 0; index < grid.length; index += 8) {
    let packed = 0;
    for (let bit = 0; bit < 8; bit += 1) {
      if (grid[index + bit] === 1) {
        packed |= 1 << bit;
      }
    }
    binary += String.fromCharCode(packed);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeGrid = (encoded: string, size: number) => {
  try {
    const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const pad = (4 - (normalized.length % 4)) % 4;
    const binary = atob(`${normalized}${"=".repeat(pad)}`);

    const grid = new Uint8Array(size);
    for (let byteIndex = 0; byteIndex < binary.length; byteIndex += 1) {
      const value = binary.charCodeAt(byteIndex);
      for (let bit = 0; bit < 8; bit += 1) {
        const index = byteIndex * 8 + bit;
        if (index >= size) {
          break;
        }
        grid[index] = (value >> bit) & 1;
      }
    }
    return grid;
  } catch {
    return null;
  }
};

const placePattern = (
  current: Uint8Array,
  rows: number,
  cols: number,
  pattern: Pattern,
  anchorRow: number,
  anchorCol: number,
  wrapEdges: boolean
) => {
  const next = current.slice();
  const maxRow = pattern.cells.reduce((value, [row]) => Math.max(value, row), 0);
  const maxCol = pattern.cells.reduce((value, [, col]) => Math.max(value, col), 0);

  const originRow = anchorRow - Math.floor(maxRow / 2);
  const originCol = anchorCol - Math.floor(maxCol / 2);

  for (const [row, col] of pattern.cells) {
    let targetRow = originRow + row;
    let targetCol = originCol + col;

    if (wrapEdges) {
      targetRow = (targetRow + rows) % rows;
      targetCol = (targetCol + cols) % cols;
    } else if (
      targetRow < 0 ||
      targetRow >= rows ||
      targetCol < 0 ||
      targetCol >= cols
    ) {
      continue;
    }

    next[targetRow * cols + targetCol] = 1;
  }

  return next;
};

export default function LifeGame() {
  const { locale, t } = useI18n();
  const searchParams = useSearchParams();
  const initialGrid = useMemo(
    () => randomGrid(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_DENSITY),
    []
  );

  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE);
  const [fps, setFps] = useState(DEFAULT_FPS);
  const [randomDensity, setRandomDensity] = useState(DEFAULT_DENSITY);

  const [grid, setGrid] = useState<Uint8Array>(initialGrid);
  const [generation, setGeneration] = useState(0);
  const [population, setPopulation] = useState(() => countAlive(initialGrid));

  const [running, setRunning] = useState(false);
  const [wrapEdges, setWrapEdges] = useState(true);
  const [showGrid, setShowGrid] = useState(true);

  const [rule, setRule] = useState<Rule>(DEFAULT_RULE);
  const [ruleInput, setRuleInput] = useState(DEFAULT_RULE.text);

  const [drawMode, setDrawMode] = useState<DrawMode>("toggle");
  const [selectedPattern, setSelectedPattern] = useState("none");
  const [theme, setTheme] = useState<ThemeName>("arcade");

  const [draftRows, setDraftRows] = useState(String(DEFAULT_ROWS));
  const [draftCols, setDraftCols] = useState(String(DEFAULT_COLS));
  const [message, setMessage] = useState(() => t("life.messages.initial"));

  const [isReadyToSave, setIsReadyToSave] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isPointerDownRef = useRef(false);
  const paintedCellsRef = useRef<Set<number>>(new Set());
  const paintValueRef = useRef<0 | 1>(1);
  const bootstrappedRef = useRef(false);

  const palette = THEMES[theme];
  const getPatternName = useCallback(
    (patternKey: string) => t(`life.patterns.${patternKey}.name`),
    [t]
  );
  const getPatternDescription = useCallback(
    (patternKey: string) => t(`life.patterns.${patternKey}.description`),
    [t]
  );

  const stepSimulation = useCallback(() => {
    setGrid((current) => {
      const { next, nextPopulation } = stepGrid(
        current,
        rows,
        cols,
        rule,
        wrapEdges
      );
      setPopulation(nextPopulation);
      setGeneration((value) => value + 1);
      return next;
    });
  }, [rows, cols, rule, wrapEdges]);

  const clearBoard = useCallback(() => {
    setRunning(false);
    const next = createEmptyGrid(rows, cols);
    setGrid(next);
    setPopulation(0);
    setGeneration(0);
    setMessage(t("life.messages.boardCleared"));
  }, [rows, cols, t]);

  const randomizeBoard = useCallback(() => {
    setRunning(false);
    const next = randomGrid(rows, cols, randomDensity);
    setGrid(next);
    setPopulation(countAlive(next));
    setGeneration(0);
    setMessage(t("life.messages.randomGenerated"));
  }, [rows, cols, randomDensity, t]);

  const resizeBoard = useCallback(
    (nextRowsValue: number, nextColsValue: number) => {
      const nextRows = clamp(nextRowsValue, 10, 160, rows);
      const nextCols = clamp(nextColsValue, 10, 220, cols);

      if (nextRows === rows && nextCols === cols) {
        setDraftRows(String(nextRows));
        setDraftCols(String(nextCols));
        return;
      }

      setRunning(false);
      setGrid((current) => {
        const resized = resizeGridCentered(current, rows, cols, nextRows, nextCols);
        setPopulation(countAlive(resized));
        return resized;
      });
      setRows(nextRows);
      setCols(nextCols);
      setGeneration(0);
      setDraftRows(String(nextRows));
      setDraftCols(String(nextCols));
      setMessage(
        t("life.messages.resized", {
          rows: nextRows,
          cols: nextCols
        })
      );
    },
    [rows, cols, t]
  );

  const applyBoardSize = useCallback(() => {
    resizeBoard(parseIntOr(draftRows, rows), parseIntOr(draftCols, cols));
  }, [draftRows, draftCols, rows, cols, resizeBoard]);

  const applyRuleInput = useCallback(() => {
    const parsed = parseRule(ruleInput);
    if (!parsed) {
      setMessage(t("life.messages.ruleFormat"));
      return;
    }
    setRule(parsed);
    setRuleInput(parsed.text);
    setMessage(t("life.messages.ruleSet", { rule: parsed.text }));
  }, [ruleInput, t]);

  const stampPatternAt = useCallback(
    (row: number, col: number, patternKey = selectedPattern) => {
      if (patternKey === "none") {
        return;
      }
      const pattern = PATTERNS[patternKey];
      if (!pattern) {
        return;
      }

      setGrid((current) => {
        const next = placePattern(current, rows, cols, pattern, row, col, wrapEdges);
        setPopulation(countAlive(next));
        return next;
      });
      setMessage(
        t("life.messages.patternStamped", {
          pattern: getPatternName(patternKey)
        })
      );
    },
    [rows, cols, selectedPattern, wrapEdges, t, getPatternName]
  );

  const resetDefaults = useCallback(() => {
    const next = randomGrid(DEFAULT_ROWS, DEFAULT_COLS, DEFAULT_DENSITY);

    setRunning(false);
    setRows(DEFAULT_ROWS);
    setCols(DEFAULT_COLS);
    setDraftRows(String(DEFAULT_ROWS));
    setDraftCols(String(DEFAULT_COLS));

    setCellSize(DEFAULT_CELL_SIZE);
    setFps(DEFAULT_FPS);
    setRandomDensity(DEFAULT_DENSITY);
    setWrapEdges(true);
    setShowGrid(true);

    setRule(DEFAULT_RULE);
    setRuleInput(DEFAULT_RULE.text);

    setDrawMode("toggle");
    setSelectedPattern("none");
    setTheme("arcade");

    setGrid(next);
    setPopulation(countAlive(next));
    setGeneration(0);
    setMessage(t("life.messages.reset"));
  }, [t]);

  const clearLocalSave = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setMessage(t("life.messages.localSaveRemoved"));
  }, [t]);

  const copyShareLink = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("r", String(rows));
    params.set("c", String(cols));
    params.set("rule", rule.text);
    params.set("w", wrapEdges ? "1" : "0");
    params.set("lang", locale);
    params.set("s", encodeGrid(grid));

    const url = `${window.location.origin}/games/life?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(url);
      setMessage(t("life.messages.shareCopied"));
    } catch {
      setMessage(t("life.messages.shareUrl", { url }));
    }
  }, [rows, cols, rule.text, wrapEdges, grid, locale, t]);

  const getPointerHit = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);

      if (row < 0 || row >= rows || col < 0 || col >= cols) {
        return null;
      }

      return {
        row,
        col,
        index: row * cols + col
      };
    },
    [cellSize, rows, cols]
  );

  const paintCell = useCallback((index: number, value: 0 | 1) => {
    setGrid((current) => {
      if (current[index] === value) {
        return current;
      }

      const next = current.slice();
      const delta = value - current[index];
      next[index] = value;
      setPopulation((count) => count + delta);
      return next;
    });
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const hit = getPointerHit(event);
      if (!hit) {
        return;
      }

      event.currentTarget.setPointerCapture(event.pointerId);

      if (selectedPattern !== "none") {
        stampPatternAt(hit.row, hit.col);
        return;
      }

      isPointerDownRef.current = true;
      paintedCellsRef.current.clear();

      let nextValue: 0 | 1;
      if (drawMode === "paint") {
        nextValue = 1;
      } else if (drawMode === "erase") {
        nextValue = 0;
      } else {
        nextValue = grid[hit.index] === 1 ? 0 : 1;
      }

      paintValueRef.current = nextValue;
      paintCell(hit.index, nextValue);
      paintedCellsRef.current.add(hit.index);
    },
    [drawMode, getPointerHit, grid, paintCell, selectedPattern, stampPatternAt]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isPointerDownRef.current || selectedPattern !== "none") {
        return;
      }

      const hit = getPointerHit(event);
      if (!hit || paintedCellsRef.current.has(hit.index)) {
        return;
      }

      paintedCellsRef.current.add(hit.index);
      paintCell(hit.index, paintValueRef.current);
    },
    [getPointerHit, paintCell, selectedPattern]
  );

  const releasePointer = useCallback(() => {
    isPointerDownRef.current = false;
    paintedCellsRef.current.clear();
  }, []);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const width = cols * cellSize;
    const height = rows * cellSize;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.floor(width * dpr);
    const pixelHeight = Math.floor(height * dpr);

    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.fillStyle = palette.dead;
    context.fillRect(0, 0, width, height);

    if (showGrid && cellSize >= 5) {
      context.strokeStyle = palette.grid;
      context.lineWidth = 1;
      context.beginPath();

      for (let row = 0; row <= rows; row += 1) {
        const y = row * cellSize + 0.5;
        context.moveTo(0, y);
        context.lineTo(width, y);
      }
      for (let col = 0; col <= cols; col += 1) {
        const x = col * cellSize + 0.5;
        context.moveTo(x, 0);
        context.lineTo(x, height);
      }
      context.stroke();
    }

    context.fillStyle = palette.alive;
    const inset = cellSize > 4 ? 1 : 0;
    const paintedSize = Math.max(1, cellSize - inset * 2);

    for (let index = 0; index < grid.length; index += 1) {
      if (grid[index] === 0) {
        continue;
      }
      const row = Math.floor(index / cols);
      const col = index % cols;
      context.fillRect(
        col * cellSize + inset,
        row * cellSize + inset,
        paintedSize,
        paintedSize
      );
    }
  }, [cols, rows, cellSize, showGrid, palette, grid]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  useEffect(() => {
    setMessage(t("life.messages.initial"));
  }, [t]);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(
      stepSimulation,
      Math.max(16, Math.round(1000 / fps))
    );

    return () => window.clearInterval(interval);
  }, [running, stepSimulation, fps]);

  useEffect(() => {
    if (bootstrappedRef.current) {
      return;
    }
    bootstrappedRef.current = true;

    const searchState = (() => {
      const encoded = searchParams.get("s");
      if (!encoded) {
        return null;
      }

      const parsedRows = clamp(Number(searchParams.get("r")), 10, 160, DEFAULT_ROWS);
      const parsedCols = clamp(Number(searchParams.get("c")), 10, 220, DEFAULT_COLS);
      const decodedGrid = decodeGrid(encoded, parsedRows * parsedCols);

      if (!decodedGrid) {
        return null;
      }

      const parsedRule = parseRule(searchParams.get("rule") ?? DEFAULT_RULE.text);
      return {
        rows: parsedRows,
        cols: parsedCols,
        grid: decodedGrid,
        rule: parsedRule ?? DEFAULT_RULE,
        wrapEdges: searchParams.get("w") === "1"
      };
    })();

    if (searchState) {
      setRows(searchState.rows);
      setCols(searchState.cols);
      setDraftRows(String(searchState.rows));
      setDraftCols(String(searchState.cols));
      setGrid(searchState.grid);
      setPopulation(countAlive(searchState.grid));
      setGeneration(0);
      setRule(searchState.rule);
      setRuleInput(searchState.rule.text);
      setWrapEdges(searchState.wrapEdges);
      setMessage(t("life.messages.loadedFromLink"));
      setIsReadyToSave(true);
      return;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setIsReadyToSave(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<SavedState>;
      const nextRows = clamp(Number(parsed.rows), 10, 160, DEFAULT_ROWS);
      const nextCols = clamp(Number(parsed.cols), 10, 220, DEFAULT_COLS);
      const decodedGrid =
        typeof parsed.grid === "string"
          ? decodeGrid(parsed.grid, nextRows * nextCols)
          : null;

      if (!decodedGrid) {
        setIsReadyToSave(true);
        return;
      }

      const savedRule =
        typeof parsed.rule === "string" ? parseRule(parsed.rule) : null;
      const savedTheme =
        typeof parsed.theme === "string" && parsed.theme in THEMES
          ? (parsed.theme as ThemeName)
          : "arcade";

      setRows(nextRows);
      setCols(nextCols);
      setDraftRows(String(nextRows));
      setDraftCols(String(nextCols));

      setGrid(decodedGrid);
      setPopulation(countAlive(decodedGrid));
      setGeneration(clamp(Number(parsed.generation), 0, 500000000, 0));

      setRule(savedRule ?? DEFAULT_RULE);
      setRuleInput((savedRule ?? DEFAULT_RULE).text);
      setWrapEdges(typeof parsed.wrapEdges === "boolean" ? parsed.wrapEdges : true);

      setFps(clamp(Number(parsed.fps), 1, 45, DEFAULT_FPS));
      setRandomDensity(clamp(Number(parsed.randomDensity), 0.01, 0.9, DEFAULT_DENSITY));
      setCellSize(clamp(Number(parsed.cellSize), 6, 22, DEFAULT_CELL_SIZE));
      setShowGrid(parsed.showGrid !== false);
      setTheme(savedTheme);
      setMessage(t("life.messages.restored"));
    } catch {
      setMessage(t("life.messages.invalidSave"));
    } finally {
      setIsReadyToSave(true);
    }
  }, [searchParams, t]);

  useEffect(() => {
    if (!isReadyToSave) {
      return;
    }

    const payload: SavedState = {
      v: 1,
      rows,
      cols,
      grid: encodeGrid(grid),
      generation,
      rule: rule.text,
      wrapEdges,
      fps,
      randomDensity,
      cellSize,
      showGrid,
      theme
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      setMessage(t("life.messages.saveError"));
    }
  }, [
    isReadyToSave,
    rows,
    cols,
    grid,
    generation,
    rule.text,
    wrapEdges,
    fps,
    randomDensity,
    cellSize,
    showGrid,
    theme,
    t
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.code === "Space") {
        event.preventDefault();
        setRunning((value) => !value);
        return;
      }

      if (key === "n") {
        event.preventDefault();
        setRunning(false);
        stepSimulation();
        return;
      }

      if (key === "c") {
        event.preventDefault();
        clearBoard();
        return;
      }

      if (key === "r") {
        event.preventDefault();
        randomizeBoard();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [clearBoard, randomizeBoard, stepSimulation]);

  const patternDescription =
    selectedPattern === "none"
      ? t("life.patternHint.none")
      : getPatternDescription(selectedPattern);

  return (
    <div className={styles.shell}>
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span>{t("life.stats.generation")}</span>
          <strong>{generation.toLocaleString(locale)}</strong>
        </div>
        <div className={styles.statCard}>
          <span>{t("life.stats.liveCells")}</span>
          <strong>{population.toLocaleString(locale)}</strong>
        </div>
        <div className={styles.statCard}>
          <span>{t("life.stats.board")}</span>
          <strong>
            {rows} x {cols}
          </strong>
        </div>
        <div className={styles.statCard}>
          <span>{t("life.stats.rule")}</span>
          <strong>{rule.text}</strong>
        </div>
      </div>

      <div className={styles.controlGrid}>
        <section className={styles.panel}>
          <h2>{t("life.sections.simulation")}</h2>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.primary}`}
              onClick={() => setRunning((value) => !value)}
            >
              {running ? t("life.buttons.pause") : t("life.buttons.start")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => {
                setRunning(false);
                stepSimulation();
              }}
            >
              {t("life.buttons.step")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={randomizeBoard}
            >
              {t("life.buttons.randomize")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.danger}`}
              onClick={clearBoard}
            >
              {t("life.buttons.clear")}
            </button>
          </div>

          <label className={styles.field}>
            <span>{t("life.labels.speed", { fps })}</span>
            <input
              type="range"
              min={1}
              max={45}
              value={fps}
              onChange={(event) => setFps(Number(event.target.value))}
            />
          </label>

          <label className={styles.field}>
            <span>
              {t("life.labels.randomDensity", {
                density: Math.round(randomDensity * 100)
              })}
            </span>
            <input
              type="range"
              min={1}
              max={90}
              value={Math.round(randomDensity * 100)}
              onChange={(event) => setRandomDensity(Number(event.target.value) / 100)}
            />
          </label>

          <div className={styles.toggleRow}>
            <label>
              <input
                type="checkbox"
                checked={wrapEdges}
                onChange={(event) => setWrapEdges(event.target.checked)}
              />
              {t("life.labels.wrapEdges")}
            </label>
            <label>
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(event) => setShowGrid(event.target.checked)}
              />
              {t("life.labels.showGrid")}
            </label>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>{t("life.sections.board")}</h2>

          <div className={styles.inlineFields}>
            <label className={styles.miniField}>
              <span>{t("life.labels.rows")}</span>
              <input
                type="number"
                min={10}
                max={160}
                value={draftRows}
                onChange={(event) => setDraftRows(event.target.value)}
              />
            </label>
            <label className={styles.miniField}>
              <span>{t("life.labels.cols")}</span>
              <input
                type="number"
                min={10}
                max={220}
                value={draftCols}
                onChange={(event) => setDraftCols(event.target.value)}
              />
            </label>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={applyBoardSize}
            >
              {t("life.buttons.apply")}
            </button>
          </div>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.ghost}`}
              onClick={() => resizeBoard(30, 50)}
            >
              {t("life.buttons.small")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.ghost}`}
              onClick={() => resizeBoard(44, 76)}
            >
              {t("life.buttons.medium")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.ghost}`}
              onClick={() => resizeBoard(62, 110)}
            >
              {t("life.buttons.large")}
            </button>
          </div>

          <label className={styles.field}>
            <span>{t("life.labels.cellSize", { size: cellSize })}</span>
            <input
              type="range"
              min={6}
              max={22}
              value={cellSize}
              onChange={(event) => setCellSize(Number(event.target.value))}
            />
          </label>

          <label className={styles.miniField}>
            <span>{t("life.labels.theme")}</span>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeName)}
            >
              <option value="arcade">{t("life.themes.arcade")}</option>
              <option value="sunset">{t("life.themes.sunset")}</option>
              <option value="terminal">{t("life.themes.terminal")}</option>
            </select>
          </label>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              onClick={() => {
                void copyShareLink();
              }}
            >
              {t("life.buttons.copyShare")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.ghost}`}
              onClick={clearLocalSave}
            >
              {t("life.buttons.clearSave")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.danger}`}
              onClick={resetDefaults}
            >
              {t("life.buttons.resetAll")}
            </button>
          </div>
        </section>

        <section className={styles.panel}>
          <h2>{t("life.sections.rulesTools")}</h2>

          <label className={styles.field}>
            <span>{t("life.labels.ruleString")}</span>
            <div className={styles.ruleRow}>
              <input
                type="text"
                value={ruleInput}
                onChange={(event) => setRuleInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyRuleInput();
                  }
                }}
                placeholder="B3/S23"
              />
              <button
                type="button"
                className={`${styles.button} ${styles.secondary}`}
                onClick={applyRuleInput}
              >
                {t("life.buttons.applyRule")}
              </button>
            </div>
          </label>

          <label className={styles.field}>
            <span>{t("life.labels.drawMode")}</span>
            <select
              value={drawMode}
              onChange={(event) => setDrawMode(event.target.value as DrawMode)}
            >
              <option value="toggle">{t("life.drawModes.toggle")}</option>
              <option value="paint">{t("life.drawModes.paint")}</option>
              <option value="erase">{t("life.drawModes.erase")}</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>{t("life.labels.patternStamp")}</span>
            <select
              value={selectedPattern}
              onChange={(event) => setSelectedPattern(event.target.value)}
            >
              <option value="none">{t("life.options.none")}</option>
              {Object.entries(PATTERNS).map(([key]) => (
                <option key={key} value={key}>
                  {getPatternName(key)}
                </option>
              ))}
            </select>
          </label>

          <p className={styles.patternHint}>{patternDescription}</p>

          <div className={styles.buttonRow}>
            <button
              type="button"
              className={`${styles.button} ${styles.secondary}`}
              disabled={selectedPattern === "none"}
              onClick={() => stampPatternAt(Math.floor(rows / 2), Math.floor(cols / 2))}
            >
              {t("life.buttons.stampCenter")}
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.ghost}`}
              onClick={() => setSelectedPattern("none")}
            >
              {t("life.buttons.exitStamp")}
            </button>
          </div>

          <p className={styles.legend}>
            {t("life.labels.themeAccent", {
              theme: t(`life.themes.${theme}`)
            })}
          </p>
        </section>
      </div>

      <p className={styles.message}>{message}</p>

      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={releasePointer}
          onPointerLeave={releasePointer}
          onPointerCancel={releasePointer}
          role="img"
          aria-label={t("life.aria.board")}
        />
      </div>

      <p className={styles.footer}>{t("life.footer.shortcuts")}</p>
    </div>
  );
}
