import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 max-w-md text-center">
        <p className="text-7xl font-display font-bold gradient-text-kosha mb-2">404</p>
        <h1 className="text-xl font-display font-semibold mb-3">Cette page n&apos;existe pas</h1>
        <p className="text-white/60 text-sm mb-6">
          Le lien est peut-être obsolète, ou tu t&apos;es égaré dans l&apos;univers KOSHA.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-medium hover:from-violet-500 hover:to-cyan-400 transition-all"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
