import ResearchCard from "../components/ResearchCard";
import Navbar from "../components/Navbar";

export default function Home({ onNavigate }) {
  const cards = [
    {
      title: "Compressive Strength and Crack Detection",
      description:
        "Review compressive strength test results and utilize AI-powered crack detection for detailed structural integrity analysis.",
      page: "compressive-strength",
    },
    {
      title: "Cement Strength Prediction (Multi-Output)",
      description:
        "Predict cement compressive strength at 1D, 2D, 7D, 28D, and 56D using advanced ensemble machine learning models (XGBoost + LightGBM).",
      page: "cement-strength",
    },
    {
      title: "Cement Raw meals color particles identification",
      description:
        "Identify and analyze the color particles in cement raw meals to assess quality and consistency.",
      page: "raw-meal",
    },
  ];

  const handleCardClick = (card) => {
    if (card.page && onNavigate) {
      onNavigate(card.page);
    }
  };

  return (
    <>
      <Navbar />
      <main className="flex-1 p-10 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">
            Research Components
          </h1>
          <p className="text-gray-600 mt-2">
            Select a component to begin your analysis.
          </p>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {cards.map((c) => (
              <ResearchCard
                key={c.title}
                title={c.title}
                description={c.description}
                onClick={() => handleCardClick(c)}
              />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
