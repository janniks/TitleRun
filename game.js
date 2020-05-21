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
const COLLISION = "collision";
const JUMP_TIMEOUT = -1;
const JUMP_LENGTH = 3;
const DELAY_LOOP = 210;
const DELAY_INITIAL = 1000;

const MAPS = {
  1: "                ▖     ▖        ▘     ▖   ▖    ▘    ▖      ⚑",
  2: "    map2             ▖     ▖    ▘     ▖    ▘     ▖   ▖    ▘    ▖     ▖     ▖        ▘     ▖   ▖    ▘    ▖  ⚑",
  3: "    map3             ▖    ▖    ▘    ▖   ▖   ▘   ▖    ▖    ▖   ▘    ▖   ▖   ▘   ▖     ⚑",
};

const GAME_URL = new URL(window.location.href);
const MAP_SELECTED = GAME_URL.searchParams.get("map");

let map = getMap();
let jump = JUMP_TIMEOUT;
let ticks = 0;
let playing = false;
let win = true;

const commands = {
  ArrowUp: () => {
    if (jump <= JUMP_TIMEOUT) jump = JUMP_LENGTH;
  },
  s: async () => {
    playing = true;
    loopGame();
  },
  r: async () => {
    playing = false;
    await dotDotDot("Restarting");
    location.reload();
  },
  c: async () => {
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

  if (event.key in commands) {
    return commands[event.key]();
  }

  if (event.key in MAPS) {
    return (location.href = `${location.origin}${location.pathname}?map=${event.key}`);
  }
});

main();

async function main() {
  await sleep(DELAY_INITIAL);
  while (!playing) {
    render("⚑ Hit S to play!");
    await sleep(DELAY_LOOP);
    render("⚐ Hit S to play!");
    await sleep(DELAY_LOOP);
  }
}

async function loopGame() {
  while (playing && map.length > 0) {
    let character = getCharacter(jump, map[0]);
    if (character == COLLISION) {
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

  if (win) loopWin();
}

async function loopWin() {
  while (playing) {
    document.title = "⭒ You win! ⭑";
    await sleep(DELAY_LOOP);
    document.title = "⭑ You win! ⭒";
    await sleep(DELAY_LOOP);
  }
}

function getMap() {
  if (readStorage()) {
    return readStorage();
  }
  console.log(MAP_SELECTED);
  return MAP_SELECTED in MAPS ? MAPS[MAP_SELECTED] : MAPS[1];
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
  } catch {
    console.log("Maybe somebody is blocking localStorage...");
    return false;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem("map");
  } catch {
    console.log("Maybe somebody is blocking localStorage...");
  }
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

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
