export const FRAME_COUNT = 600;

export const framePath = (n: number) =>
  `/amazing_spiderman/frame-${n}.png`;

export type Dialogue = {
  id: string;
  show: number;
  hide: number;
  quote: string;
  speaker: string;
  film: string;
};

export const DIALOGUES: Dialogue[] = [
  {
    id: "d1",
    show: 0.1,
    hide: 0.3,
    quote: "There is no such thing as truth or lies in this world; there never has been. There are only plain, hard facts.",
    speaker: "RAHUL B",
    film: "2004",
  },
  {
    id: "d2",
    show: 0.35,
    hide: 0.55,
    quote: "SQL • Python • Power BI • Excel",
    speaker: "RAHUL B",
    film: "2004",
  },
  {
    id: "d3",
    show: 0.6,
    hide: 0.8,
    quote: "All your battles took place in the palm of my hands.",
    speaker: "RAHUL B",
    film: "2004",
  },
];

export const HERO_TEXT_FADE_END = 0.08;
