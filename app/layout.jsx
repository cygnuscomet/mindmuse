import '@styles/globals.css'

import Nav from '@/components/Nav'
import { Toaster } from "@/components/ui/toaster"

export const metadata = {
    title: 'MindMuse',
    description: 'Discover a better yourself through AI-assisted journaling & self-reflection',
}

const Layout = ({children}) => {
  return (
    <html lang="en">
        <head>
            <title>{metadata.title}</title>
            <meta name="description" content={metadata.description} />
            <link rel="icon" href="/assets/logo.svg" sizes="any" />
        </head>
        <body style={{backgroundImage: 'url(/assets/background.jpg)', backgroundBlendMode: 'color-dodge', backgroundSize: 'cover'}}>
            <Nav></Nav>
            <main className="app m-6 h-full">
                {children}
            </main>
            <Toaster />
        </body>
    </html>
  )
}

export default Layout