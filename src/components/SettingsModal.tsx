import React, { useState } from 'react';
import { loadConfig, saveConfig, clearConfig } from '../config';
import { ChatConfig } from '../types';

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const defaultConfig: ChatConfig = {
    backendUrl: '',
    apiKey: '',
    model: '',
    maxTokens: 0,
    agents: [],
  };
  const [config, setConfig] = useState<ChatConfig>(loadConfig() || defaultConfig);
  const [importError, setImportError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!config) return;
    const { name, value, type } = e.target;
    let newValue: any = value;
    if (name === 'maxTokens') {
      newValue = value === '' ? 0 : Number(value);
    }
    setConfig({ ...config, [name]: newValue });
  };

  const handleSave = () => {
    if (config) saveConfig(config);
    onClose();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        setConfig(imported);
        setImportError('');
      } catch {
        setImportError('Invalid config file');
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    if (!config) return;
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'llm_chat_config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg w-full max-w-md">
        <h2 className="text-lg font-bold mb-4">Settings</h2>
        <label className="block mb-2">Backend URL
          <input name="backendUrl" className="w-full p-2 rounded border mb-2" value={config?.backendUrl || ''} onChange={handleChange} />
        </label>
        <label className="block mb-2">API Key
          <input name="apiKey" className="w-full p-2 rounded border mb-2" value={config?.apiKey || ''} onChange={handleChange} />
        </label>
        <label className="block mb-2">Model
          <input name="model" className="w-full p-2 rounded border mb-2" value={config?.model || ''} onChange={handleChange} />
        </label>
        <label className="block mb-2">Max Tokens
          <input name="maxTokens" type="number" className="w-full p-2 rounded border mb-2" value={config?.maxTokens || 0} onChange={handleChange} />
        </label>
        <div className="flex gap-2 mb-2">
          <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={handleSave}>Save</button>
          <button className="px-3 py-1 bg-gray-300 dark:bg-gray-700 rounded" onClick={onClose}>Cancel</button>
        </div>
        <div className="flex gap-2 mb-2">
          <button className="px-3 py-1 bg-green-500 text-white rounded" onClick={handleExport}>Export</button>
          <label className="px-3 py-1 bg-yellow-500 text-white rounded cursor-pointer">
            Import
            <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
          </label>
          <button className="px-3 py-1 bg-red-500 text-white rounded" onClick={clearConfig}>Clear</button>
        </div>
        {importError && <div className="text-red-600">{importError}</div>}
        <div className="text-xs text-gray-500 mt-2">API keys are stored locally in your browser. Clear storage to delete.</div>
      </div>
    </div>
  );
}
