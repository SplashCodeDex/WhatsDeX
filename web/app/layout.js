import '../styles/globals.css'

export const metadata = {
  title: 'WhatsDeX Dashboard',
  description: 'Professional WhatsApp Bot Management Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="relative min-h-screen">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-gray-900/20 pointer-events-none"></div>
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}