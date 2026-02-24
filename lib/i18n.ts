export const SUPPORTED_LOCALES = ["en", "zh", "es", "ja", "fr", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

type Params = Record<string, string | number>;
type DictionaryValue = string | { [key: string]: DictionaryValue };
type Dictionary = { [key: string]: DictionaryValue };

export const LOCALE_STORAGE_KEY = "grid-arcade-locale";

export const LANGUAGE_OPTION_LABELS: Record<Locale, string> = {
  en: "English",
  zh: "简体中文",
  es: "Español",
  ja: "日本語",
  fr: "Français",
  de: "Deutsch"
};

const DICTIONARIES: Record<Locale, Dictionary> = {
  en: {
    app: {
      brand: "Grid Arcade",
      navPlayLife: "Play Life",
      navPlayTetris: "Play Tetris",
      navPlaySpin: "Play Spin Puzzle",
      navPlayArrow: "Play Arrow Matrix",
      language: "Language"
    },
    home: {
      kicker: "Mini Game Hub",
      title: "Choose a game and play instantly in your browser.",
      description:
        "This site is built with Next.js and structured for expansion. Add more games by creating new routes under /games.",
      searchLabel: "Fuzzy Search",
      searchPlaceholder: "Try: life, conway, tetris, sand, physics...",
      noResults: "No matching game. Try broader keywords.",
      enterGame: "Enter Game",
      lifeTitle: "Conway's Game of Life",
      lifeSubtitle: "Classic cellular automaton",
      lifeDescription:
        "Build, simulate, and share infinite-world style life patterns with full controls.",
      tetrisTitle: "Tetra Fusion",
      tetrisSubtitle: "Classic, half-physics, full-sand modes",
      tetrisDescription:
        "Switch between classic Tetris, cascading gravity, and sand-style left-to-right linked elimination.",
      spinTitle: "Spin Sum Puzzle",
      spinSubtitle: "Rotate corners to match sums",
      spinDescription:
        "Click tiles to rotate the four corner balls clockwise and match each target sum.",
      arrowTitle: "Arrow Matrix",
      arrowSubtitle: "One-shot 8-direction chain puzzle",
      arrowDescription:
        "Pick one block to trigger a full chain reaction. Clear all blocks in a single attempt.",
      tags: {
        life: {
          rule: "B3/S23",
          pattern: "Pattern Stamps",
          share: "Share Links",
          shortcuts: "Keyboard Shortcuts"
        },
        tetris: {
          classic: "Classic Matrix",
          halfPhysics: "Cascade Gravity",
          fullPhysics: "Sand Fusion",
          guide: "Mode Guides"
        },
        spin: {
          logic: "Logic Grid",
          rotate: "Clockwise Rotate",
          solver: "Auto Solver",
          difficulty: "3 Difficulty Levels"
        },
        arrow: {
          chain: "Chain Reaction",
          eightDir: "8 Directions",
          oneShot: "One-shot Clear",
          difficulty: "5 Difficulty Levels"
        }
      }
    },
    lifePage: {
      featured: "Featured Game",
      title: "Conway's Game of Life",
      back: "Back to Lobby"
    },
    tetrisPage: {
      featured: "Featured Game",
      title: "Tetra Fusion",
      back: "Back to Lobby"
    },
    spinPage: {
      featured: "Featured Game",
      title: "Spin Sum Puzzle",
      back: "Back to Lobby"
    },
    arrowPage: {
      featured: "Featured Game",
      title: "Arrow Matrix",
      back: "Back to Lobby"
    },
    spin: {
      stats: {
        moves: "Moves",
        timer: "Time",
        matched: "Matched",
        status: "Status"
      },
      status: {
        playing: "In Progress",
        solving: "Auto Solving...",
        solved: "Solved"
      },
      controls: {
        title: "Puzzle",
        difficulty: "Difficulty",
        restart: "Restart",
        newPuzzle: "New Puzzle",
        solverTitle: "Solver",
        getAnswer: "Get Answer",
        stop: "Stop",
        speed: "Playback Speed"
      },
      difficulty: {
        easy: "Easy",
        medium: "Medium",
        hard: "Hard"
      },
      speed: {
        slow: "Slow",
        normal: "Normal",
        fast: "Fast"
      },
      guide: {
        title: "How To Play",
        hint: "Gray number is target. Red number is the current sum of four neighboring balls.",
        1: "Click a tile to rotate its four corner balls clockwise by 90 degrees.",
        2: "When current sum equals target, the red value turns green.",
        3: "Turn all tiles green to win, or use Get Answer to auto-play a valid solution."
      },
      modal: {
        title: "Great Solve!",
        description: "You solved it manually.",
        next: "Next Puzzle",
        close: "Close"
      },
      aria: {
        tile: "Tile row {row} col {col}, current {current}, target {target}"
      }
    },
    arrow: {
      stats: {
        remaining: "Blocks Left",
        attempts: "Attempts",
        board: "Board",
        status: "Status"
      },
      status: {
        idle: "Ready",
        animating: "Resolving Chain...",
        success: "Cleared",
        fail: "Failed"
      },
      controls: {
        title: "Puzzle Controls",
        difficulty: "Difficulty",
        restart: "Restart Puzzle",
        newPuzzle: "New Puzzle",
        showSolution: "Show One Solution"
      },
      difficulty: {
        easy: "Easy",
        normal: "Normal",
        hard: "Hard",
        expert: "Expert",
        master: "Master"
      },
      guide: {
        title: "How To Play",
        hint: "Choose one block as the start. A single cell may contain multiple arrows and each one is resolved.",
        1: "An activated block disappears first, then each arrow in that block searches the nearest alive block in its direction.",
        2: "Arrows support 8 directions: N, NE, E, SE, S, SW, W, NW.",
        3: "You win only if a single chain clears every block.",
        4: "If any block remains, the attempt fails and the board auto-resets to the initial puzzle."
      },
      messages: {
        success: "Perfect clear in one chain!",
        fail: "Chain ended before all blocks were cleared.",
        resetting: "Board reset to initial layout."
      },
      modal: {
        title: "Chain Success!",
        description: "You cleared all blocks in one attempt.",
        replay: "Replay This Puzzle",
        next: "Next Puzzle"
      },
      aria: {
        block: "Block row {row} col {col}, directions {dir}"
      },
      dir: {
        N: "up",
        NE: "up-right",
        E: "right",
        SE: "down-right",
        S: "down",
        SW: "down-left",
        W: "left",
        NW: "up-left"
      }
    },
    tetris: {
      messages: {
        modeSwitched: "Switched mode: {mode}",
        reset: "Game reset.",
        gameOver: "Game over. Reset to try again.",
        running: "Running",
        paused: "Paused"
      },
      stats: {
        score: "Score",
        level: "Level",
        clears: "Clears",
        combo: "Combo"
      },
      controls: {
        title: "Controls",
        pause: "Pause",
        resume: "Resume",
        reset: "Reset",
        speed: "Base Speed: {speed}"
      },
      mode: {
        title: "Mode",
        classic: {
          name: "Classic Matrix",
          desc: "Traditional Tetris rules, no extra physics.",
          guide: {
            1: "Rows clear only when they are fully filled.",
            2: "Placed blocks stay fixed unless a line clear shifts rows.",
            3: "Best for players who want pure classic rhythm."
          }
        },
        cascade: {
          name: "Cascade Gravity",
          desc: "Unsupported blocks above can keep falling naturally.",
          guide: {
            1: "Tetromino controls are classic: move, rotate, hard drop.",
            2: "After clears, floating blocks continue to drop under gravity.",
            3: "You can trigger chain clears by opening supports."
          }
        },
        sand: {
          name: "Sand Fusion",
          desc: "Blocks behave like sand and slip diagonally when possible.",
          guide: {
            1: "Locked cells flow one pixel at a time on a dense collision grid, then settle locally and quickly.",
            2: "A same-color region clears once it connects the left edge to the right edge.",
            3: "Build same-color bridges across the board while particles rearrange."
          }
        }
      },
      guide: {
        title: "How This Version Works",
        hint: "This variant changes core assumptions. Read mode notes before playing."
      },
      next: {
        title: "Next Queue"
      },
      shortcuts:
        "Shortcuts: Left/Right move, Up rotate, Down soft drop, Space hard drop, P pause."
    },
    life: {
      messages: {
        initial: "Click to paint. Space toggles run/pause. N steps one generation.",
        boardCleared: "Board cleared.",
        randomGenerated: "Random seed generated.",
        resized: "Resized board to {rows} x {cols}.",
        ruleFormat: "Rule format must look like B3/S23.",
        ruleSet: "Rule set to {rule}.",
        patternStamped: "{pattern} stamped.",
        reset: "Reset to defaults.",
        localSaveRemoved: "Local save removed.",
        shareCopied: "Share link copied to clipboard.",
        shareUrl: "Share URL: {url}",
        loadedFromLink: "Loaded from shared link.",
        restored: "Restored local save.",
        invalidSave: "Save data was invalid and was ignored.",
        saveError: "Could not save state locally."
      },
      stats: {
        generation: "Generation",
        liveCells: "Live Cells",
        board: "Board",
        rule: "Rule"
      },
      sections: {
        simulation: "Simulation",
        board: "Board",
        rulesTools: "Rules and Tools"
      },
      buttons: {
        start: "Start",
        pause: "Pause",
        step: "Step",
        randomize: "Randomize",
        clear: "Clear",
        apply: "Apply",
        small: "Small",
        medium: "Medium",
        large: "Large",
        copyShare: "Copy Share Link",
        clearSave: "Clear Save",
        resetAll: "Reset All",
        applyRule: "Apply Rule",
        stampCenter: "Stamp in Center",
        exitStamp: "Exit Stamp Mode"
      },
      labels: {
        speed: "Speed: {fps} FPS",
        randomDensity: "Random Density: {density}%",
        wrapEdges: "Wrap edges",
        showGrid: "Show grid",
        rows: "Rows",
        cols: "Cols",
        cellSize: "Cell Size: {size}px",
        theme: "Theme",
        ruleString: "Rule String",
        drawMode: "Draw Mode",
        patternStamp: "Pattern Stamp",
        themeAccent: "Theme accent: {theme}"
      },
      drawModes: {
        toggle: "Toggle",
        paint: "Paint Live Cells",
        erase: "Erase Cells"
      },
      options: {
        none: "None"
      },
      themes: {
        arcade: "Arcade",
        sunset: "Sunset",
        terminal: "Terminal"
      },
      patternHint: {
        none: "Select a template to stamp on click, or use draw mode to paint manually."
      },
      patterns: {
        block: {
          name: "Block",
          description: "Stable 2x2 still life."
        },
        blinker: {
          name: "Blinker",
          description: "A period-2 oscillator."
        },
        toad: {
          name: "Toad",
          description: "A compact period-2 oscillator."
        },
        glider: {
          name: "Glider",
          description: "Moves diagonally forever in open space."
        },
        lwss: {
          name: "Lightweight Spaceship",
          description: "A classic traveling spaceship."
        },
        rPentomino: {
          name: "R-pentomino",
          description: "Chaotic growth before stabilizing."
        },
        acorn: {
          name: "Acorn",
          description: "Tiny seed with long evolution."
        },
        gosper: {
          name: "Gosper Glider Gun",
          description: "Generates endless gliders."
        }
      },
      aria: {
        board: "Conway game board"
      },
      footer: {
        shortcuts: "Shortcuts: Space run/pause, N step, R randomize, C clear."
      }
    }
  },
  zh: {
    app: {
      brand: "格点游乐场",
      navPlayLife: "开始生命游戏",
      navPlayTetris: "开始俄罗斯方块",
      navPlaySpin: "开始旋转数谜",
      navPlayArrow: "开始箭阵谜域",
      language: "语言"
    },
    home: {
      kicker: "小游戏中心",
      title: "选择一个游戏，直接在浏览器里开玩。",
      description:
        "这个站点基于 Next.js 构建，并为后续扩展预留了结构。你可以在 /games 下新增路由来添加更多游戏。",
      searchLabel: "模糊搜索",
      searchPlaceholder: "试试：life、conway、tetris、物理、沙子…",
      noResults: "没有匹配到游戏，换个关键词试试。",
      enterGame: "进入游戏",
      lifeTitle: "康威生命游戏",
      lifeSubtitle: "经典细胞自动机",
      lifeDescription: "支持搭建、模拟、分享生命游戏图案，控制项完整。",
      tetrisTitle: "Tetra Fusion",
      tetrisSubtitle: "经典 / 半物理 / 全沙流模式",
      tetrisDescription: "在经典俄罗斯方块、级联重力和沙流左右连通消除三种玩法间切换。",
      spinTitle: "旋转数谜",
      spinSubtitle: "旋转四角，匹配目标和",
      spinDescription: "点击方块可顺时针旋转四个角上的数字球，让周围四球之和匹配目标值。",
      arrowTitle: "箭阵谜域",
      arrowSubtitle: "一次选择，八向连锁",
      arrowDescription: "选择一个起点方块触发箭头连锁，必须一次清空全盘才算成功。",
      tags: {
        life: {
          rule: "B3/S23",
          pattern: "图案印章",
          share: "分享链接",
          shortcuts: "键盘快捷键"
        },
        tetris: {
          classic: "经典矩阵",
          halfPhysics: "级联重力",
          fullPhysics: "沙流融合",
          guide: "模式指引"
        },
        spin: {
          logic: "逻辑数谜",
          rotate: "顺时针旋转",
          solver: "自动求解",
          difficulty: "三档难度"
        },
        arrow: {
          chain: "连锁反应",
          eightDir: "八方向箭头",
          oneShot: "一次清盘",
          difficulty: "五档难度"
        }
      }
    },
    lifePage: {
      featured: "当前主打",
      title: "康威生命游戏",
      back: "返回大厅"
    },
    tetrisPage: {
      featured: "当前主打",
      title: "Tetra Fusion",
      back: "返回大厅"
    },
    spinPage: {
      featured: "当前主打",
      title: "旋转数谜",
      back: "返回大厅"
    },
    arrowPage: {
      featured: "当前主打",
      title: "箭阵谜域",
      back: "返回大厅"
    },
    spin: {
      stats: {
        moves: "步数",
        timer: "计时",
        matched: "达成",
        status: "状态"
      },
      status: {
        playing: "挑战中",
        solving: "自动解题中...",
        solved: "已完成"
      },
      controls: {
        title: "题目控制",
        difficulty: "难度",
        restart: "重开本题",
        newPuzzle: "新题",
        solverTitle: "答案演示",
        getAnswer: "获取答案",
        stop: "停止",
        speed: "演示速度"
      },
      difficulty: {
        easy: "简单",
        medium: "中等",
        hard: "困难"
      },
      speed: {
        slow: "慢速",
        normal: "中速",
        fast: "快速"
      },
      guide: {
        title: "玩法说明",
        hint: "灰色是目标值，红色是当前四邻和；相等后会变绿色。",
        1: "点击任意方块，四个角上的白球会顺时针旋转 90°。",
        2: "当当前和等于目标值时，该方块从红色变为绿色。",
        3: "把所有方块都变绿即通关；也可点击“获取答案”自动演示。"
      },
      modal: {
        title: "挑战成功！",
        description: "你已手动解出本题。",
        next: "下一题",
        close: "关闭"
      },
      aria: {
        tile: "第{row}行第{col}列方块，当前和{current}，目标{target}"
      }
    },
    arrow: {
      stats: {
        remaining: "剩余方块",
        attempts: "尝试次数",
        board: "盘面",
        status: "状态"
      },
      status: {
        idle: "待挑战",
        animating: "连锁验证中...",
        success: "已清空",
        fail: "失败"
      },
      controls: {
        title: "题目控制",
        difficulty: "难度",
        restart: "重开本题",
        newPuzzle: "下一题",
        showSolution: "显示一个可行解"
      },
      difficulty: {
        easy: "简单",
        normal: "普通",
        hard: "困难",
        expert: "专家",
        master: "大师"
      },
      guide: {
        title: "玩法说明",
        hint: "只需选择一个起点，系统会完整播放并判定本次连锁结果；单格可含多个箭头。",
        1: "当前激活方块会先消失，再由该格中的所有箭头分别沿各自方向寻找最近的存活方块。",
        2: "箭头支持八方向：上、右上、右、右下、下、左下、左、左上。",
        3: "必须一次连锁清空所有方块才算成功。",
        4: "若有剩余方块则判定失败，并自动回到本题初始盘面。"
      },
      messages: {
        success: "一击清盘，挑战成功！",
        fail: "连锁结束但未清空全盘。",
        resetting: "已自动恢复到本题初始盘面。"
      },
      modal: {
        title: "连锁成功！",
        description: "你一次清空了所有方块。",
        replay: "重开本题",
        next: "下一题"
      },
      aria: {
        block: "第{row}行第{col}列方块，箭头方向组{dir}"
      },
      dir: {
        N: "上",
        NE: "右上",
        E: "右",
        SE: "右下",
        S: "下",
        SW: "左下",
        W: "左",
        NW: "左上"
      }
    },
    tetris: {
      messages: {
        modeSwitched: "模式已切换：{mode}",
        reset: "游戏已重置。",
        gameOver: "游戏结束，点击重置再来一局。",
        running: "进行中",
        paused: "已暂停"
      },
      stats: {
        score: "分数",
        level: "等级",
        clears: "消除",
        combo: "连击"
      },
      controls: {
        title: "控制",
        pause: "暂停",
        resume: "继续",
        reset: "重置",
        speed: "基础速度：{speed}"
      },
      mode: {
        title: "模式",
        classic: {
          name: "经典矩阵",
          desc: "传统俄罗斯方块规则，不附加物理效果。",
          guide: {
            1: "只有整行填满时才会消除。",
            2: "落地方块保持固定，除非消行后整体位移。",
            3: "适合追求经典节奏的玩家。"
          }
        },
        cascade: {
          name: "级联重力",
          desc: "上层悬空方块会继续自然下落。",
          guide: {
            1: "方块操作仍然是经典手感：移动、旋转、速降。",
            2: "消行后，失去支撑的块会继续往下掉。",
            3: "可以利用“抽支撑”制造连锁消除。"
          }
        },
        sand: {
          name: "沙流融合",
          desc: "方块像沙子一样流动，可沿斜向滑落。",
          guide: {
            1: "落地单元在高分辨率碰撞网格中按像素流动，并在局部快速收敛稳定。",
            2: "同色区域只要从左边连到右边就会消除。",
            3: "目标是搭出从左到右的同色连通桥，并利用沙流持续重排。"
          }
        }
      },
      guide: {
        title: "玩法指引",
        hint: "该游戏含特殊规则，建议先看对应模式说明再上手。"
      },
      next: {
        title: "下一个队列"
      },
      shortcuts:
        "快捷键：左右移动，上旋转，下软降，空格硬降，P 暂停。"
    },
    life: {
      messages: {
        initial: "点击可绘制。空格开始/暂停，N 单步推进一代。",
        boardCleared: "棋盘已清空。",
        randomGenerated: "已生成随机种子。",
        resized: "棋盘已调整为 {rows} x {cols}。",
        ruleFormat: "规则格式必须类似 B3/S23。",
        ruleSet: "规则已设置为 {rule}。",
        patternStamped: "已盖章：{pattern}。",
        reset: "已重置为默认配置。",
        localSaveRemoved: "本地存档已删除。",
        shareCopied: "分享链接已复制到剪贴板。",
        shareUrl: "分享链接：{url}",
        loadedFromLink: "已从分享链接加载。",
        restored: "已恢复本地存档。",
        invalidSave: "存档数据无效，已忽略。",
        saveError: "本地保存失败。"
      },
      stats: {
        generation: "代数",
        liveCells: "活细胞",
        board: "棋盘",
        rule: "规则"
      },
      sections: {
        simulation: "模拟",
        board: "棋盘",
        rulesTools: "规则与工具"
      },
      buttons: {
        start: "开始",
        pause: "暂停",
        step: "单步",
        randomize: "随机",
        clear: "清空",
        apply: "应用",
        small: "小",
        medium: "中",
        large: "大",
        copyShare: "复制分享链接",
        clearSave: "清除存档",
        resetAll: "全部重置",
        applyRule: "应用规则",
        stampCenter: "中心盖章",
        exitStamp: "退出盖章模式"
      },
      labels: {
        speed: "速度：{fps} FPS",
        randomDensity: "随机密度：{density}%",
        wrapEdges: "边界环绕",
        showGrid: "显示网格",
        rows: "行",
        cols: "列",
        cellSize: "细胞大小：{size}px",
        theme: "主题",
        ruleString: "规则字符串",
        drawMode: "绘制模式",
        patternStamp: "图案盖章",
        themeAccent: "主题强调色：{theme}"
      },
      drawModes: {
        toggle: "切换",
        paint: "绘制活细胞",
        erase: "擦除细胞"
      },
      options: {
        none: "无"
      },
      themes: {
        arcade: "街机",
        sunset: "晚霞",
        terminal: "终端"
      },
      patternHint: {
        none: "选择模板后点击棋盘即可盖章，或使用绘制模式手动画。"
      },
      patterns: {
        block: {
          name: "方块",
          description: "稳定的 2x2 静态结构。"
        },
        blinker: {
          name: "闪烁器",
          description: "周期为 2 的振荡器。"
        },
        toad: {
          name: "蟾蜍",
          description: "紧凑型周期 2 振荡器。"
        },
        glider: {
          name: "滑翔机",
          description: "在开阔空间可持续对角移动。"
        },
        lwss: {
          name: "轻型飞船",
          description: "经典移动飞船。"
        },
        rPentomino: {
          name: "R-五连块",
          description: "先混沌增长再趋于稳定。"
        },
        acorn: {
          name: "橡子",
          description: "小种子可演化很久。"
        },
        gosper: {
          name: "高斯帕滑翔机枪",
          description: "持续发射滑翔机。"
        }
      },
      aria: {
        board: "生命游戏棋盘"
      },
      footer: {
        shortcuts: "快捷键：空格开始/暂停，N 单步，R 随机，C 清空。"
      }
    }
  },
  es: {
    app: {
      brand: "Arcade de Cuadrícula",
      navPlayLife: "Jugar Life",
      navPlayTetris: "Jugar Tetris",
      navPlaySpin: "Jugar Giro Suma",
      navPlayArrow: "Jugar Matriz de Flechas",
      language: "Idioma"
    },
    home: {
      kicker: "Centro de Minijuegos",
      title: "Elige un juego y juega al instante en tu navegador.",
      description:
        "Este sitio está hecho con Next.js y preparado para crecer. Agrega más juegos creando nuevas rutas en /games.",
      searchLabel: "Búsqueda Difusa",
      searchPlaceholder: "Prueba: life, conway, tetris, arena, física...",
      noResults: "No hay juegos coincidentes. Prueba otras palabras.",
      enterGame: "Entrar",
      lifeTitle: "Juego de la Vida de Conway",
      lifeSubtitle: "Autómata celular clásico",
      lifeDescription:
        "Construye, simula y comparte patrones del Juego de la Vida con controles completos.",
      tetrisTitle: "Tetra Fusion",
      tetrisSubtitle: "Clásico, semifizica y arena total",
      tetrisDescription:
        "Alterna entre Tetris clásico, gravedad en cascada y eliminación por conexión del mismo color de izquierda a derecha en modo arena.",
      spinTitle: "Rompecabezas Giro Suma",
      spinSubtitle: "Gira esquinas para igualar sumas",
      spinDescription:
        "Pulsa un bloque para girar en sentido horario las cuatro bolas de esquina y hacer coincidir la suma objetivo.",
      arrowTitle: "Matriz de Flechas",
      arrowSubtitle: "Cadena de 8 direcciones en un solo intento",
      arrowDescription:
        "Elige un solo bloque para activar la cadena. Debes limpiar todo el tablero en una sola jugada.",
      tags: {
        life: {
          rule: "B3/S23",
          pattern: "Sellos de Patrones",
          share: "Enlaces para Compartir",
          shortcuts: "Atajos de Teclado"
        },
        tetris: {
          classic: "Matriz Clásica",
          halfPhysics: "Gravedad en Cascada",
          fullPhysics: "Fusión de Arena",
          guide: "Guía de Modos"
        },
        spin: {
          logic: "Cuadrícula Lógica",
          rotate: "Giro Horario",
          solver: "Solución Automática",
          difficulty: "3 Niveles"
        },
        arrow: {
          chain: "Reacción en Cadena",
          eightDir: "8 Direcciones",
          oneShot: "Limpieza Única",
          difficulty: "5 Niveles"
        }
      }
    },
    lifePage: {
      featured: "Juego Destacado",
      title: "Juego de la Vida de Conway",
      back: "Volver al Inicio"
    },
    tetrisPage: {
      featured: "Juego Destacado",
      title: "Tetra Fusion",
      back: "Volver al Inicio"
    },
    spinPage: {
      featured: "Juego Destacado",
      title: "Rompecabezas Giro Suma",
      back: "Volver al Inicio"
    },
    arrowPage: {
      featured: "Juego Destacado",
      title: "Matriz de Flechas",
      back: "Volver al Inicio"
    },
    spin: {
      stats: {
        moves: "Movimientos",
        timer: "Tiempo",
        matched: "Coincidencias",
        status: "Estado"
      },
      status: {
        playing: "En curso",
        solving: "Resolviendo automaticamente...",
        solved: "Resuelto"
      },
      controls: {
        title: "Puzzle",
        difficulty: "Dificultad",
        restart: "Reiniciar",
        newPuzzle: "Nuevo Puzzle",
        solverTitle: "Solucionador",
        getAnswer: "Obtener Respuesta",
        stop: "Detener",
        speed: "Velocidad"
      },
      difficulty: {
        easy: "Facil",
        medium: "Medio",
        hard: "Dificil"
      },
      speed: {
        slow: "Lento",
        normal: "Normal",
        fast: "Rapido"
      },
      guide: {
        title: "Como Jugar",
        hint: "El numero gris es el objetivo. El rojo es la suma actual de cuatro bolas vecinas.",
        1: "Haz clic en un bloque para rotar 90 grados en sentido horario sus cuatro esquinas.",
        2: "Cuando la suma actual coincide con el objetivo, el valor rojo se vuelve verde.",
        3: "Convierte todos los bloques en verde para ganar, o usa Obtener Respuesta."
      },
      modal: {
        title: "Excelente!",
        description: "Resolviste el puzzle manualmente.",
        next: "Siguiente Puzzle",
        close: "Cerrar"
      },
      aria: {
        tile: "Bloque fila {row} columna {col}, actual {current}, objetivo {target}"
      }
    },
    arrow: {
      stats: {
        remaining: "Bloques Restantes",
        attempts: "Intentos",
        board: "Tablero",
        status: "Estado"
      },
      status: {
        idle: "Listo",
        animating: "Resolviendo cadena...",
        success: "Completado",
        fail: "Fallido"
      },
      controls: {
        title: "Controles",
        difficulty: "Dificultad",
        restart: "Reiniciar Puzzle",
        newPuzzle: "Nuevo Puzzle",
        showSolution: "Mostrar una solución"
      },
      difficulty: {
        easy: "Fácil",
        normal: "Normal",
        hard: "Difícil",
        expert: "Experto",
        master: "Maestro"
      },
      guide: {
        title: "Cómo Jugar",
        hint: "Elige un bloque inicial y el sistema reproducirá toda la cadena con animación completa.",
        1: "El bloque activado se elimina primero y su flecha busca el bloque vivo más cercano en esa dirección.",
        2: "Hay 8 direcciones posibles: N, NE, E, SE, S, SW, W, NW.",
        3: "Solo ganas si una cadena elimina todos los bloques.",
        4: "Si queda cualquier bloque, fallas y el tablero vuelve al estado inicial."
      },
      messages: {
        success: "¡Limpieza perfecta en una cadena!",
        fail: "La cadena terminó antes de limpiar todo.",
        resetting: "Tablero restaurado al estado inicial."
      },
      modal: {
        title: "¡Cadena Exitosa!",
        description: "Limpiaste todos los bloques en un intento.",
        replay: "Repetir Este Puzzle",
        next: "Siguiente Puzzle"
      },
      aria: {
        block: "Bloque fila {row} columna {col}, dirección {dir}"
      },
      dir: {
        N: "arriba",
        NE: "arriba derecha",
        E: "derecha",
        SE: "abajo derecha",
        S: "abajo",
        SW: "abajo izquierda",
        W: "izquierda",
        NW: "arriba izquierda"
      }
    },
    life: {
      messages: {
        initial: "Haz clic para dibujar. Espacio inicia/pausa. N avanza una generación.",
        boardCleared: "Tablero limpiado.",
        randomGenerated: "Semilla aleatoria generada.",
        resized: "Tablero redimensionado a {rows} x {cols}.",
        ruleFormat: "El formato debe ser como B3/S23.",
        ruleSet: "Regla establecida en {rule}.",
        patternStamped: "Patrón aplicado: {pattern}.",
        reset: "Valores restablecidos.",
        localSaveRemoved: "Guardado local eliminado.",
        shareCopied: "Enlace copiado al portapapeles.",
        shareUrl: "URL para compartir: {url}",
        loadedFromLink: "Cargado desde enlace compartido.",
        restored: "Guardado local restaurado.",
        invalidSave: "Los datos guardados eran inválidos y se ignoraron.",
        saveError: "No se pudo guardar localmente."
      },
      stats: {
        generation: "Generación",
        liveCells: "Células Vivas",
        board: "Tablero",
        rule: "Regla"
      },
      sections: {
        simulation: "Simulación",
        board: "Tablero",
        rulesTools: "Reglas y Herramientas"
      },
      buttons: {
        start: "Iniciar",
        pause: "Pausar",
        step: "Paso",
        randomize: "Aleatorio",
        clear: "Limpiar",
        apply: "Aplicar",
        small: "Pequeño",
        medium: "Mediano",
        large: "Grande",
        copyShare: "Copiar Enlace",
        clearSave: "Borrar Guardado",
        resetAll: "Restablecer Todo",
        applyRule: "Aplicar Regla",
        stampCenter: "Centrar Patrón",
        exitStamp: "Salir de Sellos"
      },
      labels: {
        speed: "Velocidad: {fps} FPS",
        randomDensity: "Densidad Aleatoria: {density}%",
        wrapEdges: "Bordes cíclicos",
        showGrid: "Mostrar cuadrícula",
        rows: "Filas",
        cols: "Columnas",
        cellSize: "Tamaño de celda: {size}px",
        theme: "Tema",
        ruleString: "Cadena de regla",
        drawMode: "Modo de dibujo",
        patternStamp: "Sello de patrón",
        themeAccent: "Acento del tema: {theme}"
      },
      drawModes: {
        toggle: "Alternar",
        paint: "Pintar células vivas",
        erase: "Borrar células"
      },
      options: {
        none: "Ninguno"
      },
      themes: {
        arcade: "Arcade",
        sunset: "Atardecer",
        terminal: "Terminal"
      },
      patternHint: {
        none: "Elige una plantilla para sellarla con clic o usa el modo de dibujo manual."
      },
      patterns: {
        block: {
          name: "Bloque",
          description: "Estructura estable 2x2."
        },
        blinker: {
          name: "Intermitente",
          description: "Oscilador de período 2."
        },
        toad: {
          name: "Sapo",
          description: "Oscilador compacto de período 2."
        },
        glider: {
          name: "Planeador",
          description: "Se mueve en diagonal indefinidamente."
        },
        lwss: {
          name: "Nave ligera",
          description: "Nave clásica viajera."
        },
        rPentomino: {
          name: "R-pentominó",
          description: "Crecimiento caótico antes de estabilizarse."
        },
        acorn: {
          name: "Bellota",
          description: "Semilla pequeña con evolución larga."
        },
        gosper: {
          name: "Cañón de planeadores",
          description: "Genera planeadores sin fin."
        }
      },
      aria: {
        board: "tablero del Juego de la Vida"
      },
      footer: {
        shortcuts: "Atajos: Espacio iniciar/pausar, N paso, R aleatorio, C limpiar."
      }
    }
  },
  ja: {
    app: {
      brand: "グリッドアーケード",
      navPlayLife: "ライフゲーム",
      navPlayTetris: "テトリス",
      navPlaySpin: "回転数パズル",
      navPlayArrow: "矢印マトリクス",
      language: "言語"
    },
    home: {
      kicker: "ミニゲームハブ",
      title: "ゲームを選んで、ブラウザですぐ遊べます。",
      description:
        "このサイトは Next.js で構築され、拡張しやすい構成になっています。/games 以下にルートを追加してゲームを増やせます。",
      searchLabel: "あいまい検索",
      searchPlaceholder: "例: life、conway、tetris、砂、物理...",
      noResults: "一致するゲームが見つかりません。別のキーワードを試してください。",
      enterGame: "ゲーム開始",
      lifeTitle: "コンウェイのライフゲーム",
      lifeSubtitle: "古典的セル・オートマトン",
      lifeDescription: "ライフゲームのパターンを作成・シミュレート・共有できます。",
      tetrisTitle: "Tetra Fusion",
      tetrisSubtitle: "クラシック / 半物理 / フル砂モード",
      tetrisDescription:
        "クラシックテトリス、連鎖重力、砂のような左端から右端まで同色連結で消えるモードを切り替えて遊べます。",
      spinTitle: "回転数パズル",
      spinSubtitle: "四隅を回して目標和に合わせる",
      spinDescription:
        "マスをクリックすると四隅の数字ボールが時計回りに回転し、目標の合計に合わせます。",
      arrowTitle: "矢印マトリクス",
      arrowSubtitle: "8方向ワンショット連鎖パズル",
      arrowDescription:
        "開始マスを1つ選ぶと連鎖が始まります。1回で全ブロックを消せばクリアです。",
      tags: {
        life: {
          rule: "B3/S23",
          pattern: "パターンスタンプ",
          share: "共有リンク",
          shortcuts: "キーボードショートカット"
        },
        tetris: {
          classic: "クラシックマトリクス",
          halfPhysics: "カスケード重力",
          fullPhysics: "サンドフュージョン",
          guide: "モードガイド"
        },
        spin: {
          logic: "ロジックグリッド",
          rotate: "時計回り回転",
          solver: "自動解答",
          difficulty: "3段階難易度"
        },
        arrow: {
          chain: "連鎖反応",
          eightDir: "8方向",
          oneShot: "ワンショット全消し",
          difficulty: "5段階難易度"
        }
      }
    },
    lifePage: {
      featured: "注目ゲーム",
      title: "コンウェイのライフゲーム",
      back: "ロビーに戻る"
    },
    tetrisPage: {
      featured: "注目ゲーム",
      title: "Tetra Fusion",
      back: "ロビーに戻る"
    },
    spinPage: {
      featured: "注目ゲーム",
      title: "回転数パズル",
      back: "ロビーに戻る"
    },
    arrowPage: {
      featured: "注目ゲーム",
      title: "矢印マトリクス",
      back: "ロビーに戻る"
    },
    spin: {
      stats: {
        moves: "手数",
        timer: "タイム",
        matched: "一致",
        status: "状態"
      },
      status: {
        playing: "プレイ中",
        solving: "自動解答中...",
        solved: "クリア"
      },
      controls: {
        title: "パズル",
        difficulty: "難易度",
        restart: "リスタート",
        newPuzzle: "新しい問題",
        solverTitle: "解答",
        getAnswer: "答えを見る",
        stop: "停止",
        speed: "再生速度"
      },
      difficulty: {
        easy: "初級",
        medium: "中級",
        hard: "上級"
      },
      speed: {
        slow: "遅い",
        normal: "普通",
        fast: "速い"
      },
      guide: {
        title: "遊び方",
        hint: "灰色は目標値、赤色は周囲4つのボールの現在合計です。",
        1: "マスをクリックすると四隅のボールが時計回りに90度回転します。",
        2: "現在合計が目標値と一致すると赤色が緑色に変わります。",
        3: "全マスを緑にするとクリア。答えを見るで自動手順も確認できます。"
      },
      modal: {
        title: "クリア！",
        description: "手動で問題を解きました。",
        next: "次の問題",
        close: "閉じる"
      },
      aria: {
        tile: "{row}行{col}列のマス、現在{current}、目標{target}"
      }
    },
    arrow: {
      stats: {
        remaining: "残りブロック",
        attempts: "挑戦回数",
        board: "盤面",
        status: "状態"
      },
      status: {
        idle: "待機中",
        animating: "連鎖検証中...",
        success: "クリア",
        fail: "失敗"
      },
      controls: {
        title: "パズル操作",
        difficulty: "難易度",
        restart: "この問題をリスタート",
        newPuzzle: "新しい問題",
        showSolution: "解の候補を表示"
      },
      difficulty: {
        easy: "初級",
        normal: "通常",
        hard: "上級",
        expert: "エキスパート",
        master: "マスター"
      },
      guide: {
        title: "遊び方",
        hint: "開始ブロックを1つ選ぶと、連鎖判定がアニメーション付きで再生されます。",
        1: "有効化されたブロックは先に消え、その矢印方向に最も近い生存ブロックを探します。",
        2: "矢印は8方向（N, NE, E, SE, S, SW, W, NW）に対応します。",
        3: "1回の連鎖で全ブロックを消せた場合のみ成功です。",
        4: "1つでも残ると失敗となり、盤面は初期配置へ自動リセットされます。"
      },
      messages: {
        success: "1連鎖で全消し成功！",
        fail: "連鎖が終了し、ブロックが残りました。",
        resetting: "初期盤面にリセットしました。"
      },
      modal: {
        title: "連鎖成功！",
        description: "1回の挑戦で全ブロックを消しました。",
        replay: "この問題を再挑戦",
        next: "次の問題"
      },
      aria: {
        block: "{row}行{col}列のブロック、方向 {dir}"
      },
      dir: {
        N: "上",
        NE: "右上",
        E: "右",
        SE: "右下",
        S: "下",
        SW: "左下",
        W: "左",
        NW: "左上"
      }
    },
    life: {
      messages: {
        initial: "クリックで描画。Space で開始/停止、N で1世代進む。",
        boardCleared: "盤面をクリアしました。",
        randomGenerated: "ランダム配置を生成しました。",
        resized: "盤面サイズを {rows} x {cols} に変更しました。",
        ruleFormat: "ルール形式は B3/S23 のように入力してください。",
        ruleSet: "ルールを {rule} に設定しました。",
        patternStamped: "{pattern} を配置しました。",
        reset: "初期設定にリセットしました。",
        localSaveRemoved: "ローカル保存を削除しました。",
        shareCopied: "共有リンクをクリップボードにコピーしました。",
        shareUrl: "共有 URL: {url}",
        loadedFromLink: "共有リンクから読み込みました。",
        restored: "ローカル保存を復元しました。",
        invalidSave: "保存データが無効だったため無視しました。",
        saveError: "ローカル保存に失敗しました。"
      },
      stats: {
        generation: "世代",
        liveCells: "生存セル",
        board: "盤面",
        rule: "ルール"
      },
      sections: {
        simulation: "シミュレーション",
        board: "盤面",
        rulesTools: "ルールとツール"
      },
      buttons: {
        start: "開始",
        pause: "停止",
        step: "1ステップ",
        randomize: "ランダム",
        clear: "クリア",
        apply: "適用",
        small: "小",
        medium: "中",
        large: "大",
        copyShare: "共有リンクをコピー",
        clearSave: "保存を削除",
        resetAll: "すべてリセット",
        applyRule: "ルール適用",
        stampCenter: "中央に配置",
        exitStamp: "スタンプ終了"
      },
      labels: {
        speed: "速度: {fps} FPS",
        randomDensity: "ランダム密度: {density}%",
        wrapEdges: "端をループ",
        showGrid: "グリッド表示",
        rows: "行",
        cols: "列",
        cellSize: "セルサイズ: {size}px",
        theme: "テーマ",
        ruleString: "ルール文字列",
        drawMode: "描画モード",
        patternStamp: "パターンスタンプ",
        themeAccent: "テーマアクセント: {theme}"
      },
      drawModes: {
        toggle: "切り替え",
        paint: "生存セルを描く",
        erase: "セルを消去"
      },
      options: {
        none: "なし"
      },
      themes: {
        arcade: "アーケード",
        sunset: "サンセット",
        terminal: "ターミナル"
      },
      patternHint: {
        none: "テンプレートを選んでクリックで配置、または描画モードで手動編集。"
      },
      patterns: {
        block: {
          name: "ブロック",
          description: "安定した 2x2 の静止形。"
        },
        blinker: {
          name: "ブリンカー",
          description: "周期2の振動子。"
        },
        toad: {
          name: "トード",
          description: "コンパクトな周期2振動子。"
        },
        glider: {
          name: "グライダー",
          description: "対角方向に移動し続ける。"
        },
        lwss: {
          name: "軽量宇宙船",
          description: "古典的な移動宇宙船。"
        },
        rPentomino: {
          name: "Rペントミノ",
          description: "安定化までに混沌と成長。"
        },
        acorn: {
          name: "どんぐり",
          description: "小さな種が長く進化する。"
        },
        gosper: {
          name: "ゴスパーグライダーガン",
          description: "グライダーを無限生成。"
        }
      },
      aria: {
        board: "ライフゲーム盤面"
      },
      footer: {
        shortcuts: "ショートカット: Space 開始/停止、N ステップ、R ランダム、C クリア。"
      }
    }
  },
  fr: {
    app: {
      brand: "Arcade Grille",
      navPlayLife: "Jouer à Life",
      navPlayTetris: "Jouer à Tetris",
      navPlaySpin: "Jouer Rotation Somme",
      navPlayArrow: "Jouer Matrice Fléchée",
      language: "Langue"
    },
    home: {
      kicker: "Hub de Mini-jeux",
      title: "Choisissez un jeu et jouez instantanément dans votre navigateur.",
      description:
        "Ce site est construit avec Next.js et prêt à évoluer. Ajoutez d'autres jeux en créant des routes sous /games.",
      searchLabel: "Recherche Floue",
      searchPlaceholder: "Essayez : life, conway, tetris, sable, physique...",
      noResults: "Aucun jeu correspondant. Essayez d'autres mots-clés.",
      enterGame: "Entrer",
      lifeTitle: "Jeu de la Vie de Conway",
      lifeSubtitle: "Automate cellulaire classique",
      lifeDescription:
        "Construisez, simulez et partagez des motifs du Jeu de la Vie avec des contrôles complets.",
      tetrisTitle: "Tetra Fusion",
      tetrisSubtitle: "Classique, semi-physique, sable total",
      tetrisDescription:
        "Alternez entre Tetris classique, gravité en cascade et élimination par connexion de même couleur de gauche à droite en mode sable.",
      spinTitle: "Enigme Rotation Somme",
      spinSubtitle: "Tournez les coins pour atteindre la somme",
      spinDescription:
        "Cliquez sur une case pour faire tourner dans le sens horaire ses quatre billes d'angle et atteindre les sommes cibles.",
      arrowTitle: "Matrice Fléchée",
      arrowSubtitle: "Puzzle à chaîne 8 directions en un seul coup",
      arrowDescription:
        "Choisissez une case de départ pour lancer la chaîne. Il faut vider tout le plateau en une tentative.",
      tags: {
        life: {
          rule: "B3/S23",
          pattern: "Tampons de Motifs",
          share: "Liens de Partage",
          shortcuts: "Raccourcis Clavier"
        },
        tetris: {
          classic: "Matrice Classique",
          halfPhysics: "Gravité en Cascade",
          fullPhysics: "Fusion Sable",
          guide: "Guide des Modes"
        },
        spin: {
          logic: "Grille Logique",
          rotate: "Rotation Horaire",
          solver: "Resolution Auto",
          difficulty: "3 Niveaux"
        },
        arrow: {
          chain: "Réaction en Chaîne",
          eightDir: "8 Directions",
          oneShot: "Nettoyage Unique",
          difficulty: "5 Niveaux"
        }
      }
    },
    lifePage: {
      featured: "Jeu Vedette",
      title: "Jeu de la Vie de Conway",
      back: "Retour au Lobby"
    },
    tetrisPage: {
      featured: "Jeu Vedette",
      title: "Tetra Fusion",
      back: "Retour au Lobby"
    },
    spinPage: {
      featured: "Jeu Vedette",
      title: "Enigme Rotation Somme",
      back: "Retour au Lobby"
    },
    arrowPage: {
      featured: "Jeu Vedette",
      title: "Matrice Fléchée",
      back: "Retour au Lobby"
    },
    spin: {
      stats: {
        moves: "Coups",
        timer: "Temps",
        matched: "Valides",
        status: "Etat"
      },
      status: {
        playing: "En cours",
        solving: "Resolution automatique...",
        solved: "Resolue"
      },
      controls: {
        title: "Puzzle",
        difficulty: "Difficulte",
        restart: "Recommencer",
        newPuzzle: "Nouveau Puzzle",
        solverTitle: "Solveur",
        getAnswer: "Voir la Solution",
        stop: "Arreter",
        speed: "Vitesse"
      },
      difficulty: {
        easy: "Facile",
        medium: "Moyen",
        hard: "Difficile"
      },
      speed: {
        slow: "Lente",
        normal: "Normale",
        fast: "Rapide"
      },
      guide: {
        title: "Regles",
        hint: "Le nombre gris est la cible. Le rouge est la somme actuelle des 4 billes voisines.",
        1: "Cliquez sur une case pour tourner ses quatre coins de 90 degrés dans le sens horaire.",
        2: "Quand la somme actuelle atteint la cible, la valeur rouge devient verte.",
        3: "Rendez toutes les cases vertes pour gagner, ou lancez Voir la Solution."
      },
      modal: {
        title: "Bravo !",
        description: "Vous avez resolu ce puzzle manuellement.",
        next: "Puzzle Suivant",
        close: "Fermer"
      },
      aria: {
        tile: "Case ligne {row} colonne {col}, actuel {current}, cible {target}"
      }
    },
    arrow: {
      stats: {
        remaining: "Blocs Restants",
        attempts: "Tentatives",
        board: "Plateau",
        status: "Statut"
      },
      status: {
        idle: "Prêt",
        animating: "Résolution de la chaîne...",
        success: "Réussi",
        fail: "Échec"
      },
      controls: {
        title: "Contrôles",
        difficulty: "Difficulté",
        restart: "Rejouer ce puzzle",
        newPuzzle: "Nouveau Puzzle",
        showSolution: "Afficher une solution"
      },
      difficulty: {
        easy: "Facile",
        normal: "Normal",
        hard: "Difficile",
        expert: "Expert",
        master: "Maître"
      },
      guide: {
        title: "Règles",
        hint: "Choisissez un bloc de départ. Le système joue toute la chaîne avec animation complète.",
        1: "Le bloc activé disparaît d'abord, puis sa flèche cherche le bloc vivant le plus proche dans cette direction.",
        2: "Les flèches couvrent 8 directions : N, NE, E, SE, S, SW, W, NW.",
        3: "Vous gagnez uniquement si une seule chaîne supprime tous les blocs.",
        4: "S'il reste des blocs, c'est un échec et le plateau revient automatiquement à l'état initial."
      },
      messages: {
        success: "Nettoyage parfait en une chaîne !",
        fail: "La chaîne s'est terminée avant de tout supprimer.",
        resetting: "Plateau réinitialisé à la configuration initiale."
      },
      modal: {
        title: "Chaîne Réussie !",
        description: "Vous avez effacé tous les blocs en une tentative.",
        replay: "Rejouer ce Puzzle",
        next: "Puzzle Suivant"
      },
      aria: {
        block: "Bloc ligne {row} colonne {col}, direction {dir}"
      },
      dir: {
        N: "haut",
        NE: "haut droite",
        E: "droite",
        SE: "bas droite",
        S: "bas",
        SW: "bas gauche",
        W: "gauche",
        NW: "haut gauche"
      }
    },
    life: {
      messages: {
        initial: "Cliquez pour dessiner. Espace lance/pause. N avance d'une génération.",
        boardCleared: "Plateau effacé.",
        randomGenerated: "Graine aléatoire générée.",
        resized: "Plateau redimensionné en {rows} x {cols}.",
        ruleFormat: "Le format doit être comme B3/S23.",
        ruleSet: "Règle définie sur {rule}.",
        patternStamped: "Motif appliqué : {pattern}.",
        reset: "Réinitialisé aux valeurs par défaut.",
        localSaveRemoved: "Sauvegarde locale supprimée.",
        shareCopied: "Lien de partage copié dans le presse-papiers.",
        shareUrl: "URL de partage : {url}",
        loadedFromLink: "Chargé depuis un lien partagé.",
        restored: "Sauvegarde locale restaurée.",
        invalidSave: "Données de sauvegarde invalides, ignorées.",
        saveError: "Impossible d'enregistrer localement."
      },
      stats: {
        generation: "Génération",
        liveCells: "Cellules Vivantes",
        board: "Plateau",
        rule: "Règle"
      },
      sections: {
        simulation: "Simulation",
        board: "Plateau",
        rulesTools: "Règles et Outils"
      },
      buttons: {
        start: "Démarrer",
        pause: "Pause",
        step: "Pas",
        randomize: "Aléatoire",
        clear: "Effacer",
        apply: "Appliquer",
        small: "Petit",
        medium: "Moyen",
        large: "Grand",
        copyShare: "Copier le Lien",
        clearSave: "Effacer la Sauvegarde",
        resetAll: "Tout Réinitialiser",
        applyRule: "Appliquer la Règle",
        stampCenter: "Tamponner au Centre",
        exitStamp: "Quitter le Mode Tampon"
      },
      labels: {
        speed: "Vitesse : {fps} FPS",
        randomDensity: "Densité Aléatoire : {density}%",
        wrapEdges: "Bords cycliques",
        showGrid: "Afficher la grille",
        rows: "Lignes",
        cols: "Colonnes",
        cellSize: "Taille de cellule : {size}px",
        theme: "Thème",
        ruleString: "Chaîne de règle",
        drawMode: "Mode dessin",
        patternStamp: "Tampon de motif",
        themeAccent: "Accent du thème : {theme}"
      },
      drawModes: {
        toggle: "Basculer",
        paint: "Peindre les cellules vivantes",
        erase: "Effacer les cellules"
      },
      options: {
        none: "Aucun"
      },
      themes: {
        arcade: "Arcade",
        sunset: "Coucher de soleil",
        terminal: "Terminal"
      },
      patternHint: {
        none: "Choisissez un modèle à tamponner au clic, ou utilisez le mode dessin manuel."
      },
      patterns: {
        block: {
          name: "Bloc",
          description: "Forme stable 2x2."
        },
        blinker: {
          name: "Clignoteur",
          description: "Oscillateur de période 2."
        },
        toad: {
          name: "Crapaud",
          description: "Oscillateur compact de période 2."
        },
        glider: {
          name: "Planeur",
          description: "Se déplace en diagonale indéfiniment."
        },
        lwss: {
          name: "Vaisseau léger",
          description: "Vaisseau voyageur classique."
        },
        rPentomino: {
          name: "R-pentomino",
          description: "Croissance chaotique avant stabilisation."
        },
        acorn: {
          name: "Gland",
          description: "Petite graine à longue évolution."
        },
        gosper: {
          name: "Canon à planeurs",
          description: "Génère des planeurs sans fin."
        }
      },
      aria: {
        board: "plateau du Jeu de la Vie"
      },
      footer: {
        shortcuts: "Raccourcis : Espace lancer/pause, N pas, R aléatoire, C effacer."
      }
    }
  },
  de: {
    app: {
      brand: "Grid Arcade",
      navPlayLife: "Life spielen",
      navPlayTetris: "Tetris spielen",
      navPlaySpin: "Drehsummen spielen",
      navPlayArrow: "Pfeilmatrix spielen",
      language: "Sprache"
    },
    home: {
      kicker: "Mini-Spiel Hub",
      title: "Wähle ein Spiel und spiele sofort im Browser.",
      description:
        "Diese Seite ist mit Next.js gebaut und auf Erweiterung ausgelegt. Füge weitere Spiele über neue Routen unter /games hinzu.",
      searchLabel: "Unscharfe Suche",
      searchPlaceholder: "Versuche: life, conway, tetris, sand, physik...",
      noResults: "Kein passendes Spiel gefunden. Probiere andere Suchwörter.",
      enterGame: "Spiel starten",
      lifeTitle: "Conways Spiel des Lebens",
      lifeSubtitle: "Klassischer zellulärer Automat",
      lifeDescription:
        "Baue, simuliere und teile Life-Muster mit umfassenden Steuerungen.",
      tetrisTitle: "Tetra Fusion",
      tetrisSubtitle: "Klassisch, halb-physikalisch, voller Sandmodus",
      tetrisDescription:
        "Wechsle zwischen klassischem Tetris, Kaskaden-Schwerkraft und sandartiger Eliminierung, sobald eine gleichfarbige Verbindung von links nach rechts entsteht.",
      spinTitle: "Drehsummen-Ratsel",
      spinSubtitle: "Ecken drehen, Zielsumme treffen",
      spinDescription:
        "Klicke ein Feld an, um seine vier Eckkugeln im Uhrzeigersinn zu drehen und die Zielsumme zu erreichen.",
      arrowTitle: "Pfeilmatrix",
      arrowSubtitle: "8-Richtungs-Kettenpuzzle mit einem Start",
      arrowDescription:
        "Wähle genau einen Startblock. Du gewinnst nur, wenn die Kette alle Blöcke in einem Versuch entfernt.",
      tags: {
        life: {
          rule: "B3/S23",
          pattern: "Pattern-Stempel",
          share: "Share-Links",
          shortcuts: "Tastaturkürzel"
        },
        tetris: {
          classic: "Klassische Matrix",
          halfPhysics: "Kaskaden-Schwerkraft",
          fullPhysics: "Sand-Fusion",
          guide: "Modus-Hilfe"
        },
        spin: {
          logic: "Logikgitter",
          rotate: "Uhrzeigersinn",
          solver: "Auto-Losung",
          difficulty: "3 Schwierigkeitsstufen"
        },
        arrow: {
          chain: "Kettenreaktion",
          eightDir: "8 Richtungen",
          oneShot: "Ein-Versuch-Clear",
          difficulty: "5 Schwierigkeitsstufen"
        }
      }
    },
    lifePage: {
      featured: "Hervorgehobenes Spiel",
      title: "Conways Spiel des Lebens",
      back: "Zurück zur Lobby"
    },
    tetrisPage: {
      featured: "Hervorgehobenes Spiel",
      title: "Tetra Fusion",
      back: "Zurück zur Lobby"
    },
    spinPage: {
      featured: "Hervorgehobenes Spiel",
      title: "Drehsummen-Ratsel",
      back: "Zurück zur Lobby"
    },
    arrowPage: {
      featured: "Hervorgehobenes Spiel",
      title: "Pfeilmatrix",
      back: "Zurück zur Lobby"
    },
    spin: {
      stats: {
        moves: "Zuge",
        timer: "Zeit",
        matched: "Treffer",
        status: "Status"
      },
      status: {
        playing: "Lauft",
        solving: "Automatische Losung...",
        solved: "Gelist"
      },
      controls: {
        title: "Puzzle",
        difficulty: "Schwierigkeit",
        restart: "Neu Starten",
        newPuzzle: "Neues Puzzle",
        solverTitle: "Solver",
        getAnswer: "Antwort Anzeigen",
        stop: "Stoppen",
        speed: "Abspieltempo"
      },
      difficulty: {
        easy: "Leicht",
        medium: "Mittel",
        hard: "Schwer"
      },
      speed: {
        slow: "Langsam",
        normal: "Normal",
        fast: "Schnell"
      },
      guide: {
        title: "Spielhilfe",
        hint: "Grau ist das Ziel. Rot ist die aktuelle Summe der vier Nachbar-Kugeln.",
        1: "Klicke ein Feld, um seine vier Ecken um 90 Grad im Uhrzeigersinn zu drehen.",
        2: "Sobald aktuelle Summe und Zielsumme gleich sind, wird Rot zu Grun.",
        3: "Mache alle Felder grun, oder nutze Antwort Anzeigen fur die automatische Losung."
      },
      modal: {
        title: "Geschafft!",
        description: "Du hast das Puzzle manuell gelost.",
        next: "Nachstes Puzzle",
        close: "Schliessen"
      },
      aria: {
        tile: "Feld Zeile {row} Spalte {col}, aktuell {current}, Ziel {target}"
      }
    },
    arrow: {
      stats: {
        remaining: "Verbleibende Blöcke",
        attempts: "Versuche",
        board: "Spielfeld",
        status: "Status"
      },
      status: {
        idle: "Bereit",
        animating: "Kette wird aufgelöst...",
        success: "Erfolgreich",
        fail: "Fehlgeschlagen"
      },
      controls: {
        title: "Puzzle-Steuerung",
        difficulty: "Schwierigkeit",
        restart: "Puzzle neu starten",
        newPuzzle: "Neues Puzzle",
        showSolution: "Eine Lösung anzeigen"
      },
      difficulty: {
        easy: "Leicht",
        normal: "Normal",
        hard: "Schwer",
        expert: "Experte",
        master: "Meister"
      },
      guide: {
        title: "Spielhilfe",
        hint: "Wähle einen Startblock. Danach wird die gesamte Kette mit voller Animation abgespielt.",
        1: "Ein aktivierter Block verschwindet zuerst und sucht dann in Pfeilrichtung den nächstgelegenen lebenden Block.",
        2: "Es gibt 8 Richtungen: N, NE, E, SE, S, SW, W, NW.",
        3: "Gewonnen ist nur, wenn eine einzige Kette alle Blöcke entfernt.",
        4: "Bleibt ein Block übrig, ist der Versuch fehlgeschlagen und das Board wird automatisch zurückgesetzt."
      },
      messages: {
        success: "Perfekter Clear in einer Kette!",
        fail: "Die Kette endete, bevor alle Blöcke entfernt wurden.",
        resetting: "Board wurde auf das Anfangslayout zurückgesetzt."
      },
      modal: {
        title: "Kette Erfolgreich!",
        description: "Du hast alle Blöcke in einem Versuch entfernt.",
        replay: "Dieses Puzzle Wiederholen",
        next: "Nächstes Puzzle"
      },
      aria: {
        block: "Block Zeile {row} Spalte {col}, Richtung {dir}"
      },
      dir: {
        N: "oben",
        NE: "oben rechts",
        E: "rechts",
        SE: "unten rechts",
        S: "unten",
        SW: "unten links",
        W: "links",
        NW: "oben links"
      }
    },
    life: {
      messages: {
        initial: "Klicke zum Zeichnen. Leertaste startet/pausiert. N geht eine Generation weiter.",
        boardCleared: "Spielfeld geleert.",
        randomGenerated: "Zufallsstart erzeugt.",
        resized: "Spielfeld auf {rows} x {cols} geändert.",
        ruleFormat: "Regelformat muss wie B3/S23 aussehen.",
        ruleSet: "Regel auf {rule} gesetzt.",
        patternStamped: "{pattern} platziert.",
        reset: "Auf Standardwerte zurückgesetzt.",
        localSaveRemoved: "Lokaler Spielstand entfernt.",
        shareCopied: "Share-Link in die Zwischenablage kopiert.",
        shareUrl: "Share-URL: {url}",
        loadedFromLink: "Aus Share-Link geladen.",
        restored: "Lokaler Spielstand wiederhergestellt.",
        invalidSave: "Spielstand war ungültig und wurde ignoriert.",
        saveError: "Lokales Speichern fehlgeschlagen."
      },
      stats: {
        generation: "Generation",
        liveCells: "Lebende Zellen",
        board: "Spielfeld",
        rule: "Regel"
      },
      sections: {
        simulation: "Simulation",
        board: "Spielfeld",
        rulesTools: "Regeln und Werkzeuge"
      },
      buttons: {
        start: "Start",
        pause: "Pause",
        step: "Schritt",
        randomize: "Zufall",
        clear: "Leeren",
        apply: "Anwenden",
        small: "Klein",
        medium: "Mittel",
        large: "Groß",
        copyShare: "Share-Link kopieren",
        clearSave: "Spielstand löschen",
        resetAll: "Alles zurücksetzen",
        applyRule: "Regel anwenden",
        stampCenter: "In Mitte stempeln",
        exitStamp: "Stempelmodus beenden"
      },
      labels: {
        speed: "Geschwindigkeit: {fps} FPS",
        randomDensity: "Zufallsdichte: {density}%",
        wrapEdges: "Ränder verbinden",
        showGrid: "Gitter anzeigen",
        rows: "Zeilen",
        cols: "Spalten",
        cellSize: "Zellgröße: {size}px",
        theme: "Theme",
        ruleString: "Regel-String",
        drawMode: "Zeichenmodus",
        patternStamp: "Pattern-Stempel",
        themeAccent: "Theme-Akzent: {theme}"
      },
      drawModes: {
        toggle: "Umschalten",
        paint: "Lebende Zellen malen",
        erase: "Zellen löschen"
      },
      options: {
        none: "Keins"
      },
      themes: {
        arcade: "Arcade",
        sunset: "Sonnenuntergang",
        terminal: "Terminal"
      },
      patternHint: {
        none: "Vorlage wählen und per Klick stempeln, oder manuell zeichnen."
      },
      patterns: {
        block: {
          name: "Block",
          description: "Stabile 2x2-Struktur."
        },
        blinker: {
          name: "Blinker",
          description: "Oszillator mit Periode 2."
        },
        toad: {
          name: "Kröte",
          description: "Kompakter Oszillator mit Periode 2."
        },
        glider: {
          name: "Gleiter",
          description: "Bewegt sich diagonal unbegrenzt."
        },
        lwss: {
          name: "Leichtes Raumschiff",
          description: "Klassisches wanderndes Raumschiff."
        },
        rPentomino: {
          name: "R-Pentomino",
          description: "Chaotisches Wachstum vor Stabilisierung."
        },
        acorn: {
          name: "Eichel",
          description: "Kleiner Keim mit langer Entwicklung."
        },
        gosper: {
          name: "Gosper-Gleiterkanone",
          description: "Erzeugt endlos Gleiter."
        }
      },
      aria: {
        board: "Spiel-des-Lebens-Spielfeld"
      },
      footer: {
        shortcuts: "Shortcuts: Leertaste Start/Pause, N Schritt, R Zufall, C Leeren."
      }
    }
  }
};

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getDictionaryValue = (dictionary: Dictionary, key: string): string | null => {
  const segments = key.split(".");
  let current: unknown = dictionary;

  for (const segment of segments) {
    if (!isObjectRecord(current) || !(segment in current)) {
      return null;
    }
    current = current[segment];
  }

  return typeof current === "string" ? current : null;
};

const interpolate = (template: string, params?: Params) => {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
};

export const normalizeLocale = (input: string | null | undefined): Locale => {
  if (!input) {
    return "en";
  }

  const language = input.toLowerCase();

  if (language.startsWith("zh")) {
    return "zh";
  }
  if (language.startsWith("es")) {
    return "es";
  }
  if (language.startsWith("ja")) {
    return "ja";
  }
  if (language.startsWith("fr")) {
    return "fr";
  }
  if (language.startsWith("de")) {
    return "de";
  }
  return "en";
};

export const detectBrowserLocale = (): Locale => {
  if (typeof navigator === "undefined") {
    return "en";
  }

  const languages = navigator.languages.length > 0 ? navigator.languages : [navigator.language];

  for (const language of languages) {
    const normalized = normalizeLocale(language);
    if (SUPPORTED_LOCALES.includes(normalized)) {
      return normalized;
    }
  }

  return normalizeLocale(navigator.language);
};

export const translate = (locale: Locale, key: string, params?: Params): string => {
  const localized = getDictionaryValue(DICTIONARIES[locale], key);
  if (localized) {
    return interpolate(localized, params);
  }

  const fallback = getDictionaryValue(DICTIONARIES.en, key);
  if (fallback) {
    return interpolate(fallback, params);
  }

  return key;
};
