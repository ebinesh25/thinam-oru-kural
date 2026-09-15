// thinam-oru-kural — client-side Instagram poster renderer
// 1080x1350 portrait, Tamil + English posters, caption builder

export const W = 1080;
export const H = 1350;
export const API = (n) => `https://kural.codewithram.dev/api/kural/${n}`;

const TAMIL = '"Noto Serif Tamil", "Noto Sans Tamil", serif';
const LATIN = '"Noto Serif", Georgia, "Times New Roman", serif';

const C = {
	paper1: '#faf3e2',
	paper2: '#f2e5cb',
	paper3: '#e9dabb',
	ink: '#3d2c17',
	inkSoft: '#6d5636',
	gold: '#a97f3f',
	goldDeep: '#8a6d3b',
	goldPale: 'rgba(169,127,63,0.55)',
	cream: '#fdf8ec',
};

// deterministic noise
let seed = 20260915;
function rnd() {
	seed = (seed * 1103515245 + 12345) & 0x7fffffff;
	return seed / 0x7fffffff;
}

function wrapText(ctx, text, maxW) {
	const words = String(text).split(/\s+/);
	const lines = [];
	let line = '';
	for (const w of words) {
		const t = line ? line + ' ' + w : w;
		if (ctx.measureText(t).width <= maxW || !line) line = t;
		else {
			lines.push(line);
			line = w;
		}
	}
	if (line) lines.push(line);
	return lines;
}

function roundRectPath(ctx, x, y, w, h, r) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.arcTo(x + w, y, x + w, y + h, r);
	ctx.arcTo(x + w, y + h, x, y + h, r);
	ctx.arcTo(x, y + h, x, y, r);
	ctx.arcTo(x, y, x + w, y, r);
	ctx.closePath();
}

function drawBackground(ctx) {
	const g = ctx.createLinearGradient(0, 0, 0, H);
	g.addColorStop(0, C.paper1);
	g.addColorStop(0.55, C.paper2);
	g.addColorStop(1, C.paper3);
	ctx.fillStyle = g;
	ctx.fillRect(0, 0, W, H);

	// sepia vignette
	const v = ctx.createRadialGradient(W / 2, H * 0.44, 220, W / 2, H * 0.52, 880);
	v.addColorStop(0, 'rgba(138,109,59,0)');
	v.addColorStop(1, 'rgba(110,84,44,0.30)');
	ctx.fillStyle = v;
	ctx.fillRect(0, 0, W, H);

	// paper grain
	for (let i = 0; i < 3200; i++) {
		ctx.fillStyle = `rgba(110,84,44,${(rnd() * 0.05).toFixed(3)})`;
		ctx.fillRect(rnd() * W, rnd() * H, rnd() > 0.6 ? 2 : 1, 1);
	}

	// double frame
	ctx.strokeStyle = C.goldDeep;
	ctx.lineWidth = 3;
	ctx.strokeRect(26, 26, W - 52, H - 52);
	ctx.strokeStyle = C.goldPale;
	ctx.lineWidth = 1;
	ctx.strokeRect(36, 36, W - 72, H - 72);

	// kolam corner ornaments (quarter arcs + dots)
	const orn = (cx, cy, fx, fy) => {
		ctx.save();
		ctx.translate(cx, cy);
		ctx.scale(fx ? -1 : 1, fy ? -1 : 1);
		ctx.strokeStyle = C.gold;
		ctx.lineWidth = 2;
		for (const rr of [46, 58, 70]) {
			ctx.beginPath();
			ctx.arc(0, 0, rr, 0, Math.PI / 2);
			ctx.stroke();
		}
		ctx.fillStyle = C.gold;
		for (let i = 0; i < 3; i++) {
			const a = (Math.PI / 2) * ((i + 0.5) / 3);
			ctx.beginPath();
			ctx.arc(Math.cos(a) * 82, Math.sin(a) * 82, 3.4, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.restore();
	};
	orn(38 + 70, 38 + 70, false, false);
	orn(W - 38 - 70, 38 + 70, true, false);
	orn(38 + 70, H - 38 - 70, false, true);
	orn(W - 38 - 70, H - 38 - 70, true, true);
}

function drawRule(ctx, cx, y, half, label) {
	ctx.strokeStyle = C.goldPale;
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(cx - half, y);
	ctx.lineTo(cx - 18, y);
	ctx.moveTo(cx + 18, y);
	ctx.lineTo(cx + half, y);
	ctx.stroke();
	if (label) {
		ctx.font = `400 22px ${TAMIL}`;
		ctx.fillStyle = C.goldDeep;
		ctx.textAlign = 'center';
		ctx.textBaseline = 'middle';
		ctx.fillText(label, cx, y + 2);
	} else {
		ctx.save();
		ctx.translate(cx, y);
		ctx.rotate(Math.PI / 4);
		ctx.strokeStyle = C.gold;
		ctx.lineWidth = 2;
		ctx.strokeRect(-5, -5, 10, 10);
		ctx.restore();
	}
}

function pill(ctx, text, cx, y, { bg = C.goldDeep, fg = C.cream, size = 21, font = TAMIL, outline = false } = {}) {
	ctx.font = `700 ${size}px ${font}`;
	const w = ctx.measureText(text).width + 44;
	const h = size + 20;
	roundRectPath(ctx, cx - w / 2, y - h / 2, w, h, h / 2);
	if (outline) {
		ctx.strokeStyle = C.goldDeep;
		ctx.lineWidth = 2;
		ctx.stroke();
	} else {
		ctx.fillStyle = bg;
		ctx.fill();
	}
	ctx.fillStyle = fg;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(text, cx, y + 2);
}

function loadImage(src) {
	return new Promise((res, rej) => {
		const img = new Image();
		img.onload = () => res(img);
		img.onerror = rej;
		img.src = src;
	});
}

async function drawPortrait(ctx, cx, cy, h) {
	// faded background figure — no clip circle, no ring
	const img = await loadImage('/thiruvalluvar.png');
	const scale = h / img.height;
	const dw = img.width * scale;
	const dh = img.height * scale;
	ctx.save();
	ctx.globalAlpha = 0.45;
	ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
	ctx.restore();
}

function drawHeader(ctx, { title, titleFont, sub, subWidth }) {
	// top mark
	ctx.save();
	ctx.translate(W / 2, 66);
	ctx.rotate(Math.PI / 4);
	ctx.strokeStyle = C.gold;
	ctx.lineWidth = 2.5;
	ctx.strokeRect(-9, -9, 18, 18);
	ctx.fillStyle = C.goldDeep;
	ctx.fillRect(-3.5, -3.5, 7, 7);
	ctx.restore();

	ctx.fillStyle = C.ink;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `700 58px ${titleFont}`;
	ctx.fillText(title, W / 2, 168);

	if (sub) {
		try {
			ctx.letterSpacing = '7px';
		} catch {
			/* older browsers */
		}
		ctx.font = `400 20px ${LATIN}`;
		ctx.fillStyle = C.goldDeep;
		ctx.fillText(sub, W / 2, 214);
		ctx.letterSpacing = '0px';
	}

	drawRule(ctx, W / 2, 252, 330);
}

export async function renderTamil(ctx, d) {
	drawBackground(ctx);
	await drawPortrait(ctx, W / 2, 1180, 460);
	drawHeader(ctx, {
		title: 'தினம் ஒரு குறள்',
		titleFont: TAMIL,
		sub: 'T H I R U K K U R A L',
	});

	// metadata pills
	const chapter = d.chapter.names.ta;
	ctx.font = `400 21px ${TAMIL}`;
	const chapW = ctx.measureText(chapter).width + 44;
	const secW = ctx.measureText(`${d.section.names.ta} · ${chapter}`).width + 44;
	if (chapW + secW + 24 <= W - 160) {
		pill(ctx, d.section.names.ta, W / 2 - chapW / 2 - 12, 310);
		pill(ctx, chapter, W / 2 + chapW / 2 + 12, 310, { outline: true, fg: C.goldDeep });
	} else {
		pill(ctx, chapter, W / 2, 310, { outline: true, fg: C.goldDeep });
	}

	// kural number
	pill(ctx, `குறள் ${d.number}`, W / 2, 380, { bg: C.goldDeep, size: 26 });

	// verse
	const verseFont = { weight: 700, family: TAMIL };
	const vBlock = fitBlock2(
		ctx,
		[`“ ${d.kural[0]}`, `${d.kural[1]} ”`],
		900,
		250,
		66,
		40,
		verseFont,
		1.55
	);
	let vy = 500 - vBlock.size * 1.55 * vBlock.lines.length / 2;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = C.ink;
	for (const line of vBlock.lines) {
		ctx.font = `700 ${vBlock.size}px ${TAMIL}`;
		ctx.fillText(line, W / 2, vy + vBlock.size * 1.55 / 2);
		vy += vBlock.size * 1.55;
	}
	const verseBottom = 500 + (vBlock.lines.length * vBlock.size * 1.55) / 2;

	drawRule(ctx, W / 2, verseBottom + 42, 300);

	// urai
	const uraiY = verseBottom + 82;
	const uBlock = fitBlock2(ctx, d.meaning.ta_mu_va, 780, Math.max(200, 1290 - uraiY), 31, 22, { weight: 400, family: TAMIL }, 1.85);
	ctx.textAlign = 'center';
	ctx.fillStyle = C.inkSoft;
	let uy = uraiY;
	for (const line of uBlock.lines) {
		ctx.font = `400 ${uBlock.size}px ${TAMIL}`;
		ctx.fillText(line, W / 2, uy + uBlock.size * 1.85 / 2);
		uy += uBlock.size * 1.85;
	}
	const uraibottom = uraiY + uBlock.height;

	footer(ctx, 'தினம் ஒரு குறள் · Thinam Oru Kural', 1324);

	return {
		type: 'ta',
		verseBottom,
		uraiTop: uraiY,
		uraiBottom: uraibottom,
		portraitTop: 950,
		portraitBottom: 1410,
		portraitRingBottom: 1410,
		gapUraiPortrait: uraibottom - 950,
		footerY: 1324,
	};
}

function fitBlock2(ctx, lines, maxW, maxH, startPx, minPx, font, lh) {
	const arr = Array.isArray(lines) ? lines : [lines];
	let size = startPx;
	for (; size >= minPx; size -= 2) {
		ctx.font = `${font.weight} ${size}px ${font.family}`;
		const all = [];
		let h = 0;
		for (const t of arr) {
			const ls = wrapText(ctx, t, maxW);
			all.push(...ls);
			h += ls.length * size * lh;
		}
		if (h <= maxH) return { lines: all, size, height: h };
	}
	ctx.font = `${font.weight} ${minPx}px ${font.family}`;
	const all = [];
	let h = 0;
	for (const t of arr) {
		const ls = wrapText(ctx, t, maxW);
		all.push(...ls);
		h += ls.length * minPx * lh;
	}
	return { lines: all, size: minPx, height: h };
}

export async function renderEnglish(ctx, d) {
	drawBackground(ctx);
	await drawPortrait(ctx, W / 2, 1180, 460);
	drawHeader(ctx, {
		title: 'Thinam Oru Kural',
		titleFont: LATIN,
		sub: 'ONE KURAL · EVERY DAY',
	});

	pill(ctx, `Kural ${d.number}`, W / 2, 348, { bg: C.goldDeep, size: 23, font: LATIN });

	// transliteration — compact caption
	const trBlock = fitBlock2(ctx, d.transliteration, 900, 120, 30, 22, { weight: 400, family: LATIN }, 1.55);
	let ty = 420;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = C.ink;
	for (const line of trBlock.lines) {
		ctx.font = `400 ${trBlock.size}px ${LATIN}`;
		ctx.fillText(line, W / 2, ty + trBlock.size * 1.55 / 2);
		ty += trBlock.size * 1.55;
	}
	const trBottom = ty;

	// small decorative Tamil verse
	const tvBlock = fitBlock2(ctx, [d.kural[0], d.kural[1]], 640, 110, 22, 17, { weight: 400, family: TAMIL }, 1.7);
	let vy = trBottom + 22;
	ctx.fillStyle = C.goldDeep;
	for (const line of tvBlock.lines) {
		ctx.font = `400 ${tvBlock.size}px ${TAMIL}`;
		ctx.fillText(line, W / 2, vy + tvBlock.size * 1.7 / 2);
		vy += tvBlock.size * 1.7;
	}
	const tvBottom = vy;

	drawRule(ctx, W / 2, tvBottom + 26, 300);

	// explanation — bounded zone above footer
	const exY = tvBottom + 56;
	const exLimit = 1290 - exY - 4;
	const exBlock = fitBlock2(ctx, `${d.meaning.en}\n\n${d.meaning.en_modern}`, 730, Math.max(200, exLimit), 26, 19, { weight: 400, family: LATIN }, 1.72);
	ctx.textAlign = 'center';
	ctx.fillStyle = C.inkSoft;
	let ey = exY;
	for (const line of exBlock.lines) {
		ctx.font = `400 ${exBlock.size}px ${LATIN}`;
		ctx.fillText(line, W / 2, ey + exBlock.size * 1.72 / 2);
		ey += exBlock.size * 1.72;
	}
	const exBottom = ey;
	footer(ctx, 'Thinam Oru Kural · தினம் ஒரு குறள்', 1324);

	return {
		type: 'en',
		trBottom,
		tvBottom,
		exTop: exY,
		exBottom,
		exSize: exBlock.size,
		portraitTop: 950,
		portraitBottom: 1410,
		portraitDotsBottom: 1410,
		gapExPortrait: exBottom - 950,
		footerY: 1324,
	};
}

function footer(ctx, text, y) {
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = `400 20px ${LATIN}`;
	ctx.fillStyle = C.inkSoft;
	ctx.fillText(`✦  ${text}`, W / 2, y);
}

export function buildCaption(d) {
	const p1 = d.meaning.en.replace(/\.\s*$/, '') + '.';
	const modern = d.meaning.en_modern.replace(/\.\s*$/, '') + '.';
	const sent = modern.split(/\.\s+/).filter(Boolean);
	const bullets = [];
	if (sent[0]) bullets.push(sent[0]);
	if (sent.length > 1) bullets.push(sent[1].replace(/\.$/, ''));
	bullets.push(d.meaning.ta_mu_va);

	const chapterTa = d.chapter.names.ta.replace(/\s+/g, '');
	const chapterEn = d.chapter.names.en;

	return [
		p1,
		'',
		'👉 Eventually:',
		...bullets.map((b) => `   • ${b}`),
		'',
		'Why it matters:',
		`   ${modern} Because such desire erodes character, dignity and ethics.`,
		'',
		'✨ True wisdom lies in contentment and integrity.',
		'',
		`“ ${d.kural[0]} ${d.kural[1]} ”`,
		'',
		d.meaning.ta_mu_va,
		'',
		'— Thiruvalluvar · Timeless words, endless meaning.',
		'',
		'━━━',
		'குறள் பால் : ' + d.section.names.ta,
		'அதிகாரம் : ' + chapterTa,
		'குறள் எண் : ' + d.number,
		'',
		`#தினமொருகுறள் #திருக்குறள் #குறள்${d.number} #thirukkural #thiruvalluvar #தமிழ் #${chapterTa} #tamilquotes #kural #wisdom`,
		'',
		'Thirukkural, Thirukkural meaning, ' +
			`Kural ${d.number} explanation, ${chapterEn}, ${d.chapter.names.ta}, ` +
			'Tamil moral quotes, Tamil literature wisdom, Tamil philosophy quotes, ' +
			'Tamil motivation quotes, Ancient Tamil wisdom, Tamil ethical teachings, ' +
			'Thirukkural series, Life lessons from Thirukkural, Tamil inspiration, Classic Tamil literature',
	].join('\n');
}

export async function fetchKural(n) {
	if (!Number.isInteger(n) || n < 1 || n > 1330) {
		throw new Error('குறள் எண் 1 முதல் 1330 வரை இருக்க வேண்டும் (enter 1–1330).');
	}
	const res = await fetch(API(n));
	if (!res.ok) throw new Error(`API error ${res.status}`);
	return res.json();
}

export async function ensureFonts() {
	const specs = [
		'700 58px "Noto Serif Tamil"',
		'400 30px "Noto Serif Tamil"',
		'700 52px "Noto Serif"',
		'400 27px "Noto Serif"',
	];
	await Promise.all(specs.map((s) => document.fonts.load(s).catch(() => {})));
	if (document.fonts.ready) await document.fonts.ready;
}

export function downloadCanvas(canvas, filename) {
	canvas.toBlob((blob) => {
		if (!blob) return;
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = filename;
		a.click();
		setTimeout(() => URL.revokeObjectURL(a.href), 4000);
	}, 'image/png');
}