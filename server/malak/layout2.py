"""Find where each measure sits on a score PDF, using the rendered page image for staves/barlines
and the PDF text for printed measure numbers and multi-rest counts.

Output JSON: {"boxes": [[m_first, m_last, page, x0, y0, x1, y1], ...] (fractions of page), "warn": [...]}
"""
import sys, json
import numpy as np
import pdfplumber

SCALE = 2.0  # pixels per PDF point
DIG = {0xE080 + i: str(i) for i in range(10)}


def runs(mask):
    """Start/end (inclusive) of consecutive True runs."""
    out, s = [], None
    for i, v in enumerate(mask):
        if v and s is None:
            s = i
        elif not v and s is not None:
            out.append((s, i - 1)); s = None
    if s is not None:
        out.append((s, len(mask) - 1))
    return out


def staves_of(dark):
    H, W = dark.shape
    thin = dark.copy()
    thin[3:, :] &= ~dark[:-3, :]
    thin[:-3, :] &= ~dark[3:, :]
    frac = thin.sum(1) / W
    lines = [((a + b) / 2, b - a + 1) for a, b in runs(frac > 0.18)]
    st, i = [], 0
    while i + 3 < len(lines):
        ys = [l[0] for l in lines[i:i + 5]]
        d = np.diff(ys) if len(ys) == 5 else np.array([0])
        if len(ys) == 5 and d.min() > 5 and d.max() - d.min() <= 2.5 and d.max() < 30:
            st.append(ys); i += 5; continue
        # middle line hidden under multi-rest bars: pattern d, 2d, d
        y4 = [l[0] for l in lines[i:i + 4]]
        d4 = np.diff(y4)
        if len(y4) == 4 and 5 < d4[0] < 30 and abs(d4[2] - d4[0]) <= 2.5 and abs(d4[1] - 2 * d4[0]) <= 3:
            st.append([y4[0], y4[1], (y4[1] + y4[2]) / 2, y4[2], y4[3]]); i += 4; continue
        i += 1
    out = []
    for ys in st:
        top, bot = int(round(ys[0])), int(round(ys[4]))
        sp = (ys[4] - ys[0]) / 4
        hits = sum(dark[int(round(y)) - 1:int(round(y)) + 2].any(0).astype(int) for y in ys)
        rr = runs(hits >= 3)
        merged = []
        for a, b in rr:
            if merged and a - merged[-1][1] < sp * 3:
                merged[-1] = (merged[-1][0], b)
            else:
                merged.append((a, b))
        r = max(merged, key=lambda ab: ab[1] - ab[0])
        out.append(dict(top=top, bot=bot, sp=sp, left=r[0], right=r[1]))
    return out


def ext(dark, x0, x1, y, step, limit):
    """How many pixels the dark column x0..x1 continues from row y going in direction step."""
    n = 0
    while 0 <= y < dark.shape[0] and n < limit and dark[y, x0:x1 + 1].any():
        y += step; n += 1
    return n


def barlines(dark, s, nxt_top, prev_bot):
    top, bot, sp = s['top'], s['bot'], s['sp']
    seg = dark[top:bot + 1, :]
    full = seg.mean(0) >= 0.97
    xs = []
    for a, b in runs(full):
        if b - a > 10:
            continue
        x = (a + b) // 2
        if x < s['left'] - 3 or x > s['right'] + 4:
            continue
        up = ext(dark, a, b, top - 1, -1, 400)
        dn = ext(dark, a, b, bot + 1, 1, 400)
        ok_up = up <= 3 or (prev_bot is not None and up >= top - prev_bot - 2)
        ok_dn = dn <= 3 or (nxt_top is not None and dn >= nxt_top - bot - 2)
        if ok_up and ok_dn:
            xs.append(x)
    merged = []
    for x in xs:
        if merged and x - merged[-1] < sp * 1.6:
            merged[-1] = x
        else:
            merged.append(x)
    if not merged or s['right'] - merged[-1] > sp * 2:
        merged.append(s['right'])
    return merged


def page_boxes(p, img):
    g = np.asarray(img.convert('L'))
    dark = g < 140
    st = staves_of(dark)
    for i, s in enumerate(st):
        s['xs'] = barlines(dark, s, st[i + 1]['top'] if i + 1 < len(st) and st[i + 1]['top'] - s['bot'] < s['sp'] * 14 else None,
                           st[i - 1]['bot'] if i > 0 and s['top'] - st[i - 1]['bot'] < s['sp'] * 14 else None)
    systems = []
    for i, s in enumerate(st):
        last = systems[-1] if systems else None
        joined = False
        if last is not None:
            prev = st[i - 1]
            for x in range(min(s['left'], prev['left']) - 6, min(s['left'], prev['left']) + 4):
                if 0 <= x < dark.shape[1] and dark[prev['bot']:s['top'], x].mean() > 0.97:
                    joined = True; break
        if joined:
            last['bot'] = s['bot']; last['rows'] += 1; last['allxs'].append(s['xs'])
        else:
            systems.append(dict(s, rows=1, allxs=[s['xs']]))
    for s in systems:
        if s['rows'] > 1:  # keep barlines found on every staff of the system (aligned note stems are not)
            need = s['rows'] // 2 + 1
            cand = sorted({round(x) for o in s['allxs'] for x in o})
            xs = []
            for x in cand:
                if sum(any(abs(x - y) <= 3 for y in o) for o in s['allxs']) >= need and not (xs and x - xs[-1] <= 4):
                    xs.append(x)
            s['xs'] = xs
            if not s['xs'] or s['right'] - s['xs'][-1] > s['sp'] * 2:
                s['xs'].append(s['right'])
    chars = p.chars
    for s in systems:
        t, l = s['top'] / SCALE, s['left'] / SCALE
        near = [c for c in chars if c['text'].isdigit() and l - 12 < c['x0'] < l + 22 and t - 20 < c['bottom'] < t + 1]
        near.sort(key=lambda c: c['x0'])
        s['cand'] = near
        s['mr_chars'] = [c for c in chars if (c['text'].isdigit() or ord(c['text'][0]) in DIG)
                         and t - 26 < c['bottom'] < t + 1 and c['x0'] > l + 8]
    return systems, dark


def multirest(s, dark, a, b):
    """Return the count if the box (pixel x a..b) is a multi-measure rest, else 1."""
    if b - a < s['sp'] * 6:
        return 1
    mid = (s['top'] + s['bot']) // 2
    band = dark[int(mid - s['sp'] * 0.15):int(mid + s['sp'] * 0.15) + 1, a + 4:b - 4]
    if band.shape[1] == 0 or band.all(0).mean() < 0.45:
        return 1
    return ocr_count(s, dark, a, b)


def ocr_count(s, dark, a, b):
    n = _ocr_count(s, dark, a, b, 3.6, 0.4)
    return n if n else _ocr_count(s, dark, a, b, 4.6, 0.2)


def _ocr_count(s, dark, a, b, hi, lo):
    """Read the bar count printed above a multi-measure rest."""
    import subprocess, tempfile, os
    from PIL import Image
    sp = s['sp']
    y0, y1 = int(s['top'] - sp * hi), int(s['top'] - max(2, sp * lo))
    crop = dark[max(0, y0):y1, a + 2:b - 2]
    if crop.size == 0 or not crop.any():
        return 0
    # keep only the bounding box of ink in the middle third (the number is centred)
    cols = np.where(crop.any(0))[0]; rows = np.where(crop.any(1))[0]
    w = crop.shape[1]
    mid = [c for c in cols if w * 0.2 < c < w * 0.8]
    if not mid:
        return 0
    c0, c1 = max(0, min(mid) - 4), min(w, max(mid) + 5)
    sub = crop[:, c0:c1]
    r = np.where(sub.any(1))[0]
    sub = sub[max(0, r.min() - 4):r.max() + 5]
    im = Image.fromarray(np.where(sub, 0, 255).astype('uint8')).resize((sub.shape[1] * 3, sub.shape[0] * 3))
    pad = Image.new('L', (im.width + 40, im.height + 40), 255); pad.paste(im, (20, 20))
    fd, path = tempfile.mkstemp(suffix='.png'); os.close(fd); pad.save(path)
    out = ''
    try:
        for psm in ('7', '8', '10'):
            out = subprocess.run(['tesseract', path, '-', '--psm', psm, '-c', 'tessedit_char_whitelist=0123456789'],
                                 capture_output=True, text=True, timeout=20).stdout.strip()
            if out.isdigit() and 1 < int(out) < 300:
                break
    finally:
        os.unlink(path)
    return int(out) if out.isdigit() and 1 < int(out) < 300 else 0


def layout(path, total=None):
    pdf = pdfplumber.open(path)
    syss = []
    for pi, p in enumerate(pdf.pages):
        img = p.to_image(resolution=72 * SCALE).original
        W, H = img.size
        systems, dark = page_boxes(p, img)
        for s in systems:
            if not s['xs']:
                continue
            edges = [s['left']] + [x for x in s['xs'] if x > s['left'] + 4]
            cells = []
            for a, b in zip(edges, edges[1:]):
                if b - a < s['sp'] * 2:
                    continue
                cells.append([multirest(s, dark, a, b), a / W, (s['top'] - s['sp'] * 3) / H, b / W, (s['bot'] + s['sp'] * 2.5) / H])
            syss.append(dict(page=pi + 1, cand=s['cand'], cells=cells))
    from collections import Counter
    import itertools
    # 1) a "bar" much narrower than its neighbours is a split made by a note stem: join it to the next one
    for sy in syss:
        cells = sy['cells']
        widths = sorted(c[3] - c[1] for c in cells if c[0] == 1)
        if len(widths) >= 2:
            med = widths[len(widths) // 2]
            i = 0
            while i < len(cells):
                c = cells[i]
                if c[0] == 1 and (c[3] - c[1]) < 0.3 * med and len(cells) > 1:
                    j = i + 1 if i + 1 < len(cells) else i - 1
                    o = cells[j]
                    lo, hi = (c, o) if j > i else (o, c)
                    cells[min(i, j)] = [o[0], lo[1], lo[2], hi[3], lo[4]]
                    del cells[max(i, j)]
                    continue
                i += 1
    # 2) printed bar numbers (font used by the bar numbers; overlapping digits give alternatives)
    fonts = Counter(c['fontname'] for sy in syss for c in sy['cand'])
    font = fonts.most_common(1)[0][0] if fonts else None
    prev, expected = 0, 1
    for sy in syss:
        ds = [c for c in sy['cand'] if c['fontname'] == font]
        nums = set()
        if ds:
            base = ds[0]['bottom']
            ds = sorted([c for c in ds if abs(c['bottom'] - base) < 1.5], key=lambda c: c['x0'])
            slots = []
            for c in ds:
                if slots and abs(c['x0'] - slots[-1][0]['x0']) < 1.2:
                    slots[-1].append(c)
                else:
                    slots.append([c])
            if 0 < len(slots) <= 3:
                for combo in itertools.product(*[[c['text'] for c in sl] for sl in slots]):
                    nums.add(int(''.join(combo)))
        nums = [n for n in nums if n > prev and not (total and n > total)]
        n = min(nums, key=lambda v: abs(v - expected)) if nums else None
        if sy is syss[0] and n is None:
            n = 1
        sy['num'] = n
        if n is not None:
            prev = n; expected = n
        expected += sum(max(1, c[0]) for c in sy['cells'])
    warn = []
    # 3) reconcile each numbered line, together with the unnumbered lines after it, with the next printed number
    groups = []
    for sy in syss:
        if sy['num'] is not None or not groups:
            groups.append([sy])
        else:
            groups[-1].append(sy)
    for gi, g in enumerate(groups):
        start = g[0]['num'] or 1
        nxt = groups[gi + 1][0]['num'] if gi + 1 < len(groups) else (total + 1 if total else None)
        span = (nxt - start) if nxt else None
        cells = [c for sy in g for c in sy['cells']]
        if span is None or span <= 0:
            for c in cells:
                if c[0] == 0: c[0] = 1
            continue
        for c in cells:
            if c[0] > span: c[0] = 0
        unknown = [c for c in cells if c[0] == 0]
        known = sum(c[0] for c in cells if c[0] > 0)
        if unknown:
            rem = span - known
            if rem >= len(unknown):
                each = rem // len(unknown)
                for c in unknown: c[0] = each
                unknown[-1][0] += rem - each * len(unknown)
            else:
                for c in unknown: c[0] = 1
                warn.append(f"p{g[0]['page']} m{start}: counts don't add up")
            continue
        if known == span:
            continue
        multis = [c for c in cells if c[0] > 1]
        if multis and multis[-1][0] + span - known >= 2:
            multis[-1][0] += span - known
            continue
        warn.append(f"p{g[0]['page']} m{start}: {known} bars found, {span} expected")
        guard = 0
        while known < span and guard < 6:   # a barline was missed: split the widest single bar
            sy = max(g, key=lambda q: max([c[3] - c[1] for c in q['cells'] if c[0] == 1] or [0]))
            singles = [c for c in sy['cells'] if c[0] == 1]
            if not singles: break
            w = max(singles, key=lambda c: c[3] - c[1]); i0 = sy['cells'].index(w); mid = (w[1] + w[3]) / 2
            sy['cells'][i0:i0 + 1] = [[1, w[1], w[2], mid, w[4]], [1, mid, w[2], w[3], w[4]]]
            known += 1; guard += 1
        while known > span and guard < 6:   # an extra one: merge the narrowest neighbouring pair on a line
            best = None
            for sy in g:
                cs = sy['cells']
                for i in range(len(cs) - 1):
                    if cs[i][0] == 1 and cs[i + 1][0] == 1:
                        wsum = (cs[i][3] - cs[i][1]) + (cs[i + 1][3] - cs[i + 1][1])
                        if best is None or wsum < best[0]: best = (wsum, sy, i)
            if not best: break
            _, sy, i = best; a_, b_ = sy['cells'][i], sy['cells'][i + 1]
            sy['cells'][i:i + 2] = [[1, a_[1], a_[2], b_[3], a_[4]]]
            known -= 1; guard += 1
    boxes, m = [], 1
    for s in syss:
        if s['num'] is not None:
            m = s['num']
        for n, x0, y0, x1, y1 in s['cells']:
            n = max(1, n)
            boxes.append([m, m + n - 1, s['page'], round(x0, 4), round(y0, 4), round(x1, 4), round(y1, 4)])
            m += n
    return boxes, warn


if __name__ == '__main__':
    b, w = layout(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else None)
    print(json.dumps({'boxes': b, 'warn': w}))
