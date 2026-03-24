export const metadata = { title: 'Meta Ads Dashboard', description: 'Live Meta Ads CPL Dashboard' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin:0, padding:0 }}>{children}</body>
    </html>
  );
}
