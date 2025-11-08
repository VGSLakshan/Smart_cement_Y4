export default function ResearchCard({ title, description }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="mt-2 text-sm text-gray-600">{description}</p>
        </div>
        <div className="ml-4">
          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-red-600 font-bold">IC</div>
        </div>
      </div>

      <div className="mt-6">
        <button className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Open</button>
      </div>
    </div>
  );
}
