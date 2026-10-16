import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata={title:'Repasse MED · Sua produção, com clareza',description:'Previsão de repasse médico por competência.',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Repasse MED'},icons:{icon:'/icon-192.png',apple:'/icon-192.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#0b7a66'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;}
