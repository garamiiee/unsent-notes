'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCheck, FileText, History, LockKeyhole, Mail, MessageSquare, PenLine, Plus, Send, Sparkles, Trash2, X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

const themes = [
  { id: 'chat', name: '사내 메신저', en: 'MESSENGER', caption: '읽음 표시까지, 속 시원하게', icon: MessageSquare, action: '메시지 보내기', steps: ['대화방에 연결하는 중', '메시지 전송 중', '상대가 메시지를 읽는 중'] },
  { id: 'mail', name: '이메일', en: 'EMAIL', caption: '참조 없이, 오직 당신에게', icon: Mail, action: '메일 발송하기', steps: ['메일 준비 중', '메일 처리 중', '받은 편지함으로 이동 중'] },
  { id: 'official', name: '공문', en: 'OFFICIAL LETTER', caption: '이 진심, 정식으로 접수합니다', icon: FileText, action: '공문 접수하기', steps: ['공문에 직인을 찍는 중', '문서 이관 중', '문서 접수 중'] },
  { id: 'report', name: '보고서', en: 'REPORT', caption: '참아온 마음을 보고드립니다', icon: PenLine, action: '보고서 제출하기', steps: ['보고서 최종 검토 중', '결재 요청 중', '보고서 제출 중'] },
] as const;
const people = [
  { name: '상사', emoji: '💼', detail: '퇴근하고 싶은 나에게', hint: '부장님만 집 있나요. 저도 퇴근하고 싶어요.', reply: '내가 너무 당연하게 일을 맡기고, 퇴근 시간도 제대로 챙기지 못했네요. 미안해요. 말 꺼내기까지 많이 참았을 텐데 내가 먼저 알아챘어야 했어요. 남은 일은 내가 정리할게요. 오늘은 먼저 들어가요.' },
  { name: '교수님', emoji: '🎓', detail: '학점보다 소중한 진심', hint: '교수님, 과제는 하나인데 왜 제 주말은 전부 사라지나요?', reply: '말씀 읽었습니다. 학생이 감당해야 하는 부담을 제가 충분히 살피지 못했습니다. 힘든 상황을 직접 말씀하시게 해서 미안합니다. 과제 분량과 기한을 다시 검토하고 조정하겠습니다.' },
  { name: '팀플 빌런 팀원', emoji: '😈', detail: '우리, 같은 팀 맞죠?', hint: '이름 말고 내용도 보고서에 남겨주면 안 될까?', reply: '미안해. 내가 할 일을 계속 미뤄서 네가 다 떠안게 했어. 바빴다는 말로 넘길 일이 아닌데 너무 쉽게 생각했어. 남은 자료랑 발표 정리는 내가 맡을게. 또 네가 재촉하게 만들지 않을게.' },
  { name: '클라이언트', emoji: '🤝', detail: '최종_진짜최종의 끝', hint: '간단한 수정이라고 하셨지만 제 밤은 간단하지 않아요.', reply: '정말 죄송합니다. 저희가 의견을 제대로 정리하지 않고 수정을 반복 요청드려 부담을 드렸습니다. 작업 시간과 수고를 충분히 고려하지 못했습니다. 추가 요청은 내부에서 먼저 정리하고, 일정과 비용도 다시 협의드리겠습니다.' },
  { name: '전 연인', emoji: '🥀', detail: '이제는 보내줄 마음', hint: '그때는 못 했던 말인데, 나도 참 많이 애썼어.', reply: '미안해. 그때 네가 얼마나 힘들었을지 생각하기보다 내 입장부터 말했어. 네가 이렇게 말할 때까지 제대로 사과도 안 했네. 내가 상처 준 건 맞아. 지금이라도 변명 없이 사과하고 싶어. 답장 안 해도 괜찮아.' },
  { name: '친구', emoji: '🧃', detail: '가까워서 못 했던 말', hint: '인스타 올리기 전에 제발 카톡 먼저 확인해라ㅠㅠ', reply: '미안해 진짜. 네 연락을 너무 편하게 생각했어. 기다리는 너는 신경 쓰였을 텐데 내가 아무렇지 않게 넘겼네. 서운할 만했어. 다음엔 답 늦어지면 한마디라도 먼저 남길게.' },
];

type Entry = { id: string; theme: string; person: string; message: string; reply: string; date: string };
const KEY = 'unsent-heart-history-v1';
export default function Home() {
  const [step, setStep] = useState(0);
  const [subject, setSubject] = useState('그동안 전하지 못했던 말');
  const headingRef = useRef<HTMLHeadingElement>(null);
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
        setTheme(String(v.theme)); setPerson(String(v.person)); setMessage(v.message); setView('write'); setStep(2); setStage('compose'); setShowReply(false); setResult(null);
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
    catch { setNotice('브라우저 저장 공간을 사용할 수 없어요. 기록이 저장되지 않을 수 있어요.'); }
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
  useEffect(() => { if (view === 'write') { window.scrollTo({ top: 0 }); headingRef.current?.focus({ preventScroll: true }); } }, [step, stage, view]);
  function send() { if (!loaded || !message.trim() || sending.current || stage !== 'compose') return; sending.current = true; setProgress(0); setShowReply(false); setStage('sending'); }
  function reset() { setStep(0); setMessage(''); setResult(null); setShowReply(false); setStage('compose'); setView('write'); }
  return <div className="app-shell">
    <main>{view === 'history' ? <section className="history-page"><h1>보관함</h1><p className="intro">기록은 이 브라우저에 저장됩니다.</p><button className="text-button" onClick={() => setView('write')}><ArrowLeft size={16} />작성 화면으로</button>{entries.length === 0 ? <div className="empty"><Mail size={42} /><h2>저장된 기록이 없습니다</h2><button className="primary" onClick={reset}>작성하기 <ArrowRight size={17} /></button></div> : <div className="history-list">{entries.map(e => <article className="history-card" key={e.id}><div className="history-meta"><span>{themes.find(x => x.id === e.theme)?.name} · {e.person}에게</span><time>{new Date(e.date).toLocaleDateString('ko-KR')}</time></div><p className="saved-message">{e.message}</p><details><summary>가상 반응 보기</summary><p>{e.reply}</p></details><div className="history-actions"><button aria-label={`${e.person}에게 보낸 기록 삭제`} onClick={() => setEntries(prev => prev.filter(x => x.id !== e.id))}><Trash2 size={15} />삭제</button></div></article>)}</div>}</section> : <>
      <div className="journey" data-screen={stage === 'compose' ? step : stage}>
        <ol className="journey-progress" aria-label="전달 단계">{['전달 방식', '상대 선택', '진심 작성', '전달 중', '전달 완료'].map((label, i) => { const active = stage === 'sending' ? 3 : stage === 'done' ? 4 : step; return <li key={label} aria-current={i === active ? 'step' : undefined} className={i <= active ? 'reached' : ''}><span>{i < active ? <Check size={13} /> : i + 1}</span><b>{label}</b></li>; })}</ol>
        {stage === 'compose' && <>
          <section className="step-heading"><div className="eyebrow">STEP 0{step + 1}</div><h1 ref={headingRef} tabIndex={-1}>{['전달 방식 선택', '상대 선택', '메시지 작성'][step]}</h1>{step === 0 && <p className="intro">오늘의 마음에 어울리는 전달 방식을 골라주세요.</p>}</section>
          {step === 0 && <RadioGroup value={theme} onValueChange={v => setTheme(String(v))} aria-label="전달 방식" className="step-themes">{themes.map(item => { const I = item.icon; return <label key={item.id} className={`theme-card ${theme === item.id ? 'selected' : ''}`}><span className="theme-icon"><I size={30} /></span><img className="theme-photo" src={`/images/${item.id}.png`} alt="" /><span className="theme-copy"><strong>{item.name}</strong><small>{item.caption}</small></span><RadioGroupItem value={item.id} aria-label={item.name} /></label>; })}</RadioGroup>}
          {step === 1 && <RadioGroup value={person} onValueChange={v => setPerson(String(v))} aria-label="받는 상대" className="step-people">{people.map(item => <label key={item.name} className={`person-card ${person === item.name ? 'selected' : ''}`}><span aria-hidden="true">{item.emoji}</span><strong>{item.name}</strong><RadioGroupItem value={item.name} aria-label={item.name} /></label>)}</RadioGroup>}
          {step === 2 && <div className={`authentic-editor authentic-${theme}`}>
            {theme === 'chat' ? <>
              <div className="talk-header"><span className="avatar">{p.emoji}</span><strong>{p.name}</strong><MessageSquare size={20} /></div>
              <div className="talk-conversation"><span className="talk-date">오늘</span><div className="talk-preview">{message || '메시지를 입력하세요.'}</div><span className="draft-tag">전송 전 미리보기</span></div>
              <div className="talk-input"><label className="sr-only" htmlFor="message">전하지 못했던 말</label><textarea id="message" maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder={p.hint} /><span>{message.length} / 2,000</span><button className="talk-send" disabled={!loaded || !message.trim()} onClick={send}>전송</button></div>
            </> : theme === 'mail' ? <>
              <div className="mail-title">새 메일 </div><div className="mail-fields"><div><span>받는사람</span><b>{p.name} &lt;recipient@unsent.invalid&gt;</b></div><div><span>보낸사람</span><b>오늘의 나 &lt;me@unsent.invalid&gt;</b></div><label><span>제목</span><input aria-label="메일 제목" value={subject} maxLength={120} onChange={e => setSubject(e.target.value)} /></label></div><div className="mail-body"><label className="sr-only" htmlFor="message">메일 본문</label><textarea id="message" maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder={p.hint} /></div><div className="mail-bottom"><span>{message.length} / 2,000</span></div>
            </> : <>
              {theme === 'report' && <div className="hwp-chrome"><div className="hwp-title"><FileText size={17} />전하지 못한 진심.hwp </div><div className="hwp-menu" aria-hidden="true">파일　 편집　 보기　 입력　 서식　 쪽　 검토</div><div className="hwp-ribbon" aria-hidden="true"><span>바탕글 ▾</span><span>함초롬바탕 ▾</span><span>11 pt</span><b>가</b><i>가</i><u>가</u><span>≡　☷</span></div><div className="hwp-ruler" aria-hidden="true">1　　 2　　 3　　 4　　 5　　 6　　 7　　 8　　 9　　 10</div></div>}
              <div className="paper-desk"><article className={`a4-paper ${theme}`}>
                {theme === 'official' ? <><h2 className="organization">마 음 정 리 사 무 소</h2><div className="official-fields"><p>수신　{p.name}</p><p>(경유)　마음 담당자</p><p>제목　전하지 못한 진심 전달의 건</p></div><p className="formal-intro">1. 귀하의 평안한 하루를 기원합니다.<br />2. 그동안 전달하지 못한 마음을 아래와 같이 전합니다.</p><div className="paper-subtitle">- 아 래 -</div></> : <><div className="report-code">문서번호: 마음-001　 |　 내부 보고</div><div className="approval"><span>담당<br /><b>오늘의 나</b></span><span>검토<br /><b>나의 마음</b></span><span>결재<br /><b>대기</b></span></div><h2 className="report-heading">전하지 못한 진심 보고서</h2><div className="report-meta">수신: {p.name}　　작성: 오늘의 나</div><h3 className="report-section">1. 보고 내용</h3></>}
                <label className="sr-only" htmlFor="message">문서 본문</label><textarea id="message" maxLength={2000} value={message} onChange={e => setMessage(e.target.value)} placeholder={p.hint} />
                {theme === 'official' ? <><p className="document-end">위와 같이 진심을 전합니다.　끝.</p><div className="official-sign">마 음 정 리 사 무 소 장 <span className="seal">가상<br />직인</span></div><div className="official-bottom">시행　마음-001　　접수　가상 전달 후 접수<br />담당　오늘의 나　　공개 구분　나만 보기</div></> : <><div className="paper-page">- 1 -</div></>}
              </article></div><div className="document-status"><span>1 / 1쪽　·　{message.length} / 2,000자</span></div>
            </>}
          </div>}
          <div className="step-actions"><button className="secondary" onClick={() => setStep(n => n - 1)} disabled={step === 0}><ArrowLeft size={16} />이전</button>{step === 0 && <span><LockKeyhole size={13} />실제 상대에게 전송되지 않습니다.</span>}{step < 2 ? <button className="primary" onClick={() => setStep(n => n + 1)}>다음 <ArrowRight size={17} /></button> : <button className={`primary ${theme === 'mail' ? 'mail-primary' : ''}`} onClick={send} disabled={!loaded || !message.trim()}>{t.action}<Send size={17} /></button>}</div>
        </>}
        {stage === 'sending' && <section className={`send-screen send-screen-${theme}`} role="status"><div className={`sending-icon sending-${theme}`}><Icon size={56} /></div>{theme === 'chat' ? <div className="sent-bubble"><span>{progress < 2 ? '1' : '읽음'}</span><p>{message}</p></div> : <div className={`transit-document transit-${theme}`}><strong>{theme === 'mail' ? subject : theme === 'official' ? '공문 접수' : '보고서 결재'}</strong><p>{message}</p>{progress === 2 && <b className="received-stamp">{theme === 'mail' ? '발송 완료' : '접수 완료'}</b>}</div>}<h1>{t.steps[progress]}</h1><div className="progress-dots">{t.steps.map((_, i) => <i key={i} className={i <= progress ? 'filled' : ''} />)}</div></section>}
        {stage === 'done' && result && <section className="completion standalone-completion" aria-live="polite"><div className="success-symbol"><CheckCheck size={38} /></div><h1>전달 완료</h1><div className="receipt"><div><span>TO. {result.person}</span><span>전달 완료 <Check size={13} /></span></div><blockquote>{result.message}</blockquote></div>{showReply ? <div className="reply"><span><Sparkles size={14} />답장</span><p>{result.reply}</p></div> : <button className="reaction-button" onClick={() => setShowReply(true)}><Sparkles size={16} />반응 보기</button>}<div className="result-actions"><button className="primary" onClick={reset}>새로 작성 <Plus size={17} /></button></div></section>}
        <div className="archive-access"><button onClick={() => setView('history')} disabled={stage === 'sending'}><History size={16} />마음 보관함 <span>{entries.length}</span></button></div></div></>}
      {notice && <div className="notice" role="status">{notice}<button aria-label="알림 닫기" onClick={() => setNotice('')}><X size={16} /></button></div>}</main></div>;
}
