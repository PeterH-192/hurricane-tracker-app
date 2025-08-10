import * as React from 'react';

interface ModelInfo {
  id: string;
  name: string;
}

interface ModelSelectorProps {
  models: ModelInfo[];
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ models, selectedModelId, onSelectModel }) => {
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onSelectModel(event.target.value);
  };

  return (
    <div className="mb-4">
      <label htmlFor="model-select" className="block text-sm font-medium text-slate-400 mb-2">
        Weather Model
      </label>
      <select
        id="model-select"
        value={selectedModelId}
        onChange={handleSelectChange}
        className="block w-full p-3 bg-slate-700 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
        aria-label="Select a weather model"
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModelSelector;