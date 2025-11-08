import ResearchCard from '../components/ResearchCard';

export default function Home() {
  const cards = [
    {
      title: 'IoT-Based Cube Dimension Monitoring',
      description:
        'Track the real-time dimensions of cement cubes throughout the curing process using IoT sensors for precise analysis.',
    },
    {
      title: 'Environmental and Curing Data Logger',
      description:
        'Log critical environmental data such as humidity and ambient temperature during the curing phase to ensure optimal conditions.',
    },
    {
      title: 'Material Mix Ratio and Temperature Analysis',
      description:
        'Analyze the relationship between material composition and the internal temperature of cement cubes for enhanced performance.',
    },
    {
      title: 'Compressive Strength and Crack Detection',
      description:
        'Review compressive strength test results and utilize AI-powered crack detection for detailed structural integrity analysis.',
    },
  ];

  return (
    <main className="flex-1 p-10 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Research Components</h1>
        <p className="text-gray-600 mt-2">Select a component to begin your analysis.</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {cards.map((c) => (
            <ResearchCard key={c.title} title={c.title} description={c.description} />
          ))}
        </div>
      </div>
    </main>
  );
}
