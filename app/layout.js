export const metadata = {
  title: '患者の声 - Patient Voices',
  description: '患者とご家族の体験を共有するプラットフォーム',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  )
}
