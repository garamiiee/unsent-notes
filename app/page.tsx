'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCheck, FileText, Heart, History, LockKeyhole, Mail, MessageSquare, MoreHorizontal, PenLine, Plus, Send, ShieldCheck, Sparkles, Trash2, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const themes = [
  { id: 'chat', name: '사내 메신저', en: 'MESSENGER', caption: '읽음 표시까지, 속 시원하게', icon: MessageSquare, action: '메시지 보내기', steps: ['대화방에 연결하는 중', '꾹 참았던 말 전송 중', '상대가 메시지를 읽는 중'] },
  { id: 'mail', name: '이메일', en: 'EMAIL', caption: '참조 없이, 오직 당신에게', icon: Mail, action: '메일 발송하기', steps: ['진심을 메일에 담는 중', '가상 메일 서버 처리 중', '받은 편지함으로 이동 중'] },
  { id: 'official', name: '공문', en: 'OFFICIAL LETTER', caption: '이 진심, 정식으로 접수합니다', icon: FileText, action: '공문 접수하기', steps: ['공문에 직인을 찍는 중', '가상 문서함으로 이관 중', '마음 담당 부서에 접수 중'] },
  { id: 'report', name: '보고서', en: 'REPORT', caption: '참아온 마음을 보고드립니다', icon: PenLine, action: '보고서 제출하기', steps: ['보고서 최종 검토 중', '가상 결재선으로 이동 중', '진심을 최종 제출하는 중'] },
] as const;
const people = [
  { name: '상사', emoji: '💼', detail: '퇴근하고 싶은 나에게', hint: '부장님만 집 있나요. 저도 퇴근하고 싶어요.', reply: '이 건은 긴급 승인입니다. 오늘은 칼퇴하세요. 저도 집에 가고 싶었거든요… 🏃' },
  { name: '교수님', emoji: '🎓', detail: '학점보다 소중한 진심', hint: '교수님, 과제는 하나인데 왜 제 주말은 전부 사라지나요?', reply: '학생의 의견 잘 읽었습니다. 이 정도 표현력이면 진심 과목은 A+ 드리겠습니다. 🎓' },
  { name: '팀플 빌런 팀원', emoji: '🫥', detail: '우리, 같은 팀 맞죠?', hint: '이름 말고 내용도 보고서에 남겨주면 안 될까?', reply: '뜨끔해서 문서를 열었습니다. 커서만 깜빡이는 사람이 되지 않겠습니다… 🫡' },
  { name: '클라이언트', emoji: '🤝', detail: '최종_진짜최종의 끝', hint: '간단한 수정이라고 하셨지만 제 밤은 간단하지 않아요.', reply: '최종_진짜최종_이번엔정말최종 파일로 접수했습니다. 마음의 추가 수정은 없습니다. 🤝' },
  { name: '전 연인', emoji: '🥀', detail: '이제는 보내줄 마음', hint: '그때는 못 했던 말인데, 나도 참 많이 애썼어.', reply: '이 편지는 잘 도착했어. 이제 네 하루의 주인공은 너였으면 좋겠어. 엔딩 크레딧은 여기까지. 🌿' },
  { name: '친구', emoji: '🧃', detail: '가까워서 못 했던 말', hint: '인스타 올리기 전에 제발 카톡 먼저 확인해라ㅠㅠ', reply: '카톡 알림보다 양심 알림이 먼저 울렸다… 지금 확인했어. 다음 커피는 내가 살게. ☕' },
];
type Entry = { id: string; theme: string; person: string; message: string; reply: string; date: string };
const KEY = 'unsent-heart-history-v1';
export default function Home() {
  const [theme, setTheme] = useState('chat');
  const [person, setPerson] = useState('상사');
  const [message, setMessage] = useState('');
  const [view, setView] = useState<'write' | 'history'>('write');
  const [stage, setStage] = useState<'compose' | 'sending' | 'done'>('compose');
  const [progress, setProgress] = useState(0);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [result, setResult] = useState<Entry | null>(null);
  const [showReply, setShowReply] = useState(false);
  const [notice, setNotice] = useState('');
  const [loaded, setLoaded] = useState(false);
  const sending = useRef(false);
  const t = themes.find(x => x.id === theme) ?? themes[0];
  const p = people.find(x => x.name === person) ?? people[0];
  const Icon = t.icon;
  const currentStage = useRef(stage);
  currentStage.current = stage;
  useEffect(() => {
    const context = (document as Document & { modelContext?: { registerTool: (tool: { name: string; title: string; description: string; inputSchema: object; annotations: object; execute: (input: unknown) => Promise<object> }, options: { signal: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try { void Promise.resolve(context.registerTool({
      name: 'stage_unsent_message', title: '진심 작성하기', description: '전달 방식, 상대, 내용을 작성 화면에 준비합니다. 발송하거나 기록을 저장하지 않습니다.',
      inputSchema: { type: 'object', properties: { theme: { type: 'string', enum: themes.map(x => x.id) }, person: { type: 'string', enum: people.map(x => x.name) }, message: { type: 'string', minLength: 1, maxLength: 2000 } }, required: ['theme', 'person', 'message'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const v = input as Record<string, unknown> | null;
        if (!v || !themes.some(x => x.id === v.theme) || !people.some(x => x.name === v.person) || typeof v.message !== 'string' || !v.message.trim() || v.message.length > 2000) throw new Error('유효한 전달 방식, 상대, 1~2000자의 내용을 입력하세요.');
        if (currentStage.current === 'sending') throw new Error('전달 연출이 끝난 뒤 다시 시도하세요.');
        setTheme(String(v.theme)); setPerson(String(v.person)); setMessage(v.message); setView('write'); setStage('compose'); setShowReply(false); setResult(null);
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        return { status: 'draft_staged', sent: false };
      },
    }, { signal: lifecycle.signal })).catch(() => {}); } catch { /* Optional browser API. */ }
    return () => lifecycle.abort();
  }, []);
  useEffect(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
      if (Array.isArray(value)) setEntries(value.filter((e): e is Entry => !!e && typeof e === 'object' && ['id', 'theme', 'person', 'message', 'reply', 'date'].every(k => typeof e[k] === 'string')).slice(0, 100));
    } catch { setNotice('이 브라우저에서 이전 기록을 불러오지 못했어요.'); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(KEY, JSON.stringify(entries)); }
    catch { setNotice('브라우저 저장 공간을 사용할 수 없어요. 결과를 텍스트로 저장해 주세요.'); }
  }, [entries, loaded]);
  useEffect(() => {
    if (stage !== 'sending') return;
    const a = setTimeout(() => setProgress(1), 1100);
    const b = setTimeout(() => setProgress(2), 2300);
    const c = setTimeout(() => {
      const item: Entry = { id: crypto.randomUUID(), theme: t.id, person: p.name, message: message.trim(), reply: p.reply, date: new Date().toISOString() };
      setResult(item); setEntries(prev => [item, ...prev].slice(0, 100)); setStage('done'); sending.current = false;
    }, 3600);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); };
  }, [stage, message, t, p]);
  function send() { if (!loaded || !message.trim() || sending.current || stage !== 'compose') return; sending.current = true; setProgress(0); setShowReply(false); setStage('sending'); }
  function reset() { setMessage(''); setResult(null); setShowReply(false); setStage('compose'); setView('write'); }
  function save(e: Entry) {
    const blob = new Blob([`전하지 못한 진심 · 가상 전달 기록\n${e.person}에게\n${new Date(e.date).toLocaleString('ko-KR')}\n\n${e.message}\n\n가상 반응\n${e.reply}\n\n실제로 발송되지 않은 메시지입니다.`], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = '전하지-못한-진심.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="전하지 못한 진심 홈"><span className="brand-icon"><Send size={21} /></span><span>전하지 못한 진심<small>THE UNSENT CLUB</small></span></a><nav aria-label="메인 메뉴"><button className={view === 'write' ? 'active' : ''} onClick={() => setView('write')} disabled={stage === 'sending'}><PenLine size={16} />진심 보내기</button><button className={view === 'history' ? 'active' : ''} onClick={() => setView('history')} disabled={stage === 'sending'}><History size={16} />마음 보관함<span className="count">{entries.length}</span></button></nav><span className="private-label"><LockKeyhole size={14} />나만의 안전한 공간</span></header>
    <main>{view === 'history' ? <section className="history-page"><div className="eyebrow">YOUR LITTLE ARCHIVE</div><h1>한 번은 꺼내본 마음들<span>.</span></h1><p className="intro">이 기기, 이 브라우저에만 보관돼요. 최근 100개의 진심을 기억해요.</p><button className="text-button" onClick={() => setView('write')}><ArrowLeft size={16} />작성 화면으로</button>{entries.length === 0 ? <div className="empty"><Mail size={42} /><h2>아직 도착한 마음이 없어요</h2><p>오늘, 마음에 남은 한 문장부터 보내보세요.</p><button className="primary" onClick={reset}>첫 진심 쓰기 <ArrowRight size={17} /></button></div> : <div className="history-list">{entries.map(e => <article className="history-card" key={e.id}><div className="history-meta"><span>{themes.find(x => x.id === e.theme)?.name} · {e.person}에게</span><time>{new Date(e.date).toLocaleDateString('ko-KR')}</time></div><p className="saved-message">{e.message}</p><details><summary>가상 반응 보기</summary><p>{e.reply}</p></details><div className="history-actions"><button onClick={() => save(e)}>텍스트 저장</button><button aria-label={`${e.person}에게 보낸 기록 삭제`} onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))}><Trash2 size={15} />삭제</button></div></article>)}</div>}</section> : <>
      <section className="page-heading"><div><div className="eyebrow"><span />마음속 임시보관함, 비워볼까요?</div><h1>그 말, 여기서는<br className="mobile-break" /> 해도 괜찮아요<span>.</span></h1><p className="intro">삼켰던 한마디를 보내는 작은 용기. 오늘은 마음부터 퇴근하세요.</p></div><div className="heading-note"><span>To. 말 못 하고 삼킨 마음</span><span>From. 오늘의 나</span></div></section>
      <div className="workspace"><aside className="options"><section><div className="section-label"><span>01</span><h2>어떤 방식으로 전할까요?</h2></div><RadioGroup value={theme} onValueChange={v => setTheme(String(v))} disabled={stage !== 'compose'} aria-label="전달 방식" className="theme-list">{themes.map(item => { const I = item.icon; return <label key={item.id} className={`theme-card ${theme === item.id ? 'selected' : ''}`}><span className="theme-icon"><I size={22} /></span><span className="theme-copy"><strong>{item.name}</strong><small>{item.caption}</small></span><RadioGroupItem value={item.id} aria-label={item.name} /></label>; })}</RadioGroup></section>
        <section className="recipient-section"><div className="section-label"><span>02</span><h2>누구에게 전하고 싶나요?</h2></div><RadioGroup value={person} onValueChange={v => setPerson(String(v))} disabled={stage !== 'compose'} aria-label="받는 상대" className="people-grid">{people.map(item => <label key={item.name} className={`person-card ${person === item.name ? 'selected' : ''}`}><span aria-hidden="true">{item.emoji}</span><strong>{item.name}</strong><RadioGroupItem className="sr-only" value={item.name} aria-label={item.name} /></label>)}</RadioGroup></section>
        <div className="privacy-note"><ShieldCheck size={20} /><p><strong>마음 놓고 보내세요.</strong><br />실제 상대에게는 전송되지 않아요.<br />작성한 내용은 이 브라우저에만 남아요.</p></div></aside>
        <section className="editor-column"><div className="editor-label"><div className="section-label"><span>03</span><h2>이제, 꺼내볼 시간이에요</h2></div><span className="simulation"><span />가상 전달 모드</span></div><div className={`delivery-window mode-${theme} stage-${stage}`}><div className="window-bar"><div className="window-dots"><i /><i /><i /></div><span>{t.en}</span><LockKeyhole size={13} /></div>
            {stage === 'done' && result ? <div className="completion" aria-live="polite"><div className="success-symbol"><CheckCheck size={38} /></div><span className="eyebrow">DELIVERED, AT LAST</span><h2>드디어, 전했어요.</h2><p>오래 머물렀던 말이 마음 밖으로 나왔네요.<br />오늘의 나는 조금 더 가벼워져도 괜찮아요.</p><div className="receipt"><div><span>TO. {result.person}</span><span>가상 전달 완료 <Check size={13} /></span></div><blockquote>{result.message}</blockquote></div>{showReply ? <div className="reply"><span><Sparkles size={14} />상상 속 답장 · 실제 반응이 아니에요</span><p>{result.reply}</p></div> : <button className="reaction-button" onClick={() => setShowReply(true)}><Sparkles size={16} />궁금하다면, 상상 속 반응 보기</button>}<div className="result-actions"><button className="secondary" onClick={() => save(result)}>텍스트로 저장</button><button className="primary" onClick={reset}>다른 진심 보내기 <Plus size={17} /></button></div><small>기록은 마음 보관함에서 다시 볼 수 있어요.</small></div> : <>
            <div className="recipient-bar"><div className="avatar">{p.emoji}</div><div><strong>{p.name}<span>에게</span></strong><small>{p.detail}</small></div><MoreHorizontal size={21} /></div><div className="writing-area">{theme === 'chat' ? <><div className="date-divider">오늘, 마음을 꺼내는 날</div><div className="system-message"><Heart size={14} />여기서는 눈치 보지 않아도 괜찮아요.</div></> : <div className="document-header"><span>{theme === 'mail' ? '제목' : '문서명'}</span><strong>{theme === 'mail' ? '그동안 전하지 못했던 말' : theme === 'official' ? '마음속 미전달 진심 접수 요청' : '오래 참아온 마음에 관한 보고'}</strong>{theme !== 'mail' && <div className="approval"><span>작성<br /><b>오늘의 나</b></span><span>검토<br /><b>나의 마음</b></span><span>접수<br /><b>{stage === 'sending' ? '진행 중' : '대기'}</b></span></div>}</div>}
            <div className="message-paper"><label htmlFor="message" className="sr-only">전하지 못했던 말</label><textarea id="message" maxLength={2000} placeholder={'무슨 말을 가장 하고 싶었나요?\n\n'+p.hint} value={message} onChange={e => setMessage(e.target.value)} disabled={stage !== 'compose'} /><div className="paper-footer"><span>{theme === 'chat' ? '나만 볼 수 있는 대화예요' : '발신 · 오늘의 나'}</span><span>{message.length.toLocaleString()} / 2,000</span></div></div>
            {stage === 'sending' && <div className="sending-overlay" role="status"><div className={`sending-icon sending-${theme}`}><Icon size={36} /></div><h3>{t.steps[progress]}</h3><p>실제 발송 없이, 마음만 전하고 있어요.</p><div className="progress-dots">{t.steps.map((_, i) => <i key={i} className={i <= progress ? 'filled' : ''} />)}</div></div>}</div><div className="composer-bottom"><span><LockKeyhole size={13} />실제 전송되지 않아요</span><button className="primary" disabled={!loaded || !message.trim() || stage !== 'compose'} onClick={send}>{stage === 'sending' ? '전달하는 중…' : t.action}<Send size={17} /></button></div></>}</div><div className="under-editor"><Sparkles size={15} /><span>예쁘게 말하지 않아도, 잘 정리되지 않아도 괜찮아요.</span></div></section></div></>}
      {notice && <div className="notice" role="status">{notice}<button aria-label="알림 닫기" onClick={() => setNotice('')}><X size={16} /></button></div>}</main><footer><span>전하지 못한 진심 <span className="footer-dot">·</span> 마음을 위한 작은 연습</span><span>실제 발송 0건. 꺼내본 마음은 그 이상.</span></footer></div>;
}
