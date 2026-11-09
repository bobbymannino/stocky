// satori can't read woff2, so these are the woff builds, inlined as data URLs
import inter400 from "@fontsource/inter/files/inter-latin-400-normal.woff?inline";
import inter700 from "@fontsource/inter/files/inter-latin-700-normal.woff?inline";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** The most points the preview line draws, however long the history is. */
export const MAX_POINTS = 12;

// Catppuccin Mocha, to match the app's dark theme
const C = {
  base: "#1e1e2e",
  surface: "#313244",
  text: "#cdd6f4",
  subtext: "#a6adc8",
  overlay: "#6c7086",
  green: "#a6e3a1",
  red: "#f38ba8",
  blue: "#89b4fa",
};

const fonts = [
  { name: "Inter", data: fromDataUrl(inter400), weight: 400 as const },
  { name: "Inter", data: fromDataUrl(inter700), weight: 700 as const },
];

function fromDataUrl(url: string) {
  return Buffer.from(url.slice(url.indexOf(",") + 1), "base64");
}

/** Up to `max` points spread evenly over `points`, always keeping the first and last. */
export function samplePoints<T>(points: T[], max = MAX_POINTS): T[] {
  if (points.length <= max) return points;
  return Array.from(
    { length: max },
    (_, i) => points[Math.round((i * (points.length - 1)) / (max - 1))],
  );
}

type Node = { type: string; props: Record<string, unknown> };

/** A tiny stand-in for JSX: satori takes React-shaped element objects. */
function h(
  type: string,
  style: Record<string, unknown>,
  ...children: (Node | string | false | undefined)[]
): Node {
  const kids = children.filter((c) => c !== false && c !== undefined);
  return {
    type,
    props: { style, children: kids.length === 1 ? kids[0] : kids },
  };
}

/** Space around the card's edge. */
const PAD = 80;
const CHART_W = OG_WIDTH - PAD * 2;
const CHART_H = 240;

function chart(prices: number[]): Node {
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const pad = 8;
  const coords = prices.map((p, i) => {
    const x =
      prices.length === 1
        ? CHART_W / 2
        : pad + (i * (CHART_W - pad * 2)) / (prices.length - 1);
    const y = pad + (1 - (p - min) / span) * (CHART_H - pad * 2);
    return [x, max === min ? CHART_H / 2 : y] as const;
  });
  const first = prices[0];
  const last = prices[prices.length - 1];
  const stroke = last > first ? C.green : last < first ? C.red : C.blue;
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`);
  const [lastX, lastY] = coords[coords.length - 1];

  return {
    type: "svg",
    props: {
      width: CHART_W,
      height: CHART_H,
      viewBox: `0 0 ${CHART_W} ${CHART_H}`,
      children: [
        // a faint fill under the line
        {
          type: "path",
          props: {
            d: `M${coords[0][0]},${CHART_H} L${line.join(" L")} L${lastX},${CHART_H} Z`,
            fill: stroke,
            fillOpacity: 0.12,
          },
        },
        {
          type: "polyline",
          props: {
            points: line.join(" "),
            fill: "none",
            stroke,
            strokeWidth: 6,
            strokeLinejoin: "round",
            strokeLinecap: "round",
          },
        },
        {
          type: "circle",
          props: { cx: lastX, cy: lastY, r: 10, fill: stroke },
        },
      ],
    },
  };
}

const updatedFormat = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  // the app is GBP-first, and the server's own zone is arbitrary
  timeZone: "Europe/London",
});

/** The share card for a holding, as a PNG. */
export async function renderHoldingImage(opts: {
  ticker: string;
  companyName: string | undefined;
  /** Oldest first. */
  history: { t: number; price: number }[];
}): Promise<Uint8Array<ArrayBuffer>> {
  const points = samplePoints(opts.history);
  const updatedAt = opts.history.at(-1)?.t;

  const tree = h(
    "div",
    {
      // the padding sits inside these, so subtract it from the canvas size
      width: OG_WIDTH - PAD * 2,
      height: OG_HEIGHT - PAD * 2,
      boxSizing: "content-box",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: PAD,
      backgroundColor: C.base,
      color: C.text,
      fontFamily: "Inter",
    },
    h(
      "div",
      { display: "flex", flexDirection: "column", gap: 8 },
      h("div", { fontSize: 88, fontWeight: 700, lineHeight: 1 }, opts.ticker),
      opts.companyName &&
        h(
          "div",
          {
            fontSize: 40,
            color: C.subtext,
            // long names would otherwise push the chart off the card
            maxWidth: CHART_W,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
          },
          opts.companyName,
        ),
    ),
    points.length > 0
      ? chart(points.map((p) => p.price))
      : h(
          "div",
          {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: CHART_H,
            borderRadius: 24,
            backgroundColor: C.surface,
            fontSize: 32,
            color: C.subtext,
          },
          "No price history yet",
        ),
    h(
      "div",
      {
        display: "flex",
        justifyContent: "space-between",
        fontSize: 28,
        color: C.overlay,
      },
      h("div", {}, "Stocky"),
      h(
        "div",
        {},
        updatedAt === undefined
          ? "Never updated"
          : `Updated ${updatedFormat.format(updatedAt)}`,
      ),
    ),
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts,
  });
  // a plain copy, since Response bodies want an ArrayBuffer-backed array
  return new Uint8Array(new Resvg(svg).render().asPng());
}
