// ✅ Check if string is hiragana (with "kanji【hiragana】" support)
function isHiragana(str) {
  if (str.includes("【")) {
    const match = str.match(/(?<=【)(.*?)(?=】)/);
    if (match) {
      return isHiragana(match[0]);
    }
  }
  return Array.from(str).every(
    (ch) => (ch >= "ぁ" && ch <= "ゟ") || "ー（）、".includes(ch),
  );
}

// --- 1. Simple romaji mapping ---
const ROMAJI_MAP = JSON.parse(`{
  "あ": "a",  "い": "i",   "う": "u",   "え": "e",  "お": "o",
  "か": "ka", "き": "ki",  "く": "ku",  "け": "ke", "こ": "ko",
  "さ": "sa", "し": "shi", "す": "su",  "せ": "se", "そ": "so",
  "た": "ta", "ち": "chi", "つ": "tsu", "て": "te", "と": "to",
  "な": "na", "に": "ni",  "ぬ": "nu",  "ね": "ne", "の": "no",
  "は": "ha", "ひ": "hi",  "ふ": "fu",  "へ": "he", "ほ": "ho",
  "ま": "ma", "み": "mi",  "む": "mu",  "め": "me", "も": "mo",
  "や": "ya",              "ゆ": "yu",             "よ": "yo",
  "ら": "ra", "り": "ri",  "る": "ru",  "れ": "re", "ろ": "ro",
  "わ": "wa",                                      "を": "wo",

  "が": "ga", "ぎ": "gi",  "ぐ": "gu",  "げ": "ge", "ご": "go",
  "ざ": "za", "じ": "ji",  "ず": "zu",  "ぜ": "ze", "ぞ": "zo",
  "だ": "da", "ぢ": "ji",  "づ": "zu",  "で": "de", "ど": "do",
  "ば": "ba", "び": "bi",  "ぶ": "bu",  "べ": "be", "ぼ": "bo",
  "ぱ": "pa", "ぴ": "pi",  "ぷ": "pu",  "ぺ": "pe", "ぽ": "po",

  "きゃ": "kya", "きゅ": "kyu", "きょ": "kyo",
  "しゃ": "sha", "しゅ": "shu", "しょ": "sho",
  "ちゃ": "cha", "ちゅ": "chu", "ちょ": "cho",
  "にゃ": "nya", "にゅ": "nyu", "にょ": "nyo",
  "ひゃ": "hya", "ひゅ": "hyu", "ひょ": "hyo",
  "みゃ": "mya", "みゅ": "myu", "みょ": "myo",
  "りゃ": "rya", "りゅ": "ryu", "りょ": "ryo",
  "ぎゃ": "gya", "ぎゅ": "gyu", "ぎょ": "gyo",
  "じゃ": "ja",  "じゅ": "ju",  "じょ": "jo",
  "びゃ": "bya", "びゅ": "byu", "びょ": "byo",
  "ぴゃ": "pya", "ぴゅ": "pyu", "ぴょ": "pyo",

  "ん": "n",

  "（": " (", "）": ")", "、": ", "
}`);

// --- 2. Extract hiragana from "kanji【hiragana】" ---
function extractHiragana(str) {
  const match = str.match(/(?<=【)(.*?)(?=】)/);
  return match ? match[0] : str;
}

// --- 3. Hiragana → Romaji transliteration ---
function toRomaji(hiragana) {
  let result = "";
  for (let i = 0; i < hiragana.length; i++) {
    // Try digraph (e.g. きゃ, しゃ, ちゃ…)
    const twoChar = hiragana.slice(i, i + 2);
    if (ROMAJI_MAP[twoChar]) {
      result += ROMAJI_MAP[twoChar];
      i++;
      continue;
    }
    // Fallback single char
    result += ROMAJI_MAP[hiragana[i]] || hiragana[i];
  }

  // Handle sokuon (っ)
  // Replace "っ<romaji>" by duplicating the first consonant of the romaji syllable
  // cch is incorrect in Hepburn, but common anyway, so who cares really
  result = result.replace(/っ([a-z])/g, (_, c) => c + c);

  // Handle long vowel mark (ー)
  // Duplicate the preceding vowel
  // This is Hepburn-noncompliant, but normal people don't have long vowels on their keyboard anyway. This is fine for a training app
  result = result.replace(/([aeiou])ー/g, (_, v) => v + v);

  return result.trim();
}

// --- Quiz logic ---
let filtered = null;
let current = null;
const hiraganaSpan = document.getElementById("hiragana");
const englishSpan = document.getElementById("english");
const answerInput = document.getElementById("answer");
const feedback = document.getElementById("feedback");

function newWord() {
  current = filtered[Math.floor(Math.random() * filtered.length)];
  const hira = extractHiragana(current.jp);
  current.hira = hira;
  current.romaji = toRomaji(hira);
  console.log(current);
  hiraganaSpan.textContent = current.jp;
  englishSpan.textContent = current.en;
  answerInput.value = "";
  feedback.textContent = "";
}

answerInput.addEventListener("input", () => {
  if (!current) return;
  if (answerInput.value.trim().toLowerCase() === current.romaji) {
    feedback.textContent = "✓ Correct!";
    feedback.className = "correct";
    setTimeout(newWord, 800); // load next word
  } else {
    feedback.textContent = "";
  }
});

// Fetch TSV from a permanent URL
const DATA_URL =
  "https://raw.githubusercontent.com/AcipenserSturio/hiragana-practice/refs/heads/main/dict.tsv";

fetch(DATA_URL)
  .then((resp) => resp.text())
  .then((text) => {
    const [header, ...dataRows] = text
      .trim()
      .split("\n")
      .map((line) => line.split("\t"));

    const idIndex = header.indexOf("id");
    const jpIndex = header.indexOf("jp");
    const enIndex = header.indexOf("en");

    filtered = dataRows
      .map((row) => ({
        id: row[idIndex],
        jp: row[jpIndex],
        en: row[enIndex],
      }))
      .filter((entry) => isHiragana(entry.jp));
    console.log(filtered);
    newWord();

    // renderTable(header, filtered);
  })
  .catch((err) => {
    document.getElementById("results").textContent =
      "Error loading data: " + err;
  });
