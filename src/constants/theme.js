/* ---------- tokens: ink, paper, brass ---------- */
export const T = {
  bg: "#F6F5F1",
  card: "#FFFFFF",
  border: "#DCDAD2",
  borderSubtle: "#EAE8E1",
  fg: "#141A17",
  fgMuted: "#6E736C",
  fgSubtle: "#9A9E97",
  primary: "#1E4D3B",
  rail: "#141A17",

  emerald: "#1E4D3B", emeraldBg: "#E7EFEA", emeraldBorder: "#C6DCD0",
  amber: "#9A6F26",   amberBg: "#F4EBD6",   amberBorder: "#E5D2A8",
  rose: "#8A2B23",    roseBg: "#F6E5E2",    roseBorder: "#E8C6C0",
  sky: "#3C4E5C",     skyBg: "#E6EBEF",     skyBorder: "#C8D4DD",
  violet: "#2F5E52",  violetBg: "#E4EEEA",  violetBorder: "#BFD8CE",
  zinc: "#6E736C",    zincBg: "#EFEEE9",    zincBorder: "#DCDAD2",
};

export const R = { sm: 2, md: 3, lg: 4 };

export const TONE = {
  Active: "emerald", Dormant: "amber", Pending: "sky",
  Completed: "violet", Expired: "zinc", Closed: "zinc",
};

export const tone = t => ({
  fg: T[t], bg: T[t + "Bg"], border: T[t + "Border"],
});
