"use client";
import { useRouter } from "next/navigation";
import Background from "@/app/components/Background";

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <>
      <Background />
      <div style={{minHeight:"100vh",fontFamily:"DM Sans, sans-serif",color:"#eef5ff",padding:"60px 7vw 100px",maxWidth:860,margin:"0 auto",position:"relative",zIndex:2}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"rgba(155,210,248,0.55)",fontSize:13,cursor:"pointer",marginBottom:40,display:"flex",alignItems:"center",gap:6,padding:0}}>← Back</button>
        <div style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:48,letterSpacing:4,color:"#ede3c0",marginBottom:8}}>PRIVACY <span style={{color:"#44bbff"}}>POLICY</span></div>
        <div style={{fontSize:13,color:"rgba(155,210,248,0.45)",marginBottom:48}}>Last updated: April 2026</div>

        {[
          {title:"1. Introduction", body:"SceneBloc is committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data. By using SceneBloc, you agree to the collection and use of information in accordance with this policy."},
          {title:"2. Information We Collect", body:"We collect only the minimum information necessary to provide our service. This includes: your email address (used for account creation and communication), and payment information processed securely by Stripe. We do not collect your name, address, phone number, or any other personal identifiers beyond your email."},
          {title:"3. How We Use Your Information", body:"Your email address is used to create and manage your account, send essential service communications such as trial reminders and billing notifications, and respond to support requests. Your payment information is processed entirely by Stripe and is never stored on SceneBloc servers."},
          {title:"4. Data Storage", body:"Your account data including email address and subscription status is stored securely in Supabase, a GDPR-compliant cloud database provider. The prompts and content you generate are stored in your account history and are accessible only to you."},
          {title:"5. Third-Party Services", body:"SceneBloc uses the following third-party services to operate: Supabase for secure user authentication and data storage, Stripe for payment processing, Anthropic's Claude API for AI-powered content generation, and Netlify for hosting. Each of these providers maintains their own privacy policies and security standards."},
          {title:"6. Data Retention", body:"We retain your account data for as long as your account is active. If you delete your account, your personal data will be permanently deleted within 30 days. Generated prompts stored in your history will also be deleted upon account deletion."},
          {title:"7. Your Rights", body:"Under UK GDPR, you have the right to access the personal data we hold about you, request correction of inaccurate data, request deletion of your data, object to processing of your data, and request a copy of your data in a portable format. To exercise any of these rights, contact us at legal@scenebloc.com."},
          {title:"8. Cookies", body:"SceneBloc uses only essential cookies required for authentication and session management. We do not use tracking cookies, advertising cookies, or third-party analytics cookies."},
          {title:"9. Children's Privacy", body:"SceneBloc is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from minors. If you believe a minor has created an account, please contact us at legal@scenebloc.com."},
          {title:"10. Changes to This Policy", body:"We may update this Privacy Policy from time to time. We will notify you of any significant changes via email. Continued use of SceneBloc after changes constitutes acceptance of the updated policy."},
          {title:"11. Contact", body:"For any privacy-related questions or to exercise your data rights, please contact us at legal@scenebloc.com."},
        ].map(s=>(
          <div key={s.title} style={{marginBottom:36}}>
            <div style={{fontSize:13,fontWeight:700,letterSpacing:2,textTransform:"uppercase",color:"#44bbff",marginBottom:10}}>{s.title}</div>
            <div style={{fontSize:15,color:"rgba(155,210,248,0.75)",lineHeight:1.8}}>{s.body}</div>
          </div>
        ))}
      </div>
    </>
  );
}