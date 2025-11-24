import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🕋</div>
            <h1 className="text-2xl font-bold text-blue-600">OmraFlow Pro</h1>
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Essai gratuit
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          La solution tout-en-un pour
          <br />
          <span className="text-blue-600">digitaliser votre agence Omra</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Gérez vos pèlerins, réservations, paiements et documents en un seul endroit.
          Gagnez du temps et développez votre activité.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/register"
            className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
          >
            Commencer gratuitement
          </Link>
          <Link
            href="#features"
            className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition"
          >
            Découvrir
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          ✓ Essai gratuit 30 jours · ✓ Sans engagement · ✓ Support en français
        </p>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Tout ce dont vous avez besoin
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à transformer votre agence ?
          </h2>
          <p className="text-xl mb-8">
            Rejoignez les agences qui ont choisi OmraFlow Pro
          </p>
          <Link
            href="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 inline-block"
          >
            Démarrer maintenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <p>© 2025 OmraFlow Pro. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: '👥',
    title: 'CRM Complet',
    description: 'Gérez vos leads, clients et pipeline de vente efficacement.',
  },
  {
    icon: '✈️',
    title: 'Réservations',
    description: 'Organisez vos groupes, vols et hébergements en quelques clics.',
  },
  {
    icon: '💳',
    title: 'Paiements',
    description: 'Encaissez en ligne, gérez les échéanciers et la facturation.',
  },
  {
    icon: '📄',
    title: 'Documents & Visa',
    description: 'Collectez et suivez tous les documents nécessaires.',
  },
  {
    icon: '📱',
    title: 'App Mobile Pèlerins',
    description: 'Offrez une expérience digitale à vos clients.',
  },
  {
    icon: '📊',
    title: 'Analytics',
    description: 'Tableaux de bord et rapports pour piloter votre activité.',
  },
];
