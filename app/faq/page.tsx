"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Background from "@/app/components/Background";

export default function FAQPage() {
  const router = useRouter();
  const [open, setOpen] = useState<number|null>(null);
  const faqs = [
    {q:"What is SceneBloc?", a:"SceneBloc is an AI-powered creative production studio designed for content creators, filmmakers, and brand marketers. It helps you generate cinematic video prompts, image prompts, voiceover scripts, A/B variations, and full production pipelines — all in one place."},
    {q:"How does the 7-day free trial work?", a:"Every new SceneBloc account includes a 7-day free trial with full Pro-level access. No credit card is required to start. You get unlimited access to all Pro features for 7 days. At the end of the trial, your account automatically reverts to the Free tier unless you choose to subscribe."},
    {q:"Can I cancel anytime?", a:"Yes — you can cancel your subscription at any time from your account settings. There are no cancellation fees. You will retain full access until the end of your current billing period."},
    {q:"What AI tools does SceneBloc use?", a:"SceneBloc uses Anthropic's Claude API to power its AI features including the Concept Generator, Voiceover Scripts, and A/B Variations. The platform is designed to generate prompts optimised for leading AI video tools including Seedance, Kling, Runway, Veo, and Sora."},
    {q:"Do I need my own AI accounts to use SceneBloc?", a:"No — SceneBloc's AI features work directly within the platform. However, to actually generate images and videos from your prompts, you will need accounts with your preferred AI video tools such as Seedance, Kling AI, Runway, or similar platforms."},
    {q:"What happens to my prompts if I cancel?", a:"Your saved prompt history remains accessible until your subscription period ends. After cancellation, if you revert to the Free tier, you can still access your history. If you delete your account entirely, all saved prompts will be permanently deleted within 30 days."},
    {q:"Is there a refund policy?", a:"Monthly subscriptions are non-refundable, as we offer a 7-day free trial with no credit card required before subscribing. Annual subscriptions may be refunded within 14 days of purchase, provided usage has not exceeded free tier limits during that period. After 14 days, annual subscriptions are non-refundable but remain active until the end of the billing year."},
    {q:"What payment methods do you accept?", a:"SceneBloc accepts all major credit and debit cards including Visa, Mastercard, and American Express. All payments are processed securely by Stripe. We do not store your payment information on our servers."},
    {q:"Is my payment information secure?", a:"Yes — all payments are handled by Stripe, one of the world's leading payment processors. SceneBloc never stores your card details. Stripe is PCI DSS Level 1 certified, the highest level of payment security certification available."},
    {q:"Can I switch plans?", a:"Yes — you can upgrade or downgrade your plan at any time from your account settings. Upgrades take effect immediately. Downgrades take effect at the start of your next billing period."},
  ];
  return (
    <>
      <Background />
      <div style={{minHeight:"100vh",fontFamily:"DM Sans, sans-serif",color:"#eef5ff",padding:"60px 7vw 100px",maxWidth:860,margin:"0 auto",position:"relative",zIndex:2}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"rgba(155,210,248,0.55)",fontSize:13,cursor:"pointer",marginBottom:40,display:"flex",alignItems:"center",gap:6,padding:0}}>← Back</button>
        <div style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:48,letterSpacing:4,color:"#ede3c0",marginBottom:8}}>FREQUENTLY ASKED <span style={{color:"#44bbff"}}>QUESTIONS</span></div>
        <div style={{fontSize:13,color:"rgba(155,210,248,0.45)",marginBottom:48}}>Everything you need to know about SceneBloc.</div>
        {faqs.map((f,i)=>(
          <div key={i} style={{marginBottom:12,background:open===i?"rgba(68,187,255,0.06)":"rgba(5,14,28,0.72)",border:`1px solid ${open===i?"rgba(68,187,255,0.35)":"rgba(68,187,255,0.10)"}`,borderRadius:16,overflow:"hidden",transition:"all 0.2s"}}>
            <button onClick={()=>setOpen(open===i?null:i)} style={{width:"100%",padding:"22px 24px",background:"none",border:"none",display:"flex",alignItems:"center",justifyContent:"space-between",cursor:"pointer",textAlign:"left",gap:16}}>
              <span style={{fontSize:15,fontWeight:700,color:"#eef5ff"}}>{f.q}</span>
              <span style={{color:"#44bbff",fontSize:18,flexShrink:0,transition:"transform 0.2s",transform:open===i?"rotate(45deg)":"rotate(0deg)"}}>+</span>
            </button>
            {open===i&&(
              <div style={{padding:"0 24px 22px",fontSize:14,color:"rgba(155,210,248,0.75)",lineHeight:1.8}}>{f.a}</div>
            )}
          </div>
        ))}
        <div style={{marginTop:48,padding:"24px",background:"rgba(68,187,255,0.06)",border:"1px solid rgba(68,187,255,0.13)",borderRadius:16,textAlign:"center"}}>
          <div style={{fontSize:14,color:"rgba(155,210,248,0.60)",marginBottom:8}}>Still have questions?</div>
          <a href="mailto:legal@scenebloc.com" style={{color:"#44bbff",fontWeight:700,fontSize:14}}>legal@scenebloc.com</a>
        </div>
      </div>
    </>
  );
}