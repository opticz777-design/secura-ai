import React from 'react';
import { Role } from '../../types';

interface RoleSelectionPageProps {
  onSelectRole: (role: Role) => void;
}

const landingStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,100..900&display=swap');
  .sc-landing{font-family:Archivo,"Segoe UI",system-ui,sans-serif;background:#1B1A17;overflow-x:hidden;height:100vh;height:100svh;position:relative}
  .sc-header{position:absolute;inset:0 0 auto 0;z-index:5;display:flex;justify-content:space-between;align-items:center;padding:26px clamp(20px,3vw,48px);pointer-events:none}
  .sc-brand{display:flex;align-items:center;gap:12px;font-weight:800;font-size:24px;letter-spacing:-.02em;font-stretch:90%;color:#1B1A17}
  .sc-hint{font-size:16px;font-weight:600;color:#10243A}
  @media(max-width:820px){.sc-hint{display:none}}
  .sc-panels{display:flex;height:100vh;height:100svh;min-height:640px}
  .sc-panel{position:relative;flex:1;display:flex;flex-direction:column;justify-content:flex-end;overflow:hidden;padding:clamp(24px,3vw,48px);color:var(--fg);background:var(--bg);border:none;cursor:pointer;transition:flex .8s cubic-bezier(.7,0,.2,1);animation:sc-wipe 1s cubic-bezier(.7,0,.2,1) both}
  .sc-panel:nth-child(2){animation-delay:.12s}.sc-panel:nth-child(3){animation-delay:.24s}
  @keyframes sc-wipe{from{clip-path:inset(100% 0 0 0)}to{clip-path:inset(0)}}
  .sc-panel:focus-visible{outline:4px solid #1B1A17;outline-offset:-8px}
  .sc-asha{--bg:#F4B63F;--fg:#1B1A17}
  .sc-doctor{--bg:#0B4F4A;--fg:#F3F6F4}
  .sc-sup{--bg:#BFD7EA;--fg:#10243A}
  .sc-art{position:absolute;left:50%;top:13vh;width:min(76%,40vh);height:auto;overflow:visible;transform:translateX(-50%);transition:transform .8s cubic-bezier(.7,0,.2,1);pointer-events:none}
  .sc-art *{transform-box:fill-box;transform-origin:center;transition:transform .7s cubic-bezier(.3,1.3,.5,1)}
  .sc-info{position:relative;max-width:560px;text-align:left}
  .sc-info h2{font-size:clamp(44px,5.6vw,98px);font-weight:850;font-stretch:68%;line-height:.9;letter-spacing:-.01em;color:var(--fg);margin:0}
  .sc-role{margin-top:14px;font-size:19px;font-weight:600;opacity:.85;color:var(--fg)}
  .sc-desc{max-height:0;opacity:0;overflow:hidden;font-size:18px;line-height:1.45;max-width:36ch;color:var(--fg);transition:max-height .7s cubic-bezier(.7,0,.2,1),opacity .5s,margin .7s}
  .sc-cta{display:inline-flex;align-items:center;gap:12px;margin-top:26px;padding:14px 14px 14px 24px;border-radius:999px;border:2px solid currentColor;font-size:17px;font-weight:700;color:var(--fg);background:transparent;transition:background .3s,color .3s}
  .sc-cta-icon{width:26px;height:26px;padding:5px;border-radius:50%;background:currentColor;transition:transform .4s,background .3s;flex-shrink:0}
  .sc-cta-icon path{fill:none;stroke:var(--bg);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;transition:stroke .3s}
  @media(hover:hover) and (min-width:821px){
    .sc-panels:hover .sc-panel,.sc-panels:focus-within .sc-panel{flex:1}
    .sc-panels .sc-panel:hover,.sc-panels .sc-panel:focus-visible{flex:2.3}
    .sc-panel:hover .sc-desc,.sc-panel:focus-visible .sc-desc{max-height:120px;opacity:1;margin-top:14px}
    .sc-panel:hover .sc-art,.sc-panel:focus-visible .sc-art{transform:translateX(-50%) scale(1.12)}
    .sc-panel:hover .sc-cta,.sc-panel:focus-visible .sc-cta{background:var(--fg);color:var(--bg)}
    .sc-panel:hover .sc-cta-icon,.sc-panel:focus-visible .sc-cta-icon{background:var(--bg);transform:rotate(-45deg)}
    .sc-panel:hover .sc-cta-icon path,.sc-panel:focus-visible .sc-cta-icon path{stroke:var(--fg)}
    .sc-asha:hover .sc-sun{transform:translateY(-26px) scale(1.08)}
    .sc-asha:hover .sc-walker{transform:translateX(-34px);animation:sc-bob .6s ease-in-out infinite}
    .sc-asha:hover .sc-home{transform:scale(1.06)}
    .sc-doctor:hover .sc-pulse{animation:sc-trace 1.8s linear infinite}
    .sc-doctor:hover .sc-chest{transform:rotate(14deg) translate(-4px,6px)}
    .sc-doctor:hover .sc-halo{transform:scale(1.08)}
    .sc-sup:hover .sc-pin{transform:translateY(-16px)}
    .sc-sup:hover .sc-p2{transition-delay:.08s}.sc-sup:hover .sc-p3{transition-delay:.16s}
    .sc-sup:hover .sc-ring{animation:sc-radar 1.6s ease-out infinite}
  }
  @keyframes sc-bob{0%,100%{translate:0 0}50%{translate:0 -6px}}
  @keyframes sc-trace{from{stroke-dashoffset:520}to{stroke-dashoffset:0}}
  @keyframes sc-radar{from{transform:scale(.6);opacity:1}to{transform:scale(2.2);opacity:0}}
  .sc-pulse{stroke-dasharray:520}
  @media(max-width:820px),(hover:none){
    .sc-panels{flex-direction:column;height:auto}
    .sc-panel{min-height:78svh;flex:none}
    .sc-asha{padding-top:96px}
    .sc-art{top:90px;width:min(60%,260px)}
    .sc-desc{max-height:none;opacity:1;margin-top:12px}
  }
  @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
`;

export default function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: landingStyles }} />
      <div className="sc-landing">
        <header className="sc-header">
          <div className="sc-brand">
            <svg viewBox="0 0 48 48" aria-hidden="true" width="42" height="42">
              <rect width="48" height="48" rx="13" fill="#1B1A17"/>
              <path d="M7 26h9l4-11 6 19 4-13 2 5h9" fill="none" stroke="#F4B63F" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            SynCura AI
          </div>
          <p className="sc-hint">Choose your role to sign in</p>
        </header>

        <main className="sc-panels">
          <button className="sc-panel sc-asha" onClick={() => onSelectRole('ASHA_WORKER')} aria-label="Continue as ASHA Worker">
            <svg className="sc-art" viewBox="0 0 400 400" aria-hidden="true">
              <circle className="sc-sun" cx="300" cy="100" r="56" fill="#FFE29A"/>
              <path d="M-30 300Q100 190 230 280T430 250V430H-30Z" fill="#EBA82A"/>
              <g className="sc-home">
                <rect x="50" y="228" width="84" height="62" fill="#FFF3D2"/>
                <path d="M38 231 92 186 146 231Z" fill="#1B1A17"/>
                <rect x="82" y="254" width="20" height="36" fill="#1B1A17"/>
                <rect x="112" y="244" width="14" height="14" fill="#EBA82A"/>
              </g>
              <g className="sc-walker">
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
            <div className="sc-info">
              <h2>ASHA<br/>Worker</h2>
              <p className="sc-role">Community health coordination</p>
              <p className="sc-desc">Log home visits, flag high-risk patients and refer them to a doctor.</p>
              <span className="sc-cta">Continue as ASHA Worker
                <svg className="sc-cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </span>
            </div>
          </button>

          <button className="sc-panel sc-doctor" onClick={() => onSelectRole('DOCTOR')} aria-label="Continue as Doctor">
            <svg className="sc-art" viewBox="0 0 400 400" aria-hidden="true">
              <circle className="sc-halo" cx="200" cy="200" r="175" fill="#116058"/>
              <path className="sc-pulse" d="M20 330H110l22-34 26 70 30-100 26 64H380" fill="none" stroke="#7FD1C4" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M150 76v94a50 50 0 0 0 100 0V76" fill="none" stroke="#EAF3F0" strokeWidth="16" strokeLinecap="round"/>
              <path d="M200 220v40a70 70 0 0 0 140 0v-34" fill="none" stroke="#EAF3F0" strokeWidth="16" strokeLinecap="round"/>
              <circle cx="150" cy="66" r="13" fill="#F4B63F"/>
              <circle cx="250" cy="66" r="13" fill="#F4B63F"/>
              <g className="sc-chest">
                <circle cx="340" cy="212" r="30" fill="#F4B63F"/>
                <circle cx="340" cy="212" r="12" fill="#0B4F4A"/>
              </g>
            </svg>
            <div className="sc-info">
              <h2>Doctor /<br/>Medical Officer</h2>
              <p className="sc-role">Clinical care and consultation</p>
              <p className="sc-desc">Review referred cases, consult patients and record treatment plans.</p>
              <span className="sc-cta">Continue as Doctor
                <svg className="sc-cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </span>
            </div>
          </button>

          <button className="sc-panel sc-sup" onClick={() => onSelectRole('SUPERVISOR')} aria-label="Continue as Supervisor">
            <svg className="sc-art" viewBox="0 0 400 400" aria-hidden="true">
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
              <ellipse className="sc-ring" cx="200" cy="196" rx="38" ry="13" fill="none" stroke="#10243A" strokeWidth="4"/>
              <g transform="translate(200 196)">
                <g className="sc-pin sc-p1">
                  <path d="M0 0C-22-28-26-38-26-50a26 26 0 0 1 52 0c0 12-4 22-26 50z" fill="#10243A"/>
                  <circle cy="-50" r="10" fill="#F4B63F"/>
                </g>
              </g>
              <g transform="translate(96 296) scale(.62)">
                <g className="sc-pin sc-p2">
                  <path d="M0 0C-22-28-26-38-26-50a26 26 0 0 1 52 0c0 12-4 22-26 50z" fill="#F4B63F"/>
                  <circle cy="-50" r="10" fill="#10243A"/>
                </g>
              </g>
              <g transform="translate(312 206) scale(.62)">
                <g className="sc-pin sc-p3">
                  <path d="M0 0C-22-28-26-38-26-50a26 26 0 0 1 52 0c0 12-4 22-26 50z" fill="#0B4F4A"/>
                  <circle cy="-50" r="10" fill="#EAF2F9"/>
                </g>
              </g>
            </svg>
            <div className="sc-info">
              <h2>Health Extension<br/>Supervisor</h2>
              <p className="sc-role">Healthcare operations and oversight</p>
              <p className="sc-desc">Track field activity, spot coverage gaps and support your teams.</p>
              <span className="sc-cta">Continue as Supervisor
                <svg className="sc-cta-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </span>
            </div>
          </button>
        </main>
      </div>
    </>
  );
}
