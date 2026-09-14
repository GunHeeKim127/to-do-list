import "./globals.css";

export const metadata = {
  title: "Task & Diary App",
  description: "CSS3 기반 투두 대시보드",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}