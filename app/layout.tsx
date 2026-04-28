import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Background from "./components/Background";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SceneBloc — AI Video Prompt Builder",
  description: "Craft cinematic AI video prompts for luxury product campaigns",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Background />
        {children}
        <footer style={{padding:"24px 7vw",display:"flex",alignItems:"center",justifyContent:"center",gap:28,borderTop:"1px solid rgba(68,187,255,0.12)",background:"rgba(2,8,16,0.92)",backdropFilter:"blur(20px)",flexWrap:"wrap"}}>
          <a href="/terms" style={{color:"rgba(155,210,248,0.80)",fontSize:13,textDecoration:"none",fontFamily:"DM Sans, sans-serif",fontWeight:600,letterSpacing:"0.03em"}}>Terms of Service</a>
          <a href="/privacy" style={{color:"rgba(155,210,248,0.80)",fontSize:13,textDecoration:"none",fontFamily:"DM Sans, sans-serif",fontWeight:600,letterSpacing:"0.03em"}}>Privacy Policy</a>
          <a href="/faq" style={{color:"rgba(155,210,248,0.80)",fontSize:13,textDecoration:"none",fontFamily:"DM Sans, sans-serif",fontWeight:600,letterSpacing:"0.03em"}}>FAQ</a>
          <span style={{color:"rgba(155,210,248,0.50)",fontSize:12,fontFamily:"DM Sans, sans-serif"}}>© 2026 SceneBloc</span>
        </footer>
      </body>
    </html>
  );
}