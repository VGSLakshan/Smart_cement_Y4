import React from "react";
import { Trash2 } from "lucide-react";

export default function RawMealsPredictions({ predictions, onDelete }) {
  if (predictions.length === 0) {
    return (
      <p className="text-gray-500 text-center mt-10">
        No predictions yet
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {predictions.map((item, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-md p-4"
        >
          {/* Image wrapper */}
          <div className="relative mb-4">
            <img
              src={item.image}
              alt="Prediction"
              className="rounded-lg h-40 w-full object-cover"
            />

            {/* Delete Button */}
            <button
              onClick={() => onDelete(index)}
              className="absolute top-2 right-2 bg-white/90 backdrop-blur p-1.5 rounded-full shadow hover:text-red-600 transition"
              title="Delete prediction"
            >
              <Trash2 size={16} />
            </button>
          </div>

          <p className="text-xs text-gray-500 mb-2">
            {item.date}
          </p>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-red-100 rounded p-2">
              <p className="text-xs">Dark Red</p>
              <p className="font-bold text-red-700">
                {item.counts.dark_red}
              </p>
            </div>

            <div className="bg-orange-100 rounded p-2">
              <p className="text-xs">Light Red</p>
              <p className="font-bold text-orange-600">
                {item.counts.light_red}
              </p>
            </div>

            <div className="bg-gray-200 rounded p-2">
              <p className="text-xs">White</p>
              <p className="font-bold">
                {item.counts.white}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
