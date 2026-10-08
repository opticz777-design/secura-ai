import React, { useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { Role } from '../../types';

interface LoginPageProps {
  selectedRole: Role;
  onBack: () => void;
}

const loginStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap');
  .sl-page{display:grid;grid-template-columns:minmax(360px,46fr) 54fr;min-height:100vh;min-height:100svh;font-family:Archivo,"Segoe UI",system-ui,sans-serif}
  .sl-side{position:relative;overflow:hidden;display:flex;flex-direction:column;padding:clamp(24px,3vw,44px);animation:sl-wipe 1s cubic-bezier(.7,0,.2,1) both}
  @keyframes sl-wipe{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0)}}
  .sl-side-asha{background:#F4B63F}
  .sl-side-doctor{background:#0B4F4A}
  .sl-side-sup{background:#BFD7EA}
  .sl-back{display:inline-flex;align-items:center;gap:10px;align-self:flex-start;font-weight:700;font-size:17px;color:var(--sl-ink,#1B1A17);text-decoration:none;padding:8px 14px 8px 8px;border-radius:999px;border:2px solid transparent;transition:border-color .3s,background .3s;position:relative;z-index:2;background:transparent;cursor:pointer}
  .sl-back-icon{width:28px;height:28px;padding:6px;border-radius:50%;background:var(--sl-ink,#1B1A17);transition:transform .4s cubic-bezier(.3,1.5,.5,1);flex-shrink:0}
  .sl-back-icon path{fill:none;stroke:var(--sl-back-stroke);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}
  .sl-back:hover{border-color:var(--sl-ink,#1B1A17)}
  .sl-back:hover .sl-back-icon{transform:translateX(-4px)}
  .sl-back:focus-visible{outline:3px solid var(--sl-ink,#1B1A17);outline-offset:3px}
  .sl-art{position:absolute;left:50%;top:50%;width:min(78%,520px);height:auto;overflow:visible;transform:translate(-50%,-58%);pointer-events:none}
  .sl-art *{transform-box:fill-box;transform-origin:center}
  .sl-art-sun{animation:sl-float 6s ease-in-out infinite}
  .sl-art-walker{animation:sl-bob 1.1s ease-in-out infinite}
  .sl-art-pulse-path{stroke-dasharray:520;animation:sl-trace 2s linear infinite}
  .sl-art-pin{animation:sl-float 3s ease-in-out infinite}
  @keyframes sl-float{0%,100%{translate:0 0}50%{translate:0 -14px}}
  @keyframes sl-bob{0%,100%{translate:0 0}50%{translate:0 -5px}}
  @keyframes sl-trace{from{stroke-dashoffset:520}to{stroke-dashoffset:0}}
  .sl-role{margin-top:auto;position:relative;z-index:2}
  .sl-role h2{font-size:clamp(48px,6.4vw,104px);font-weight:850;font-stretch:68%;line-height:.9;letter-spacing:-.01em}
  .sl-role-asha h2{color:#1B1A17}.sl-role-doctor h2{color:#F3F6F4}.sl-role-sup h2{color:#10243A}
  .sl-role p{margin-top:12px;font-size:19px;font-weight:600}
  .sl-role-asha p{color:#1B1A17}.sl-role-doctor p{color:#BFD7EA}.sl-role-sup p{color:#10243A}
  .sl-main{display:flex;flex-direction:column;justify-content:center;padding:clamp(28px,5vw,80px);background:#F3F6F4;color:#1B1A17}
  .sl-form-wrap{width:min(440px,100%);margin-inline:auto;animation:sl-rise .8s cubic-bezier(.2,.8,.2,1) .5s both}
  @keyframes sl-rise{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
  .sl-brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:24px;letter-spacing:-.02em;font-stretch:90%;color:#1B1A17}
  .sl-h1{margin-top:56px;font-size:clamp(40px,4.4vw,60px);font-weight:850;font-stretch:72%;line-height:.95;color:#1B1A17}
  .sl-lead{margin-top:12px;font-size:18px;color:#55635F;line-height:1.4}
  .sl-form{margin-top:36px;display:grid;gap:24px}
  .sl-field label{display:block;margin-bottom:8px;font-size:16px;font-weight:700;color:#1B1A17}
  .sl-control{position:relative}
  .sl-control input{width:100%;height:56px;padding:0 18px;font-family:inherit;font-size:17px;font-weight:500;color:#1B1A17;background:#fff;border:2px solid #1B1A17;border-radius:14px;outline:none;transition:transform .2s,box-shadow .2s,border-color .2s}
  .sl-control input::placeholder{color:#8A9692}
  .sl-control input:focus{transform:translate(-3px,-3px);box-shadow:5px 5px 0 var(--sl-teal,#0B4F4A);border-color:var(--sl-teal,#0B4F4A)}
  .sl-control.pw input{padding-right:58px}
  .sl-eye{position:absolute;right:10px;top:50%;translate:0 -50%;width:38px;height:38px;border:0;border-radius:10px;background:transparent;display:grid;place-items:center;cursor:pointer;color:#1B1A17;transition:background .2s}
  .sl-eye:hover{background:#E6ECE9}
  .sl-eye:focus-visible{outline:3px solid #0B4F4A}
  .sl-submit{position:relative;overflow:hidden;isolation:isolate;display:flex;align-items:center;justify-content:space-between;width:100%;height:62px;padding:0 12px 0 26px;margin-top:6px;font-family:inherit;font-size:18px;font-weight:700;cursor:pointer;color:#fff;background:var(--sl-btn-bg,#0B4F4A);border:2px solid var(--sl-btn-bg,#0B4F4A);border-radius:999px;transition:color .35s}
  .sl-submit::before{content:"";position:absolute;inset:0;background:var(--sl-btn-hover,#F4B63F);z-index:-1;transform:translateX(-101%);transition:transform .55s cubic-bezier(.7,0,.2,1)}
  .sl-submit:hover,.sl-submit:focus-visible{color:#1B1A17;border-color:#1B1A17}
  .sl-submit:hover::before,.sl-submit:focus-visible::before{transform:none}
  .sl-submit:focus-visible{outline:3px solid #1B1A17;outline-offset:3px}
  .sl-submit:active{transform:scale(.99)}
  .sl-submit:disabled{opacity:.5;cursor:not-allowed}
  .sl-go{width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;transition:background .35s,transform .45s cubic-bezier(.3,1.5,.5,1);flex-shrink:0}
  .sl-go svg{fill:none;stroke:var(--sl-btn-bg,#0B4F4A);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;transition:stroke .35s;width:20px;height:20px}
  .sl-submit:hover .sl-go{background:#1B1A17;transform:rotate(-45deg)}
  .sl-submit:hover .sl-go svg{stroke:var(--sl-btn-hover,#F4B63F)}
  .sl-error{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;background:#FFF0F0;border:2px solid #E53E3E;border-radius:12px;font-size:15px;color:#C53030;font-weight:600}
  .sl-secure{margin-top:30px;display:flex;align-items:center;gap:10px;font-size:15px;color:#55635F;font-weight:500}
  .sl-secure svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;flex-shrink:0}
  .sl-spinner{width:20px;height:20px;border:3px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:sl-spin .7s linear infinite}
  @keyframes sl-spin{to{transform:rotate(360deg)}}
  @media(max-width:860px){
    .sl-page{grid-template-columns:1fr}
    .sl-side{min-height:46svh}
    .sl-art{width:min(60%,300px);top:46%}
    .sl-role h2{font-size:56px}
    .sl-h1{margin-top:36px}
  }
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;

// Per-role config: panel background CSS class, role label, subtitle, artwork type, btn colors
const roleConfig = {
  ASHA_WORKER: {
    sideClass: 'sl-side-asha',
    roleClass: 'sl-role-asha',
    label: 'ASHA\nWorker',
    subtitle: 'Community health coordination',
    loginLead: 'Use your ASHA Worker account to continue.',
    btnBg: '#0B4F4A',
    btnHover: '#F4B63F',
    backStroke: '#F4B63F',
    artwork: 'asha',
  },
  DOCTOR: {
    sideClass: 'sl-side-doctor',
    roleClass: 'sl-role-doctor',
    label: 'Doctor /\nMedical Officer',
    subtitle: 'Clinical care and consultation',
    loginLead: 'Use your Doctor / Medical Officer account to continue.',
    btnBg: '#F4B63F',
    btnHover: '#0B4F4A',
    backStroke: '#0B4F4A',
    artwork: 'doctor',
  },
  SUPERVISOR: {
    sideClass: 'sl-side-sup',
    roleClass: 'sl-role-sup',
    label: 'Health Extension\nSupervisor',
    subtitle: 'Healthcare operations and oversight',
    loginLead: 'Use your Supervisor account to continue.',
    btnBg: '#10243A',
    btnHover: '#F4B63F',
    backStroke: '#10243A',
    artwork: 'supervisor',
  },
} as const;

function AshaArt() {
  return (
    <svg className="sl-art" viewBox="0 0 400 400" aria-hidden="true">
      <circle className="sl-art-sun" cx="300" cy="100" r="56" fill="#FFE29A"/>
      <path d="M-30 300Q100 190 230 280T430 250V430H-30Z" fill="#EBA82A"/>
      <g>
        <rect x="50" y="228" width="84" height="62" fill="#FFF3D2"/>
        <path d="M38 231 92 186 146 231Z" fill="#1B1A17"/>
        <rect x="82" y="254" width="20" height="36" fill="#1B1A17"/>
        <rect x="112" y="244" width="14" height="14" fill="#EBA82A"/>
      </g>
      <g className="sl-art-walker">
        <circle cx="236" cy="206" r="17" fill="#6B3E22"/>
        <path d="M219 204a17 17 0 0 1 34 0c-8-9-26-9-34 0z" fill="#1B1A17"/>
        <path d="M214 230q22-12 44 0l14 110h-72z" fill="#0B4F4A"/>
        <path d="M214 230q22-12 44 0l-6 22-38 20z" fill="#FFF3D2"/>
        <path d="M254 238 270 264" stroke="#1B1A17" strokeWidth="4" strokeLinecap="round"/>
        <rect x="262" y="262" width="36" height="30" rx="5" fill="#1B1A17"/>
        <path d="M280 269v16M272 277h16" stroke="#fff" strokeWidth="4" strokeLinecap="round"/>
      </g>
      <path d="M-30 345Q140 285 430 335V430H-30Z" fill="#D18E17"/>
    </svg>
  );
}

function DoctorArt() {
  return (
    <svg className="sl-art" viewBox="0 0 400 400" aria-hidden="true">
      <circle cx="200" cy="200" r="175" fill="#116058"/>
      <path className="sl-art-pulse-path" d="M20 330H110l22-34 26 70 30-100 26 64H380" fill="none" stroke="#7FD1C4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M150 76v94a50 50 0 0 0 100 0V76" fill="none" stroke="#EAF3F0" strokeWidth="16" strokeLinecap="round"/>
      <path d="M200 220v40a70 70 0 0 0 140 0v-34" fill="none" stroke="#EAF3F0" strokeWidth="16" strokeLinecap="round"/>
      <circle cx="150" cy="66" r="13" fill="#F4B63F"/>
      <circle cx="250" cy="66" r="13" fill="#F4B63F"/>
      <g className="sl-art-pin">
        <circle cx="340" cy="212" r="30" fill="#F4B63F"/>
        <circle cx="340" cy="212" r="12" fill="#0B4F4A"/>
      </g>
    </svg>
  );
}

function SupervisorArt() {
  return (
    <svg className="sl-art" viewBox="0 0 400 400" aria-hidden="true">
      <rect x="40" y="60" width="320" height="290" rx="26" fill="#EAF2F9"/>
      <g stroke="#BFD7EA" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M50 190H350"/><path d="M140 70V340"/><path d="M265 70V340"/><path d="M50 310 350 110"/>
      </g>
      <g fill="#9FC0DB">
        <rect x="62" y="84" width="62" height="86" rx="8"/>
        <rect x="156" y="210" width="90" height="110" rx="8"/>
        <rect x="282" y="84" width="58" height="86" rx="8"/>
        <rect x="282" y="226" width="58" height="84" rx="8"/>
      </g>
      <ellipse cx="200" cy="196" rx="38" ry="13" fill="none" stroke="#10243A" strokeWidth="4"/>
      <g transform="translate(200 196)">
        <g className="sl-art-pin">
          <path d="M0 0C-22-28-26-38-26-50a26 26 0 0 1 52 0c0 12-4 22-26 50z" fill="#10243A"/>
          <circle cy="-50" r="10" fill="#F4B63F"/>
        </g>
      </g>
      <g transform="translate(96 296) scale(.62)">
        <path d="M0 0C-22-28-26-38-26-50a26 26 0 0 1 52 0c0 12-4 22-26 50z" fill="#F4B63F"/>
        <circle cy="-50" r="10" fill="#10243A"/>
      </g>
      <g transform="translate(312 206) scale(.62)">
        <path d="M0 0C-22-28-26-38-26-50a26 26 0 0 1 52 0c0 12-4 22-26 50z" fill="#0B4F4A"/>
        <circle cy="-50" r="10" fill="#EAF2F9"/>
      </g>
    </svg>
  );
}

export default function LoginPage({ selectedRole, onBack }: LoginPageProps) {
  const { setUser } = useRole();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cfg = roleConfig[selectedRole];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');
    const trimmedUsername = username.trim();
    if (!trimmedUsername) { setError('Please enter your username.'); return; }
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password, expectedRole: selectedRole }),
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setError(data.error || 'Invalid username or password.');
        setPassword('');
      }
    } catch {
      setError('Unable to connect to SynCura AI. Please try again.');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const labelLines = cfg.label.split('\n');

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: loginStyles }} />
      <div className="sl-page" style={{ '--sl-teal': '#0B4F4A', '--sl-btn-bg': cfg.btnBg, '--sl-btn-hover': cfg.btnHover, '--sl-ink': selectedRole === 'DOCTOR' ? '#F3F6F4' : '#1B1A17' } as React.CSSProperties}>

        {/* Left Panel */}
        <aside className={`sl-side ${cfg.sideClass}`}>
          <button className="sl-back" onClick={onBack} aria-label="Back to profile selection">
            <svg className="sl-back-icon" viewBox="0 0 24 24" aria-hidden="true" width="28" height="28">
              <path d="M19 12H5M11 6l-6 6 6 6" style={{ fill: 'none', stroke: cfg.backStroke, strokeWidth: '2.6', strokeLinecap: 'round', strokeLinejoin: 'round' }}/>
            </svg>
            Back to profile selection
          </button>

          {cfg.artwork === 'asha' && <AshaArt />}
          {cfg.artwork === 'doctor' && <DoctorArt />}
          {cfg.artwork === 'supervisor' && <SupervisorArt />}

          <div className={`sl-role ${cfg.roleClass}`}>
            <h2>{labelLines.map((l, i) => <React.Fragment key={i}>{l}{i < labelLines.length - 1 && <br/>}</React.Fragment>)}</h2>
            <p>{cfg.subtitle}</p>
          </div>
        </aside>

        {/* Right Form */}
        <main className="sl-main">
          <div className="sl-form-wrap">
            <div className="sl-brand">
              <svg viewBox="0 0 48 48" aria-hidden="true" width="42" height="42">
                <rect width="48" height="48" rx="13" fill="#1B1A17"/>
                <path d="M7 26h9l4-11 6 19 4-13 2 5h9" fill="none" stroke="#F4B63F" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              SynCura AI
            </div>

            <h1 className="sl-h1">Sign in</h1>
            <p className="sl-lead">{cfg.loginLead}</p>

            <form className="sl-form" onSubmit={handleLogin}>
              {error && (
                <div className="sl-error" role="alert">
                  <svg viewBox="0 0 24 24" width="18" height="18" style={{fill:'none',stroke:'#C53030',strokeWidth:'2',strokeLinecap:'round',flexShrink:0}} aria-hidden="true">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
                  </svg>
                  {error}
                </div>
              )}

              <div className="sl-field">
                <label htmlFor="sl-username">Username</label>
                <div className="sl-control">
                  <input
                    id="sl-username"
                    type="text"
                    autoComplete="username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="sl-field">
                <label htmlFor="sl-password">Password</label>
                <div className="sl-control pw">
                  <input
                    id="sl-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="sl-eye"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword(v => !v)}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" width="24" height="24" style={{fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'}} aria-hidden="true">
                        <path d="M3 3l18 18M10.6 5.1A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.4 6.4A17 17 0 0 0 2 12s3.6 7 10 7a9.6 9.6 0 0 0 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="24" height="24" style={{fill:'none',stroke:'currentColor',strokeWidth:'2',strokeLinecap:'round',strokeLinejoin:'round'}} aria-hidden="true">
                        <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button type="submit" className="sl-submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span>Signing in…</span>
                    <span className="sl-go"><span className="sl-spinner"/></span>
                  </>
                ) : (
                  <>
                    Sign in
                    <span className="sl-go">
                      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
                    </span>
                  </>
                )}
              </button>
            </form>

            <p className="sl-secure">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="4" y="11" width="16" height="10" rx="2"/>
                <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
              </svg>
              Secure, role-based sign-in
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
