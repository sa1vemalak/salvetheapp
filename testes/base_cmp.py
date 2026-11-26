import sys, json, mido; sys.path.insert(0,'server/robo'); import robo
pdf = '/root/.claude/uploads/7639134b-da79-503b-9d91-2316ae46b5a7/8b42b664-04_-_Poesia_3_Capricorniana-Grade.pdf'
boxes, _ = robo.layout2.layout(pdf, None)
s = robo.load_score(['rtest/raw/grade.mxl'], boxes, pdf)
info = robo.pdf_text(pdf); bars = robo.chords_to_bars(info['chords'], boxes)
s.replace(s.parts[3], robo.comping_part(s, bars, 'Base')); u = robo.unfold(s, robo.LAST_PLAN)
spb=60/152; ours=[]; P=u.parts[3]
for n in P.flatten().notes:
    t=float(n.getOffsetInHierarchy(P))*spb
    for p in n.pitches: ours.append((t,t+float(n.quarterLength)*spb,p.midi))
mid=mido.MidiFile('mest/gab/capricorniana__so-base.mid'); t=0; on={}; ref=[]
for msg in mid:
    t+=msg.time
    if msg.type=='note_on' and msg.velocity: on.setdefault(msg.note,[]).append(t)
    elif msg.type in('note_off','note_on') and on.get(msg.note): ref.append((on[msg.note].pop(0),t,msg.note))
M=json.load(open('mest/gab/capricorniana.json'))['measures']
ok=n=0; bad=[]
for i,(num,t0) in enumerate(M):
    for half in (0.15, 0.15 + (M[i+1][1]-t0)/2 if i+1<len(M) else None):
        if half is None: continue
        tt=t0+half
        R={x[2]%12 for x in ref if x[0]<=tt<x[1]}; O={x[2]%12 for x in ours if x[0]<=tt<x[1]}
        if not R: continue
        n+=1; same=(R==O) or len(R&O)>=3; ok+=same
        if not same: bad.append((i+1,round(half,2),sorted(R),sorted(O)))
print(f'meios-compassos com o mesmo acorde da base oficial: {ok}/{n} = {ok/n:.0%}'); print(bad[:25])
