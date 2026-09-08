import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: '전하지 못한 진심 | 오늘은 마음부터 퇴근하세요', description: '현실에서는 삼켰던 한마디, 여기서는 해도 괜찮아요. 메신저, 이메일, 공문, 보고서로 마음을 가상 전달하는 나만의 공간.' };
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="ko"><body>{children}</body></html>; }
