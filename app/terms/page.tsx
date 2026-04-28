"use client";
import { useRouter } from "next/navigation";
import Background from "@/app/components/Background";

export default function TermsPage() {
  const router = useRouter();
  return (
    <>
      <Background />
      <div style={{minHeight:"100vh",fontFamily:"DM Sans, sans-serif",color:"#eef5ff",padding:"60px 7vw 100px",maxWidth:860,margin:"0 auto",position:"relative",zIndex:2}}>
        <button onClick={()=>router.back()} style={{background:"none",border:"none",color:"rgba(155,210,248,0.55)",fontSize:13,cursor:"pointer",marginBottom:40,display:"flex",alignItems:"center",gap:6,padding:0}}>← Back</button>
        <div style={{fontFamily:"'Bebas Neue', sans-serif",fontSize:48,letterSpacing:4,color:"#ede3c0",marginBottom:8}}>TERMS OF <span style={{color:"#44bbff"}}>SERVICE</span></div>
        <div style={{fontSize:13,color:"rgba(155,210,248,0.45)",marginBottom:48}}>Last updated: April 2026</div>

        {[
          {title:"1. Acceptance of Terms", body:"By accessing or using SceneBloc, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service."},
          {title:"2. Description of Service", body:"SceneBloc is an AI-powered creative production studio that helps users generate cinematic prompts, image prompts, video prompts, voiceover scripts, and related creative content. SceneBloc provides tools and prompts — it does not generate images or videos directly."},
          {title:"3. Account Registration", body:"You must create an account to access SceneBloc's features. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. You must be at least 18 years of age to use SceneBloc."},
          {title:"4. Free Trial", body:"New users receive a 7-day free trial with Pro-level access upon signup. No credit card is required to start the trial. At the end of the trial period, your account will automatically revert to the Free tier unless you choose to subscribe to a paid plan."},
          {title:"5. Subscription & Billing", body:"SceneBloc offers monthly and annual subscription plans. By subscribing, you authorise SceneBloc to charge your payment method on a recurring basis. All prices are displayed in GBP and are inclusive of any applicable taxes. Annual subscriptions are billed as a single upfront payment."},
          {title:"6. Refund Policy", body:"Monthly subscriptions are non-refundable. Since we offer a 7-day free trial with no credit card required, we encourage all users to evaluate the service before subscribing. Annual subscriptions may be cancelled within 14 days of purchase for a full refund, provided usage has not exceeded free tier limits during that period. After 14 days, annual subscriptions are non-refundable but will remain active until the end of the billing period."},
          {title:"7. Cancellation", body:"You may cancel your subscription at any time from your account settings. Cancellation takes effect at the end of your current billing period and you will retain full access until then. No cancellation fees apply."},
          {title:"8. Acceptable Use", body:"You agree not to use SceneBloc for any unlawful purpose, to generate harmful or abusive content, to attempt to reverse engineer or copy our systems, or to violate any applicable laws or regulations. SceneBloc reserves the right to suspend or terminate accounts that violate these terms."},
          {title:"9. Intellectual Property", body:"All prompts and content you generate using SceneBloc belong to you. SceneBloc retains ownership of its platform, tools, systems, and underlying technology. You grant SceneBloc a limited licence to process your inputs solely for the purpose of delivering the service."},
          {title:"10. Disclaimer of Warranties", body:'SceneBloc is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, error-free, or that the outputs will meet your specific requirements. AI-generated content may vary in quality and accuracy.'},
          {title:"11. Limitation of Liability", body:"To the maximum extent permitted by law, SceneBloc shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service. Our total liability to you shall not exceed the amount you paid to SceneBloc in the 12 months preceding the claim."},
          {title:"12. Changes to Terms", body:"SceneBloc reserves the right to update these Terms of Service at any time. We will notify users of significant changes via email or in-app notification. Continued use of the service after changes constitutes acceptance of the new terms."},
          {title:"13. Governing Law", body:"These terms are governed by the laws of England and Wales. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of England and Wales."},
          {title:"14. Contact", body:"For any questions regarding these Terms of Service, please contact us at legal@scenebloc.com."},
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