const CHARACTER = {
  BOTTOM: "▗",
  TOP: "▝",
  OVER: "▞",
  UNDER: "▚",
  CRASH: "⭒",
};
const BOX = {
  BOTTOM: "▖",
  TOP: "▘",
};
const MISC = {
  FLAG_DARK: "⚑",
  FLAG_LIGHT: "⚐",
  PLAY: "▸",
  STAR_DARK: "★",
  STAR_LIGHT: "⭒",
};
const COLLISION = "collision";

const JUMP_TIMEOUT = -1;
const JUMP_LENGTH = 3;
const DELAY_LOOP = 210;
const DELAY_INITIAL = 1000;

const MAPS = {
  1:        "                ▖     ▖        ▘     ▖   ▖    ▘    ▖      ⚑",
  2:        "                 ▖     ▖    ▘     ▖    ▘     ▖   ▖    ▘    ▖     ▖     ▖        ▘     ▖   ▖    ▘    ▖  ⚑",
  3:        "                 ▖    ▖    ▘    ▖   ▖   ▘   ▖    ▖    ▖   ▘    ▖   ▖   ▘   ▖     ⚑",
  "secret": "                  ▖▖    ▘▘▘▘▘      ▖ ▖     ▘▘▘▘▘     ▖▖   ▖▖       ▖       ▖ ▘     ⚑"
};

const GAME_URL = new URL(window.location.href);
const MAP =
  GAME_URL.searchParams.get("map") in MAPS
    ? GAME_URL.searchParams.get("map")
    : 1;
const DEBUG = !!GAME_URL.searchParams.get("debug") != undefined;

let map = loadMap(MAP);
let jump = JUMP_TIMEOUT;
let ticks = 0;
let playing = false;
let win = true;

const commands = {
  ArrowUp: () => {
    if (!playing) return commands.s();
    if (jump <= JUMP_TIMEOUT) jump = JUMP_LENGTH;
  },
  s: async () => {
    if (playing) return;

    faviconize("", 0);
    loopGame();
  },
  " ": () => commands.ArrowUp(),
  r: async () => {
    playing = false;
    await dotDotDot("Restarting");
    location.reload();
  },
  m: async () => {
    playing = false;
    clearStorage();
    await dotDotDot("Clearing");
    location.reload();
  },
};

document.addEventListener("keydown", (event) => {
  if (event.isComposing || event.keyCode === 229) {
    return;
  }
  log(event.key);
  if (event.key in commands) {
    event.preventDefault();
    return commands[event.key]();
  }
  if (event.key in MAPS) {
    event.preventDefault();
    return (location.href = `${location.origin}${location.pathname}?map=${event.key}`);
  }
});

// todo: add onblur message and favicon

// main
loopPreGame();

async function loopPreGame() {
  const welcomeMessage = MAP == 1 ? "Hit S to play!" : `MAP ${MAP}`;

  faviconize(MISC.PLAY, 102);

  await sleep(DELAY_INITIAL);
  while (!playing) {
    render(`${MISC.FLAG_DARK} ${welcomeMessage}`);
    await sleep(DELAY_LOOP);
    render(`${MISC.FLAG_LIGHT} ${welcomeMessage}`);
    await sleep(DELAY_LOOP);
  }
}

async function loopGame() {
  playing = true;
  while (playing && map.length > 0) {
    const character = getCharacter(jump, map[0]);

    if (character == COLLISION) {
      faviconize(MISC.STAR_LIGHT, 101);
      render(CHARACTER.CRASH, map, `SCORE ${ticks}`);
      win = false;
      break;
    }

    map = map.slice(1, map.length);
    render(character, map);

    ticks++;
    if (jump > JUMP_TIMEOUT) jump--;
    await sleep(DELAY_LOOP);
  }

  if (win) loopWin(ticks);
}

async function loopWin(score) {
  faviconize(MISC.FLAG_LIGHT, 104);

  while (playing) {
    document.title = `⭒ You win! ⭑ SCORE ${score}`;
    await sleep(DELAY_LOOP);
    document.title = `⭑ You win! ⭒ SCORE ${score}`;
    await sleep(DELAY_LOOP);
  }
}

function loadMap(map) {
  if (readStorage()) {
    return readStorage();
  }
  return MAPS[map];
}

function getCharacter(jump, tile) {
  if (jump > 0) {
    if (tile == BOX.TOP) {
      return COLLISION;
    } else if (tile == BOX.BOTTOM) {
      return CHARACTER.OVER;
    } else {
      return CHARACTER.TOP;
    }
  } else {
    if (tile == BOX.BOTTOM) {
      return COLLISION;
    } else if (tile == BOX.TOP) {
      return CHARACTER.UNDER;
    } else {
      return CHARACTER.BOTTOM;
    }
  }
}

async function dotDotDot(message) {
  render(`${message}.`);
  await sleep(DELAY_LOOP);
  render(`${message}..`);
  await sleep(DELAY_LOOP);
  render(`${message}...`);
  await sleep(DELAY_LOOP);
}

function readStorage() {
  try {
    return localStorage.getItem("map");
  } catch (error) {
    localStorageError(error);
    return false;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem("map");
  } catch (error) {
    localStorageError(error);
  }
}

function localStorageError(error) {
  console.log("Maybe somebody is blocking localStorage...");
  console.error(error);
}

function render(character, map, comment) {
  if (!map) return (document.title = character);
  if (!comment) return (document.title = `${character}${map}`);
  document.title = `${character}${map.slice(0, 2)} ${comment}`;
}

function hasCollision(character, tile) {
  return (
    (character == CHARACTER.BOTTOM && tile == BOX.BOTTOM) ||
    (character == CHARACTER.TOP && tile == BOX.TOP)
  );
}

function faviconize(character, offset) {
  const canvas = document.createElement("canvas");
  canvas.height = 128;
  canvas.width = 128;

  const ctx = canvas.getContext("2d");
  const radius = 96;

  ctx.lineJoin = "round";
  ctx.lineWidth = radius;
  ctx.strokeRect(radius / 2, radius / 2, 128 - radius, 128 - radius);
  ctx.fillRect(radius / 2, radius / 2, 128 - radius, 128 - radius);
  ctx.stroke();
  ctx.fill();

  ctx.fillStyle = "white";
  ctx.font = "128px serif";
  ctx.textAlign = "center";
  ctx.fillText(character, 64, offset);

  const link =
    document.querySelector("link[rel*='icon']") ||
    document.createElement("link");

  link.rel = "icon";
  link.href = canvas.toDataURL();
  document.getElementsByTagName("head")[0].appendChild(link);
}

function log() {
  if (DEBUG) {
    console.log(...arguments);
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
