/** 비밀번호·패스프레이즈 생성 — 브라우저의 암호학적 난수만 사용한다. */

export interface PasswordOptions {
  length: number;
  lower: boolean;
  upper: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export type RandomInt = (max: number) => number;

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;
export const PASSPHRASE_MIN_WORDS = 3;
export const PASSPHRASE_MAX_WORDS = 12;

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{};:,.?/';
const AMBIGUOUS = new Set('Il1O0o');

/**
 * 128개 이상의 짧은 영문 단어. 패스프레이즈는 단어 수를 늘릴수록 안전해진다.
 * 공백·구분자로 이어 읽기 쉽게 만드는 것이 목적이라, 뜻이 중립적인 단어만 모았다.
 */
export const PASSPHRASE_WORDS = [
  'ace',
  'acorn',
  'amber',
  'anchor',
  'apple',
  'apron',
  'arrow',
  'atlas',
  'autumn',
  'badge',
  'bagel',
  'baker',
  'bamboo',
  'basket',
  'beacon',
  'beetle',
  'berry',
  'birch',
  'biscuit',
  'blanket',
  'blossom',
  'boat',
  'bottle',
  'branch',
  'brass',
  'bread',
  'breeze',
  'brick',
  'bridge',
  'broom',
  'brush',
  'bubble',
  'bucket',
  'butterfly',
  'button',
  'cabin',
  'cactus',
  'candle',
  'canvas',
  'carpet',
  'carrot',
  'castle',
  'cedar',
  'chalk',
  'cherry',
  'chess',
  'chimney',
  'circus',
  'clay',
  'cliff',
  'cloud',
  'clover',
  'coast',
  'cocoa',
  'comet',
  'compass',
  'copper',
  'coral',
  'cotton',
  'crane',
  'crayon',
  'creek',
  'crown',
  'crystal',
  'daisy',
  'dawn',
  'deer',
  'desert',
  'diamond',
  'dolphin',
  'donkey',
  'dragon',
  'drum',
  'dune',
  'eagle',
  'earth',
  'ember',
  'engine',
  'falcon',
  'feather',
  'fence',
  'fern',
  'ferry',
  'field',
  'finch',
  'fire',
  'flame',
  'flute',
  'forest',
  'fountain',
  'fox',
  'frost',
  'garden',
  'garlic',
  'ginger',
  'glacier',
  'globe',
  'glove',
  'gold',
  'goose',
  'grape',
  'grass',
  'gravel',
  'guitar',
  'hammer',
  'harbor',
  'hazel',
  'helmet',
  'heron',
  'honey',
  'horizon',
  'horse',
  'island',
  'ivory',
  'jacket',
  'jade',
  'jasmine',
  'jungle',
  'kettle',
  'kite',
  'koala',
  'ladder',
  'lagoon',
  'lamp',
  'lantern',
  'leaf',
  'lemon',
  'lily',
  'linen',
  'lizard',
  'lobster',
  'lotus',
  'maple',
  'marble',
  'meadow',
  'melon',
  'meteor',
  'mint',
  'mirror',
  'monkey',
  'moon',
  'moss',
  'mountain',
  'mouse',
  'mushroom',
  'nest',
  'nickel',
  'night',
  'north',
  'oak',
  'oasis',
  'ocean',
  'olive',
  'onion',
  'opal',
  'orange',
  'orchid',
  'otter',
  'owl',
  'oyster',
  'paddle',
  'panda',
  'paper',
  'parrot',
  'peach',
  'pearl',
  'pebble',
  'pelican',
  'pencil',
  'pepper',
  'petal',
  'piano',
  'pillow',
  'pine',
  'planet',
  'plum',
  'pocket',
  'pond',
  'poppy',
  'potato',
  'prism',
  'pumpkin',
  'quartz',
  'quill',
  'rabbit',
  'radish',
  'rainbow',
  'raven',
  'ribbon',
  'river',
  'robin',
  'rocket',
  'rose',
  'ruby',
  'sail',
  'salmon',
  'sand',
  'sapphire',
  'scarf',
  'shell',
  'ship',
  'silver',
  'sky',
  'slate',
  'snow',
  'sparrow',
  'spider',
  'spring',
  'spruce',
  'squash',
  'star',
  'stone',
  'storm',
  'strawberry',
  'stream',
  'sugar',
  'sunset',
  'swan',
  'table',
  'teapot',
  'tent',
  'thunder',
  'tiger',
  'timber',
  'toaster',
  'tomato',
  'tulip',
  'turtle',
  'valley',
  'velvet',
  'violet',
  'walnut',
  'whale',
  'wheat',
  'willow',
  'window',
  'winter',
  'wolf',
  'wood',
  'wool',
  'yellow',
  'zebra',
  'zinnia',
] as const;

export const PASSPHRASE_SEPARATORS = ['-', '.', ' ', '_'] as const;

export function clampPasswordLength(value: number): number {
  if (!Number.isFinite(value)) return 16;
  return Math.min(PASSWORD_MAX_LENGTH, Math.max(PASSWORD_MIN_LENGTH, Math.round(value)));
}

export function clampWordCount(value: number): number {
  if (!Number.isFinite(value)) return 6;
  return Math.min(PASSPHRASE_MAX_WORDS, Math.max(PASSPHRASE_MIN_WORDS, Math.round(value)));
}

function selectedGroups(options: PasswordOptions): string[] {
  const groups = [
    options.lower ? LOWER : '',
    options.upper ? UPPER : '',
    options.digits ? DIGITS : '',
    options.symbols ? SYMBOLS : '',
  ].filter(Boolean);

  if (!options.excludeAmbiguous) return groups;
  return groups
    .map((group) =>
      Array.from(group)
        .filter((char) => !AMBIGUOUS.has(char))
        .join(''),
    )
    .filter(Boolean);
}

/** 선택한 문자 종류를 모두 합친 문자열. 비어 있으면 빈 문자열. */
export function buildAlphabet(options: PasswordOptions): string {
  return selectedGroups(options).join('');
}

/** 브라우저의 crypto.getRandomValues 로 편향 없이 0~(max-1) 정수를 고른다. */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) throw new RangeError('max must be positive');
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buffer);
    const value = buffer[0] ?? 0;
    if (value < limit) return value % max;
  }
}

function pick(value: string, randomInt: RandomInt): string {
  const chars = Array.from(value);
  const index = Math.min(chars.length - 1, Math.max(0, randomInt(chars.length)));
  return chars[index] ?? '';
}

/**
 * 선택한 각 문자 종류를 최소 하나씩 넣고, 나머지를 무작위로 채운 뒤 섞는다.
 * 문자 종류를 하나도 고르지 않으면 오류를 던진다.
 */
export function generatePassword(
  options: PasswordOptions,
  randomInt: RandomInt = secureRandomInt,
): string {
  const groups = selectedGroups(options);
  const alphabet = groups.join('');
  if (!alphabet) throw new Error('문자 종류를 하나 이상 선택하세요.');

  const length = Math.max(groups.length, clampPasswordLength(options.length));
  const chars: string[] = groups.map((group) => pick(group, randomInt));

  while (chars.length < length) {
    chars.push(pick(alphabet, randomInt));
  }

  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = Math.min(index, Math.max(0, randomInt(index + 1)));
    [chars[index], chars[swap]] = [chars[swap] ?? '', chars[index] ?? ''];
  }

  return chars.slice(0, length).join('');
}

export function generatePassphrase(
  wordCount: number,
  separator: string,
  randomInt: RandomInt = secureRandomInt,
): string {
  const count = clampWordCount(wordCount);
  return Array.from({ length: count }, () => {
    const index = Math.min(
      PASSPHRASE_WORDS.length - 1,
      Math.max(0, randomInt(PASSPHRASE_WORDS.length)),
    );
    return PASSPHRASE_WORDS[index] ?? '';
  }).join(separator);
}

export function estimatePasswordBits(options: PasswordOptions): number {
  const alphabet = buildAlphabet(options);
  if (!alphabet) return 0;
  return clampPasswordLength(options.length) * Math.log2(alphabet.length);
}

export function estimatePassphraseBits(wordCount: number): number {
  return clampWordCount(wordCount) * Math.log2(PASSPHRASE_WORDS.length);
}

export type StrengthLevel = 'weak' | 'fair' | 'strong' | 'very';

export function strengthOf(bits: number): { level: StrengthLevel; label: string } {
  if (bits < 40) return { level: 'weak', label: '약함' };
  if (bits < 60) return { level: 'fair', label: '보통' };
  if (bits < 80) return { level: 'strong', label: '강함' };
  return { level: 'very', label: '매우 강함' };
}
