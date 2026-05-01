"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Background from "@/app/components/Background";

export default function ResetPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    setSuccess("Password updated! Redirecting...");
    setTimeout(() => router.push("/"), 2000);
    setLoading(false);
  };

  return (
    <>
      <Background />
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"transparent",fontFamily:"DM Sans, sans-serif",padding:"20px"}}>
        <div style={{width:"100%",maxWidth:400,background:"#050e1c",border:"1px solid rgba(68,187,255,0.13)",borderRadius:20,padding:"40px 32px"}}>
          <div style={{fontSize:28,letterSpacing:4,marginBottom:8,color:"#ede3c8"}}>
            <span style={{color:"#44bbff"}}>SCENE</span><span style={{color:"#ede3c8"}}>BLOC</span>
          </div>
          <div style={{fontSize:20,fontWeight:700,color:"#eef5ff",marginBottom:8}}>Set new password</div>
          <div style={{fontSize:14,color:"rgba(155,210,248,0.55)",marginBottom:20}}>Enter your new password below.</div>
          {error && <div style={{background:"rgba(255,80,80,0.10)",border:"1px solid rgba(255,80,80,0.22)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#ff9999",marginBottom:18}}>{error}</div>}
          {success && <div style={{background:"rgba(62,207,110,0.12)",border:"1px solid rgba(62,207,110,0.28)",borderRadius:10,padding:"12px 16px",fontSize:13,color:"#3ecf6e",marginBottom:18}}>{success}</div>}
          <div style={{marginBottom:14}}>
            <label style={{fontSize:9,fontWeight:700,letterSpacing:"2.5px",textTransform:"uppercase",color:"rgba(155,210,248,0.60)",display:"block",marginBottom:9}}>New Password</label>
            <input type="password" placeholder="Min 6 characters" value={password} onChange={e=>setPassword(e.target.value)}
              style={{width:"100%",background:"rgba(8,20,33,0.90)",border:"1px solid rgba(68,187,255,0.13)",borderRadius:13,padding:"16px 18px",fontFamily:"DM Sans, sans-serif",fontSize:15,color:"#eef5ff",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{marginBottom:22}}>
            <label style={{fontSize:9,fontWeight:700,letterSpacing:"2.5px",textTransform:"uppercase",color:"rgba(155,210,248,0.60)",display:"block",marginBottom:9}}>Confirm Password</label>
            <input type="password" placeholder="Repeat password" value={confirm} onChange={e=>setConfirm(e.target.value)}
              style={{width:"100%",background:"rgba(8,20,33,0.90)",border:"1px solid rgba(68,187,255,0.13)",borderRadius:13,padding:"16px 18px",fontFamily:"DM Sans, sans-serif",fontSize:15,color:"#eef5ff",outline:"none",boxSizing:"border-box"}}/>
          </div>
          <button onClick={handleReset} disabled={loading || !password || !confirm}
            style={{width:"100%",padding:"18px",background:"#44bbff",border:"none",borderRadius:16,color:"#000",fontFamily:"DM Sans, sans-serif",fontSize:15,fontWeight:800,cursor:"pointer",letterSpacing:"0.07em",textTransform:"uppercase",opacity:loading?0.5:1}}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </div>
    </>
  );
}
