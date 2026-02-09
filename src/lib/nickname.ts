const ADJECTIVES = [
  "Warm",
  "Quiet",
  "Clear",
  "Gentle",
  "Steady",
  "Soft",
  "Calm",
  "Bright",
  "Mellow",
  "Kind",
];

const NOUNS = [
  "NightSky",
  "Wave",
  "Breeze",
  "Starlight",
  "Forest",
  "Ripple",
  "Shade",
  "Sunbeam",
  "Paper",
  "Pencil",
];

function randomIndex(max: number) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0] % max;
}

export function generateAnonymousName() {
  const adjective = ADJECTIVES[randomIndex(ADJECTIVES.length)];
  const noun = NOUNS[randomIndex(NOUNS.length)];
  const suffix = String(randomIndex(1000)).padStart(3, "0");
  return `${adjective} ${noun} ${suffix}`;
}
