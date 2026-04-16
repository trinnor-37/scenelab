"use client";

import { useState, useRef } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #080808; --surface: #111; --surface2: #181818;
    --border: #242424; --border2: #2e2e2e;
    --text: #f2f0eb; --muted: #555; --muted2: #888;
    --gold: #d4a84b; --gold-dim: rgba(212,168,75,0.12); --gold-glow: rgba(212,168,75,0.07);
    --green: #3ecf6e; --green-dim: rgba(62,207,110,0.1);
    --radius: 14px; --radius-sm: 9px;
  }
  .app { min-height:100vh; background:var(--bg); font-family:'DM Sans',sans-serif; color:var(--text); max-width:500px; margin:0 auto; }

  .header { padding:18px 20px 14px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border); position:sticky; top:0; background:rgba(8,8,8,0.95); backdrop-filter:blur(12px); z-index:20; }
  .logo { font-family:'Bebas Neue',sans-serif; font-size:22px; letter-spacing:2px; color:var(--text); }
  .logo span { color:var(--gold); }
  .stage-pill { display:flex; align-items:center; gap:6px; background:var(--gold-dim); border:1px solid rgba(212,168,75,0.2); border-radius:100px; padding:5px 12px; font-size:11px; font-weight:600; color:var(--gold); }
  .dot { width:6px; height:6px; background:var(--gold); border-radius:50%; animation:pulse 2s ease infinite; }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(.7);} }

  .progress-wrap { padding:14px 20px 0; display:flex; gap:5px; }
  .prog-bar { flex:1; height:3px; background:var(--border2); border-radius:100px; transition:background .3s; cursor:pointer; }
  .prog-bar.done { background:var(--gold); }
  .prog-bar.active { background:rgba(212,168,75,0.45); }
  .prog-labels { display:flex; padding:5px 20px 0; gap:5px; }
  .prog-lbl { flex:1; font-size:9px; font-weight:600; letter-spacing:.8px; text-transform:uppercase; color:var(--muted); text-align:center; transition:color .3s; cursor:pointer; }
  .prog-lbl.active { color:var(--gold); }
  .prog-lbl.done { color:var(--muted2); }

  .scene-bar { display:flex; gap:8px; padding:14px 20px 0; overflow-x:auto; scrollbar-width:none; }
  .scene-bar::-webkit-scrollbar { display:none; }
  .scene-tab { display:flex; align-items:center; gap:6px; padding:7px 14px; background:var(--surface); border:1px solid var(--border2); border-radius:100px; font-size:11px; font-weight:600; color:var(--muted2); cursor:pointer; white-space:nowrap; transition:all .15s; flex-shrink:0; }
  .scene-tab.active { background:var(--gold-dim); border-color:rgba(212,168,75,0.35); color:var(--gold); }
  .scene-tab .scene-dot { width:5px; height:5px; background:var(--gold); border-radius:50%; }
  .add-scene-btn { display:flex; align-items:center; gap:5px; padding:7px 14px; background:transparent; border:1px dashed var(--border2); border-radius:100px; font-size:11px; font-weight:600; color:var(--muted); cursor:pointer; white-space:nowrap; transition:all .15s; flex-shrink:0; }
  .add-scene-btn:hover { border-color:var(--gold); color:var(--gold); }

  .locked-banner { background:var(--green-dim); border:1px solid rgba(62,207,110,0.2); border-radius:var(--radius-sm); padding:10px 14px; display:flex; align-items:center; gap:10px; margin-bottom:18px; }
  .locked-banner-icon { font-size:14px; }
  .locked-banner-text { font-size:11px; color:var(--green); font-weight:600; line-height:1.4; }
  .locked-banner-text span { color:rgba(62,207,110,0.6); font-weight:400; }

  .content { padding:22px 20px 100px; }
  .stage-num { font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; color:var(--gold); margin-bottom:5px; }
  .stage-title { font-family:'Bebas Neue',sans-serif; font-size:30px; letter-spacing:1.5px; line-height:1; margin-bottom:6px; }
  .stage-desc { font-size:13px; color:var(--muted2); line-height:1.5; font-style:italic; margin-bottom:24px; }

  .field { margin-bottom:18px; }
  .field-lbl { font-size:10px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted2); margin-bottom:8px; display:flex; align-items:center; gap:8px; }
  .field-lbl::after { content:''; flex:1; height:1px; background:var(--border); }

  /* SELECT */
  .sel-wrap { position:relative; }
  .sel-btn { width:100%; background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius-sm); padding:13px 16px; display:flex; align-items:center; justify-content:space-between; cursor:pointer; transition:all .15s; text-align:left; }
  .sel-btn:hover,.sel-btn.open { border-color:rgba(212,168,75,.4); background:var(--surface2); }
  .sel-val { font-size:14px; font-weight:500; color:var(--text); }
  .sel-ph { color:var(--muted); font-weight:400; }
  .sel-arr { color:var(--muted); font-size:10px; transition:transform .2s; flex-shrink:0; margin-left:8px; }
  .sel-arr.open { transform:rotate(180deg); }
  .dropdown { position:absolute; top:calc(100% + 6px); left:0; right:0; background:#1b1b1b; border:1px solid var(--border2); border-radius:var(--radius-sm); overflow:hidden; z-index:50; box-shadow:0 10px 40px rgba(0,0,0,.6); animation:dropIn .12s ease; max-height:260px; overflow-y:auto; }
  @keyframes dropIn { from{opacity:0;transform:translateY(-5px);} to{opacity:1;transform:translateY(0);} }
  .dd-item { padding:12px 16px; font-size:13px; cursor:pointer; transition:background .1s; color:var(--text); border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .dd-item:last-child { border-bottom:none; }
  .dd-item:hover { background:var(--gold-glow); color:var(--gold); }
  .dd-item.sel { background:var(--gold-dim); color:var(--gold); font-weight:600; }
  .dd-divider { height:1px; background:var(--border2); }
  .dd-custom-item { padding:12px 16px; font-size:13px; cursor:pointer; color:var(--gold); font-weight:600; display:flex; align-items:center; gap:8px; transition:background .1s; }
  .dd-custom-item:hover { background:var(--gold-glow); }

  /* CUSTOM INPUT that appears below the select */
  .custom-input-wrap { margin-top:8px; position:relative; }
  .custom-input { width:100%; background:var(--surface2); border:1px solid rgba(212,168,75,.35); border-radius:var(--radius-sm); padding:12px 16px; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--text); outline:none; transition:border-color .15s; }
  .custom-input:focus { border-color:rgba(212,168,75,.7); }
  .custom-input::placeholder { color:var(--muted); }
  .custom-clear { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--muted); font-size:14px; cursor:pointer; padding:2px 6px; }
  .custom-clear:hover { color:var(--text); }

  .txt-input { width:100%; background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius-sm); padding:13px 16px; font-family:'DM Sans',sans-serif; font-size:14px; color:var(--text); outline:none; transition:border-color .15s; }
  .txt-input:focus { border-color:rgba(212,168,75,.4); }
  .txt-input::placeholder { color:var(--muted); }
  .hint { font-size:11px; color:var(--muted); margin-top:7px; line-height:1.6; }

  .locked-field { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-sm); padding:13px 16px; display:flex; align-items:center; justify-content:space-between; }
  .locked-field-val { font-size:14px; font-weight:500; color:var(--muted2); }

  /* REF MODE PICKER */
  .ref-mode-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-bottom:22px; }
  .ref-mode-card { padding:16px 10px; background:var(--surface); border:1.5px solid var(--border2); border-radius:var(--radius); cursor:pointer; transition:all .15s; text-align:center; }
  .ref-mode-card:hover { border-color:rgba(212,168,75,.3); }
  .ref-mode-card.active { background:var(--gold-dim); border-color:rgba(212,168,75,.5); }
  .ref-mode-icon { font-size:22px; margin-bottom:8px; }
  .ref-mode-label { font-size:11px; font-weight:700; color:var(--text); line-height:1.3; }
  .ref-mode-card.active .ref-mode-label { color:var(--gold); }
  .ref-mode-sub { font-size:10px; color:var(--muted); margin-top:3px; line-height:1.3; }

  /* MOODBOARD */
  .moodboard-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .moodboard-count { font-size:11px; font-weight:700; color:var(--gold); background:var(--gold-dim); border:1px solid rgba(212,168,75,.2); border-radius:100px; padding:3px 10px; }
  .moodboard-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .mb-slot { aspect-ratio:1; background:var(--surface); border:1.5px dashed var(--border2); border-radius:var(--radius-sm); cursor:pointer; transition:all .15s; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:5px; }
  .mb-slot:hover { border-color:rgba(212,168,75,.4); background:var(--surface2); }
  .mb-slot.filled { border-style:solid; border-color:rgba(212,168,75,.3); }
  .mb-slot img { width:100%; height:100%; object-fit:cover; display:block; }
  .mb-slot-icon { font-size:20px; color:var(--muted); }
  .mb-slot-num { font-size:9px; font-weight:700; color:var(--muted); letter-spacing:.8px; text-transform:uppercase; }
  .mb-remove { position:absolute; top:5px; right:5px; background:rgba(0,0,0,.8); border:none; border-radius:50%; width:20px; height:20px; color:#fff; font-size:10px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:2; transition:background .15s; }
  .mb-remove:hover { background:rgba(200,0,0,.8); }
  .mb-add { aspect-ratio:1; background:transparent; border:1.5px dashed var(--border2); border-radius:var(--radius-sm); cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:5px; }
  .mb-add:hover { border-color:rgba(212,168,75,.4); }
  .mb-add span { font-size:20px; color:var(--muted); }
  .mb-add p { font-size:9px; color:var(--muted); font-weight:700; letter-spacing:.5px; }

  /* START/END UPLOAD */
  .upload-row.two { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:4px; }
  .upload-zone { background:var(--surface); border:1.5px dashed var(--border2); border-radius:var(--radius); padding:20px 10px; text-align:center; cursor:pointer; transition:all .2s; position:relative; overflow:hidden; }
  .upload-zone:hover { border-color:rgba(212,168,75,.4); background:var(--surface2); }
  .upload-zone.has-img { border-style:solid; border-color:rgba(212,168,75,.3); padding:0; }
  .upload-zone img { width:100%; height:130px; object-fit:cover; display:block; border-radius:calc(var(--radius) - 2px); }
  .upload-zone-icon { font-size:22px; margin-bottom:6px; }
  .upload-zone-label { font-size:12px; font-weight:600; color:var(--muted2); }
  .upload-zone-sub { font-size:10px; color:var(--muted); margin-top:3px; }
  .upload-remove { position:absolute; top:6px; right:6px; background:rgba(0,0,0,.8); border:none; border-radius:50%; width:22px; height:22px; color:#fff; font-size:11px; cursor:pointer; display:flex; align-items:center; justify-content:center; }

  .nav-row { display:flex; gap:10px; margin-top:28px; }
  .btn-back { flex:1; padding:14px; background:transparent; border:1px solid var(--border2); border-radius:var(--radius); color:var(--muted2); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; cursor:pointer; transition:all .15s; }
  .btn-back:hover { color:var(--text); border-color:var(--muted2); }
  .btn-next { flex:2; padding:14px; background:var(--gold); border:none; border-radius:var(--radius); color:#080808; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; }
  .btn-next:hover { background:#ddb55a; transform:translateY(-1px); box-shadow:0 6px 20px rgba(212,168,75,.22); }
  .btn-next:disabled { opacity:.3; cursor:not-allowed; transform:none; box-shadow:none; }

  .preview-card { background:var(--surface); border:1px solid var(--border2); border-radius:var(--radius); overflow:hidden; margin-bottom:14px; }
  .preview-hd { padding:12px 16px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
  .preview-title { font-size:10px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:var(--gold); }
  .copy-btn { background:var(--gold-dim); border:1px solid rgba(212,168,75,.25); border-radius:6px; padding:5px 12px; color:var(--gold); font-size:11px; font-weight:600; cursor:pointer; transition:all .15s; }
  .copy-btn:hover { background:rgba(212,168,75,.2); }
  .preview-body { padding:16px; font-size:12px; line-height:1.9; color:var(--muted2); white-space:pre-wrap; max-height:240px; overflow-y:auto; }

  .scene-preview-tabs { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
  .sp-tab { padding:6px 12px; background:var(--surface2); border:1px solid var(--border2); border-radius:100px; font-size:11px; font-weight:600; color:var(--muted2); cursor:pointer; transition:all .15s; }
  .sp-tab.active { background:var(--gold-dim); border-color:rgba(212,168,75,.3); color:var(--gold); }

  .done-icon { width:58px; height:58px; background:var(--gold-dim); border:1px solid rgba(212,168,75,.25); border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:22px; }
  .done-title { font-family:'Bebas Neue',sans-serif; font-size:26px; letter-spacing:1.5px; text-align:center; margin-bottom:8px; }
  .done-sub { font-size:13px; color:var(--muted2); text-align:center; line-height:1.6; margin-bottom:22px; font-style:italic; }
  .btn-full { width:100%; padding:14px; background:var(--gold); border:none; border-radius:var(--radius); color:#080808; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:700; cursor:pointer; transition:all .2s; margin-bottom:8px; }
  .btn-full:hover { background:#ddb55a; }
  .btn-outline { width:100%; padding:13px; background:transparent; border:1px solid var(--border2); border-radius:var(--radius); color:var(--muted2); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; cursor:pointer; margin-bottom:8px; transition:all .15s; }
  .btn-outline:hover { color:var(--text); border-color:var(--muted2); }

  @keyframes fadeUp { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
  .fade-in { animation:fadeUp .3s ease; }
  ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:transparent;} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px;}
`;

const MAX_REF = 8;
const CUSTOM_KEY = "__custom__";

const COMMERCIAL_STYLES = ["Luxury / High-end","Bold & Energetic","Soft & Emotional","Minimalist / Clean","Cinematic / Epic","Urban / Street","Futuristic / Tech","Natural / Organic"];
const OPT = {
  aesthetic:   ["Cinematic","Industrial","Minimalist","Vintage","Luxury","Neon Noir","Editorial","Raw Documentary"],
  optics:      ["Wide-angle lens","Macro close-up","Anamorphic widescreen","Telephoto compressed","Fisheye distortion","Standard 50mm"],
  atmosphere:  ["High grain","Crystal clear 4K","Light leaks","Heavy fog","Lens flare","Deep shadows","Hazy glow","Rain-soaked"],
  envA:        ["Sleek white studio","Gritty urban street","Lush forest clearing","Rooftop at golden hour","Industrial warehouse","Luxury penthouse","Desert landscape","Neon-lit city alley"],
  envB:        ["Infinite black void","Bright showroom floor","Soft cloud backdrop","Outdoor sunrise field","Glass boardroom","Marble product stage","Futuristic white space","Velvet dark lounge"],
  lightTrans:  ["Natural sun → Studio strobe","Dark neon → Soft glow","Overcast → Dramatic backlit","Warm tungsten → Cold LED","Sunrise → Midday sun","Sunset → Studio flash"],
  detail1:     ["Brand logo","Product surface texture","Packaging edge","Key feature","Material grain","Label / typography"],
  motion:      ["Upward floating","Forward surging","Slow rotation","Diagonal drift","Spiraling rise","Gravity-defying levitation"],
  detail2:     ["Material texture","Craftsmanship seam","Signature finish","Hidden detail","Core mechanism","Signature color"],
  particles:   ["Floating water drops","Glowing embers","Geometric shapes","Bokeh light orbs","Gold dust motes","Petal fragments","Smoke wisps"],
  lightFx:     ["Golden glint","Lens flare","Rim light flash","Specular highlight","Prism split","Strobe pulse"],
  bg:          ["Pure black","Pure white","Brand primary color","Deep navy","Warm ivory","Matte charcoal"],
  commercialStyle: COMMERCIAL_STYLES,
};

const CUSTOM_PLACEHOLDERS = {
  aesthetic:      "e.g. Dreamy pastel surrealism",
  optics:         "e.g. Tilt-shift miniature effect",
  atmosphere:     "e.g. Underwater distortion",
  envA:           "e.g. Moonlit rooftop garden",
  envB:           "e.g. Floating island in the clouds",
  lightTrans:     "e.g. Candlelight fading to neon glow",
  detail1:        "e.g. Stitched leather strap",
  motion:         "e.g. Slow backwards pull with a twist",
  detail2:        "e.g. Polished sapphire crystal face",
  particles:      "e.g. Cherry blossom petals",
  lightFx:        "e.g. Aurora shimmer",
  bg:             "e.g. Deep forest green",
  commercialStyle:"e.g. Dark and mysterious thriller",
};

const STAGES = [
  { id:"product",   short:"Product", label:"Product Brief" },
  { id:"reference", short:"Frames",  label:"Frame Setup" },
  { id:"visual",    short:"Visual",  label:"Visual DNA" },
  { id:"light",     short:"Light",   label:"Landscape" },
  { id:"choreo",    short:"Motion",  label:"Motion" },
  { id:"brand",     short:"Brand",   label:"Branding" },
  { id:"preview",   short:"Done",    label:"Done" },
];

const EMPTY_SCENE = { envA:"", envB:"", lightTrans:"", detail1:"", motion:"", detail2:"", particles:"", lightFx:"", refMode:"none", refImgs:[], startImg:null, endImg:null };
const EMPTY_SHARED = { product:"", commercialStyle:"", aesthetic:"", optics:"", atmosphere:"", bg:"", tagline:"" };

// ── SELECT WITH CUSTOM ────────────────────────────────────────────────
function Sel({ label, value, onChange, optKey, placeholder="Choose an option...", locked=false }) {
  const [open, setOpen] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const inputRef = useRef();

  const isCustom = value && !OPT[optKey]?.includes(value);
  const displayVal = isCustom ? value : value;

  if (locked) return (
    <div className="field">
      <div className="field-lbl">{label}</div>
      <div className="locked-field">
        <span className="locked-field-val">{value}</span>
        <span style={{fontSize:12,color:"var(--muted)"}}>🔒</span>
      </div>
    </div>
  );

  const handleCustomConfirm = () => {
    if (customVal.trim()) {
      onChange(customVal.trim());
      setShowCustomInput(false);
    }
  };

  const handleSelectCustom = () => {
    setOpen(false);
    setCustomVal(isCustom ? value : "");
    setShowCustomInput(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleClearCustom = () => {
    setShowCustomInput(false);
    setCustomVal("");
    onChange("");
  };

  return (
    <div className="field">
      <div className="field-lbl">{label}</div>
      <div className="sel-wrap">
        <button
          className={`sel-btn${open?" open":""}`}
          onClick={() => { setOpen(o=>!o); setShowCustomInput(false); }}
        >
          <span className={`sel-val${!value?" sel-ph":""}`}>
            {isCustom ? <span>✏️ {value}</span> : (value || placeholder)}
          </span>
          <span className={`sel-arr${open?" open":""}`}>▼</span>
        </button>

        {open && (
          <div className="dropdown">
            {OPT[optKey]?.map(opt=>(
              <div key={opt} className={`dd-item${value===opt?" sel":""}`} onClick={()=>{onChange(opt);setOpen(false);setShowCustomInput(false);}}>
                {opt}{value===opt&&<span>✓</span>}
              </div>
            ))}
            <div className="dd-divider"/>
            <div className="dd-custom-item" onClick={handleSelectCustom}>
              ✏️ Write my own...
            </div>
          </div>
        )}
      </div>

      {(showCustomInput || (isCustom && !open)) && (
        <div className="custom-input-wrap fade-in">
          <input
            ref={inputRef}
            className="custom-input"
            placeholder={CUSTOM_PLACEHOLDERS[optKey] || "Type your own value..."}
            value={showCustomInput ? customVal : value}
            onChange={e => {
              if (showCustomInput) {
                setCustomVal(e.target.value);
              } else {
                onChange(e.target.value);
              }
            }}
            onKeyDown={e => {
              if (e.key === "Enter") handleCustomConfirm();
              if (e.key === "Escape") handleClearCustom();
            }}
            onBlur={() => { if (showCustomInput && customVal.trim()) handleCustomConfirm(); }}
          />
          {showCustomInput ? (
            <button className="custom-clear" onClick={handleClearCustom}>✕</button>
          ) : (
            <button className="custom-clear" onClick={handleClearCustom} title="Remove custom value">✕</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── MOODBOARD ─────────────────────────────────────────────────────────
function MoodboardUpload({ images, onChange }) {
  const fileRef = useRef();
  const handleFiles = e => {
    const files = Array.from(e.target.files);
    const remaining = MAX_REF - images.length;
    const toRead = files.slice(0, remaining);
    let results = [], count = 0;
    toRead.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => {
        results.push(ev.target.result);
        if (++count === toRead.length) onChange([...images, ...results]);
      };
      reader.readAsDataURL(f);
    });
    e.target.value = "";
  };
  const remove = idx => onChange(images.filter((_,i)=>i!==idx));
  const canAdd = images.length < MAX_REF;
  const emptyCount = Math.max(0, (images.length < 6 ? 6 : MAX_REF) - images.length - (canAdd?1:0));

  return (
    <div>
      <div className="moodboard-header">
        <div className="field-lbl" style={{marginBottom:0}}>Mood Board</div>
        <div className="moodboard-count">{images.length} / {MAX_REF}</div>
      </div>
      <div style={{height:10}}/>
      <div className="moodboard-grid">
        {images.map((img,i)=>(
          <div key={i} className="mb-slot filled">
            <img src={img} alt={`ref-${i+1}`}/>
            <button className="mb-remove" onClick={e=>{e.stopPropagation();remove(i);}}>✕</button>
          </div>
        ))}
        {canAdd&&<div className="mb-add" onClick={()=>fileRef.current.click()}><span>+</span><p>Add Image</p></div>}
        {Array.from({length:emptyCount}).map((_,i)=>(
          <div key={`e${i}`} className="mb-slot" style={{cursor:"default",opacity:.25}}>
            <div className="mb-slot-icon">🖼️</div>
            <div className="mb-slot-num">Empty</div>
          </div>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple style={{display:"none"}} onChange={handleFiles}/>
      <div className="hint" style={{marginTop:10}}>
        Upload up to {MAX_REF} images. Color grading, lighting, and visual style will be pulled from all of them.
        {canAdd&&<span style={{color:"var(--gold)"}}> Tap + to add more.</span>}
      </div>
    </div>
  );
}

// ── SINGLE UPLOAD ──────────────────────────────────────────────────────
function UploadZone({ label, sub, value, onChange }) {
  const ref = useRef();
  const handleFile = e => {
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = ev => onChange(ev.target.result);
    reader.readAsDataURL(f); e.target.value="";
  };
  return (
    <div className={`upload-zone${value?" has-img":""}`} onClick={()=>ref.current.click()}>
      {value ? (
        <><img src={value} alt={label}/><button className="upload-remove" onClick={e=>{e.stopPropagation();onChange(null);}}>✕</button></>
      ) : (
        <><div className="upload-zone-icon">📎</div><div className="upload-zone-label">{label}</div>{sub&&<div className="upload-zone-sub">{sub}</div>}</>
      )}
      <input ref={ref} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
    </div>
  );
}

// ── PROMPT ────────────────────────────────────────────────────────────
function buildScenePrompt(shared, scene, sceneNum, totalScenes) {
  const isCont = sceneNum > 1;
  const refLine = scene.refMode==="reference"
    ? `\nREFERENCE MOOD BOARD: ${scene.refImgs.length} image(s) attached — extract color grading, lighting, and visual tone equally from all references.`
    : scene.refMode==="startend"
    ? `\nSTART FRAME: Attached — begin this scene exactly from this frame.\nEND FRAME: Attached — conclude this scene at this frame.`
    : `\nREFERENCE: None — generate freely within the established visual language.`;
  const contNote = isCont
    ? `\nSCENE CONTINUITY: Scene ${sceneNum} of ${totalScenes}. Maintain identical visual DNA, color grading, optics, and atmosphere from Scene 1. Seamless continuation — do NOT reinvent the aesthetic.\n`
    : "";
  return `═══════════════════════════════
SCENE ${sceneNum} OF ${totalScenes}${isCont?" — CONTINUATION":""}
═══════════════════════════════
PRODUCT: ${shared.product||"—"}
COMMERCIAL STYLE: ${shared.commercialStyle||"—"}
${contNote}
[1. VISUAL DNA]${isCont?" (LOCKED — inherited from Scene 1)":""}
Aesthetic: ${shared.aesthetic||"—"}
Optics: ${shared.optics||"—"}
Atmosphere: ${shared.atmosphere||"—"}
${refLine}

[2. LIGHT & LANDSCAPE]
Environment A: ${scene.envA||"—"}
Environment B: ${scene.envB||"—"}
Lighting Transition: ${scene.lightTrans||"—"}

[3. THE 4-STAGE CHOREOGRAPHY]

STAGE 1 — THE FULL-VIEW WRAP (0–2s)
Start Point: Close-up on ${scene.detail1||"—"} of the ${shared.product||"subject"}
Movement: A rapid 360° radial orbit around the ${shared.product||"subject"}.
Goal: Establish full geometry — front, sides, and back in one motion.

STAGE 2 — THE ENVIRONMENT MORPH (2–4s)
Action: ${shared.product||"Subject"} moves ${scene.motion||"—"}.
Transition: ${scene.envA||"Environment A"} dissolves into ${scene.envB||"Environment B"}.
Goal: Seamless "portal" effect using the product's movement as anchor.

STAGE 3 — THE MACRO-DETAIL SPIRAL (4–6s)
Focus: ${scene.detail2||"—"} of the ${shared.product||"subject"}
Movement: Slow, tight helical spiral around the product.
Atmosphere: ${scene.particles||"—"} drift through the shot.

STAGE 4 — THE STRATEGIC HERO HOLD (6–7s)
Camera: Pulls back and stabilizes.
Angle: Three-quarter perspective (front + side/back simultaneously).
Highlight: ${scene.lightFx||"—"} passes over the brand logo.

[4. BRANDING]${isCont?" (LOCKED — inherited from Scene 1)":""}
Background: ${shared.bg||"—"}
Tagline: "${shared.tagline||"Your Slogan Here"}"`;
}

// ── MAIN APP ──────────────────────────────────────────────────────────
export default function App() {
  const [stage, setStage] = useState(0);
  const [activeScene, setActiveScene] = useState(0);
  const [previewScene, setPreviewScene] = useState(0);
  const [copied, setCopied] = useState(null);
  const [shared, setShared] = useState({...EMPTY_SHARED});
  const [scenes, setScenes] = useState([{...EMPTY_SCENE}]);

  const setS = k => v => setShared(p=>({...p,[k]:v}));
  const setScene = (idx,k,v) => setScenes(prev=>prev.map((s,i)=>i===idx?{...s,[k]:v}:s));
  const sc = scenes[activeScene];
  const isNewScene = activeScene > 0;

  const refValid = sc.refMode==="none"
    || (sc.refMode==="reference" && sc.refImgs.length>=1)
    || (sc.refMode==="startend" && !!sc.startImg && !!sc.endImg);

  const valid = [
    shared.product.trim().length>=2 && !!shared.commercialStyle,
    refValid,
    !isNewScene ? !!(shared.aesthetic && shared.optics && shared.atmosphere) : true,
    !!(sc.envA && sc.envB && sc.lightTrans),
    !!(sc.detail1 && sc.motion && sc.detail2 && sc.particles && sc.lightFx),
    !!shared.bg,
    true,
  ];

  const addScene = () => {
    const newIdx = scenes.length;
    setScenes(prev=>[...prev,{...EMPTY_SCENE}]);
    setActiveScene(newIdx);
    setStage(1);
  };

  const allPrompts = scenes.map((s,i)=>buildScenePrompt(shared,s,i+1,scenes.length)).join("\n\n");

  const copy = which => {
    const text = which==="all" ? allPrompts : buildScenePrompt(shared,scenes[which],which+1,scenes.length);
    navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(()=>setCopied(null),2000);
  };

  const reset = () => { setStage(0);setActiveScene(0);setPreviewScene(0);setShared({...EMPTY_SHARED});setScenes([{...EMPTY_SCENE}]); };

  const visibleStages = isNewScene ? STAGES.filter(s=>!["product","visual","brand"].includes(s.id)) : STAGES;

  const renderContent = () => {
    const s = visibleStages[stage];
    if (!s) return null;

    switch(s.id) {
      case "product": return (
        <div className="fade-in">
          <div className="stage-num">Step 01 / 06</div>
          <div className="stage-title">PRODUCT BRIEF</div>
          <div className="stage-desc">Tell us exactly what you're advertising. This shapes every scene.</div>
          <div className="field">
            <div className="field-lbl">Product Name & Description</div>
            <input className="txt-input" placeholder="e.g. A luxurious Swiss automatic watch" value={shared.product} onChange={e=>setS("product")(e.target.value)}/>
            <div className="hint">Try: "A premium skincare serum" · "A limited-edition sneaker" · "A high-end perfume bottle"</div>
          </div>
          <Sel label="Commercial Style / Tone" value={shared.commercialStyle} onChange={setS("commercialStyle")} optKey="commercialStyle" placeholder="How should this feel?"/>
        </div>
      );

      case "reference": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 1`:"Step 02 / 06"}</div>
          <div className="stage-title">FRAME SETUP</div>
          <div className="stage-desc">{isNewScene?`Choose how Scene ${activeScene+1} connects visually to your previous footage.`:"Choose how you want to guide this scene visually."}</div>
          <div className="field-lbl" style={{marginBottom:10}}>Input Mode</div>
          <div className="ref-mode-grid">
            <div className={`ref-mode-card${sc.refMode==="none"?" active":""}`} onClick={()=>setScene(activeScene,"refMode","none")}>
              <div className="ref-mode-icon">✦</div>
              <div className="ref-mode-label">No Reference</div>
              <div className="ref-mode-sub">Pure prompt only</div>
            </div>
            <div className={`ref-mode-card${sc.refMode==="reference"?" active":""}`} onClick={()=>setScene(activeScene,"refMode","reference")}>
              <div className="ref-mode-icon">🖼️</div>
              <div className="ref-mode-label">Mood Board</div>
              <div className="ref-mode-sub">Up to 8 references</div>
            </div>
            <div className={`ref-mode-card${sc.refMode==="startend"?" active":""}`} onClick={()=>setScene(activeScene,"refMode","startend")}>
              <div className="ref-mode-icon">🎬</div>
              <div className="ref-mode-label">Start & End Frames</div>
              <div className="ref-mode-sub">Define exact boundaries</div>
            </div>
          </div>
          {sc.refMode==="reference"&&(
            <div className="fade-in">
              <MoodboardUpload images={sc.refImgs} onChange={v=>setScene(activeScene,"refImgs",v)}/>
            </div>
          )}
          {sc.refMode==="startend"&&(
            <div className="fade-in">
              <div className="field-lbl">Start & End Frames</div>
              <div className="upload-row two">
                <UploadZone label="Start Frame" sub="Where scene begins" value={sc.startImg} onChange={v=>setScene(activeScene,"startImg",v)}/>
                <UploadZone label="End Frame" sub="Where scene ends" value={sc.endImg} onChange={v=>setScene(activeScene,"endImg",v)}/>
              </div>
              {isNewScene&&<div className="hint" style={{marginTop:8}}>💡 Use the last frame of your previous scene as the Start Frame for a seamless continuation.</div>}
            </div>
          )}
        </div>
      );

      case "visual": return (
        <div className="fade-in">
          <div className="stage-num">Step 03 / 06</div>
          <div className="stage-title">VISUAL DNA</div>
          <div className="stage-desc">These lock across all scenes to keep your entire video consistent.</div>
          <Sel label="Aesthetic" value={shared.aesthetic} onChange={setS("aesthetic")} optKey="aesthetic"/>
          <Sel label="Optics / Lens Style" value={shared.optics} onChange={setS("optics")} optKey="optics"/>
          <Sel label="Atmosphere" value={shared.atmosphere} onChange={setS("atmosphere")} optKey="atmosphere"/>
        </div>
      );

      case "light": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 2`:"Step 04 / 06"}</div>
          <div className="stage-title">LIGHT & LANDSCAPE</div>
          <div className="stage-desc">{isNewScene?`Set the environment for Scene ${activeScene+1} — can differ from Scene 1.`:`Set the two environments your ${shared.product||"product"} moves through.`}</div>
          {isNewScene&&<div className="locked-banner"><div className="locked-banner-icon">🔒</div><div className="locked-banner-text">Visual DNA locked from Scene 1 <span>— Aesthetic, Optics & Atmosphere carry over automatically.</span></div></div>}
          <Sel label="Starting Environment" value={sc.envA} onChange={v=>setScene(activeScene,"envA",v)} optKey="envA"/>
          <Sel label="Ending Environment" value={sc.envB} onChange={v=>setScene(activeScene,"envB",v)} optKey="envB"/>
          <Sel label="Lighting Transition" value={sc.lightTrans} onChange={v=>setScene(activeScene,"lightTrans",v)} optKey="lightTrans"/>
        </div>
      );

      case "choreo": return (
        <div className="fade-in">
          <div className="stage-num">{isNewScene?`Scene ${activeScene+1} — Step 3`:"Step 05 / 06"}</div>
          <div className="stage-title">CHOREOGRAPHY</div>
          <div className="stage-desc">{isNewScene?`New motion for Scene ${activeScene+1}. Visual DNA stays locked from Scene 1.`:`Build the 4-stage motion for your ${shared.product||"product"}.`}</div>
          <Sel label="Stage 1 — Opening Detail Focus" value={sc.detail1} onChange={v=>setScene(activeScene,"detail1",v)} optKey="detail1"/>
          <Sel label="Stage 2 — Subject Movement" value={sc.motion} onChange={v=>setScene(activeScene,"motion",v)} optKey="motion"/>
          <Sel label="Stage 3 — Macro Detail Focus" value={sc.detail2} onChange={v=>setScene(activeScene,"detail2",v)} optKey="detail2"/>
          <Sel label="Stage 3 — Floating Particles" value={sc.particles} onChange={v=>setScene(activeScene,"particles",v)} optKey="particles"/>
          <Sel label="Stage 4 — Final Light Effect" value={sc.lightFx} onChange={v=>setScene(activeScene,"lightFx",v)} optKey="lightFx"/>
        </div>
      );

      case "brand": return (
        <div className="fade-in">
          <div className="stage-num">Step 06 / 06</div>
          <div className="stage-title">BRANDING</div>
          <div className="stage-desc">Final frame — locked across all scenes.</div>
          <Sel label="Background Color" value={shared.bg} onChange={setS("bg")} optKey="bg"/>
          <div className="field">
            <div className="field-lbl">Tagline / Slogan</div>
            <input className="txt-input" placeholder="e.g. Engineered for the bold." value={shared.tagline} onChange={e=>setS("tagline")(e.target.value)}/>
          </div>
        </div>
      );

      case "preview": return (
        <div className="fade-in">
          <div className="done-icon">✦</div>
          <div className="done-title">{scenes.length>1?`${scenes.length} SCENES READY`:"PROMPT READY"}</div>
          <div className="done-sub">
            Built for: <strong style={{color:"var(--gold)"}}>{shared.product}</strong><br/>
            {scenes.length>1?`${scenes.length} scenes — paste each into your AI video platform in order.`:"Your prompt is ready — paste it into your preferred AI video platform."}
          </div>
          {scenes.length>1&&(
            <div className="scene-preview-tabs">
              {scenes.map((_,i)=>(
                <div key={i} className={`sp-tab${previewScene===i?" active":""}`} onClick={()=>setPreviewScene(i)}>Scene {i+1}{i===0?" (Anchor)":""}</div>
              ))}
              <div className={`sp-tab${previewScene===-1?" active":""}`} onClick={()=>setPreviewScene(-1)}>All</div>
            </div>
          )}
          <div className="preview-card">
            <div className="preview-hd">
              <div className="preview-title">{previewScene===-1?"All Scenes":`Scene ${previewScene+1}`}</div>
              <button className="copy-btn" onClick={()=>copy(previewScene===-1?"all":previewScene)}>
                {copied===(previewScene===-1?"all":previewScene)?"✓ Copied!":"Copy"}
              </button>
            </div>
            <div className="preview-body">
              {previewScene===-1?allPrompts:buildScenePrompt(shared,scenes[previewScene],previewScene+1,scenes.length)}
            </div>
          </div>
          {scenes.length>1&&<button className="btn-full" onClick={()=>copy("all")}>{copied==="all"?"✓ All Copied!":"⬆ Copy All Scenes"}</button>}
          {scenes.length===1&&<button className="btn-full" onClick={()=>copy(0)}>{copied===0?"✓ Copied!":"⬆ Copy Prompt"}</button>}
          <button className="btn-outline" onClick={addScene}>+ Add Scene {scenes.length+1} — Continue This Video</button>
          <button className="btn-outline" onClick={reset} style={{marginTop:4}}>↺ Build a New Commercial</button>
        </div>
      );
      default: return null;
    }
  };

  const isPreview = visibleStages[stage]?.id==="preview";

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="header">
          <div className="logo">SCENE<span>LAB</span></div>
          <div className="stage-pill"><div className="dot"/>{visibleStages[stage]?.label}</div>
        </div>
        <div className="progress-wrap">
          {visibleStages.map((s,i)=>(
            <div key={s.id+activeScene} className={`prog-bar${i<stage?" done":i===stage?" active":""}`} onClick={()=>i<=stage&&setStage(i)}/>
          ))}
        </div>
        <div className="prog-labels">
          {visibleStages.map((s,i)=>(
            <div key={s.id+activeScene} className={`prog-lbl${i===stage?" active":i<stage?" done":""}`} onClick={()=>i<=stage&&setStage(i)}>{s.short}</div>
          ))}
        </div>
        {isPreview&&(
          <div className="scene-bar">
            {scenes.map((_,i)=>(
              <div key={i} className={`scene-tab${activeScene===i?" active":""}`} onClick={()=>setActiveScene(i)}>
                {i===0&&<div className="scene-dot"/>}Scene {i+1}{i===0?" (Anchor)":""}
              </div>
            ))}
            <button className="add-scene-btn" onClick={addScene}>+ Scene {scenes.length+1}</button>
          </div>
        )}
        <div className="content">
          {renderContent()}
          {!isPreview&&(
            <div className="nav-row">
              {stage>0&&<button className="btn-back" onClick={()=>setStage(s=>s-1)}>← Back</button>}
              <button className="btn-next" disabled={!valid[stage]} onClick={()=>setStage(s=>s+1)}>
                {stage===visibleStages.length-2?(isNewScene?"Build Scene →":"Build Prompt →"):"Continue →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}