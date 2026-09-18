const WORDS = [
  { word: "いぬ", first: "い" }, { word: "ねこ", first: "ね" },
  { word: "さくら", first: "さ" }, { word: "りんご", first: "り" },
  { word: "くるま", first: "く" }, { word: "うさぎ", first: "う" },
  { word: "すいか", first: "す" }, { word: "たぬき", first: "た" }
];
const KANJI = {
  grade1: [{ kanji: "山", reading: "やま" }, { kanji: "川", reading: "かわ" }, { kanji: "空", reading: "そら" }, { kanji: "花", reading: "はな" }, { kanji: "雨", reading: "あめ" }, { kanji: "森", reading: "もり" }],
  grade2: [{ kanji: "海", reading: "うみ" }, { kanji: "春", reading: "はる" }, { kanji: "夏", reading: "なつ" }, { kanji: "星", reading: "ほし" }, { kanji: "雲", reading: "くも" }, { kanji: "雪", reading: "ゆき" }],
  grade3: [{ kanji: "島", reading: "しま" }, { kanji: "港", reading: "みなと" }, { kanji: "畑", reading: "はたけ" }, { kanji: "湖", reading: "みずうみ" }, { kanji: "柱", reading: "はしら" }, { kanji: "坂", reading: "さか" }]
};

const randomInt = (min, max, rng) => min + Math.floor(rng() * (max - min + 1));

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i, rng);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function makeQuestion(subject, level, rng = Math.random) {
  if (subject === "japanese") {
    if (level === "kindergarten") {
      const item = WORDS[randomInt(0, WORDS.length - 1, rng)];
      const distractors = shuffle(WORDS.filter(entry => entry.first !== item.first), rng).slice(0, 2).map(entry => entry.first);
      return { prompt: `「${item.word}」の さいしょの もじは？`, answer: item.first, choices: shuffle([item.first, ...distractors], rng) };
    }
    const entries = KANJI[level] ?? KANJI.grade1;
    const item = entries[randomInt(0, entries.length - 1, rng)];
    const distractors = shuffle(entries.filter(entry => entry.reading !== item.reading), rng).slice(0, 2).map(entry => entry.reading);
    return { prompt: `「${item.kanji}」は なんと よむ？`, answer: item.reading, choices: shuffle([item.reading, ...distractors], rng) };
  }

  if (subject === "math") {
    let a, b, symbol, answer;
    if (level === "kindergarten") {
      a = randomInt(1, 5, rng); b = randomInt(1, 5, rng); symbol = "＋"; answer = a + b;
    } else if (level === "grade1") {
      a = randomInt(2, 10, rng); b = randomInt(1, a, rng); symbol = rng() < 0.5 ? "＋" : "−"; answer = symbol === "＋" ? a + b : a - b;
    } else if (level === "grade2") {
      a = randomInt(2, 9, rng); b = randomInt(2, 9, rng); symbol = "×"; answer = a * b;
    } else {
      a = randomInt(2, 9, rng); b = randomInt(2, 9, rng); symbol = rng() < 0.5 ? "×" : "÷"; answer = symbol === "×" ? a * b : a;
      if (symbol === "÷") a *= b;
    }
    const options = new Set([answer]);
    const offsets = shuffle([-3, -2, -1, 1, 2, 3, 4, 5], rng);
    for (const offset of offsets) {
      if (options.size === 3) break;
      if (answer + offset >= 0) options.add(answer + offset);
    }
    return { prompt: `${a} ${symbol} ${b} ＝ ？`, answer: String(answer), choices: shuffle([...options].map(String), rng) };
  }
  throw new Error("Unknown subject");
}

export function isComplete(progress, settings) {
  return progress.activeSeconds >= settings.minutes * 60 || progress.correct >= settings.questions;
}
