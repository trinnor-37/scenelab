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
  description: "Craft cinematic AI video prompts for luxury product commercials in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Background />
{children}
        <footer style={{
          padding:"20px 7vw",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          gap:24,
          borderTop:"1px solid rgba(68,187,255,0.08)",
          background:"rgba(2,8,16,0.85)",
          backdropFilter:"blur(20px)",
          flexWrap:"wrap",
        }}>
          <a href="/terms" style={{color:"rgba(155,210,248,0.45)",fontSize:12,textDecoration:"none",fontFamily:"DM Sans, sans-serif"}}>Terms of Service</a>
          <a href="/privacy" style={{color:"rgba(155,210,248,0.45)",fontSize:12,textDecoration:"none",fontFamily:"DM Sans, sans-serif"}}>Privacy Policy</a>
          <a href="/faq" style={{color:"rgba(155,210,248,0.45)",fontSize:12,textDecoration:"none",fontFamily:"DM Sans, sans-serif"}}>FAQ</a>
          <span style={{color:"rgba(155,210,248,0.20)",fontSize:12}}>© 2026 SceneBloc</span>
        </footer>