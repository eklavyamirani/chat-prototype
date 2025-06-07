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
  const [editingFunction, setEditingFunction] = useState<number | null>(null);
  const [fnDraft, setFnDraft] = useState({ name: '', description: '', parameters: '{}', code: '' });
  // Function definitions UI handlers
  const handleFnDraftChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFnDraft({ ...fnDraft, [e.target.name]: e.target.value });
  };

  const startAddFunction = () => {
    setFnDraft({ name: '', description: '', parameters: '{}', code: '' });
    setEditingFunction(-1);
  };

  const startEditFunction = (idx: number) => {
    const fn = config.functions?.[idx];
    if (!fn) return;
    setFnDraft({
      name: fn.name,
      description: fn.description,
      parameters: JSON.stringify(fn.parameters, null, 2),
      code: fn.code,
    });
    setEditingFunction(idx);
  };

  const saveFunction = () => {
    let paramsObj = {};
    try {
      paramsObj = JSON.parse(fnDraft.parameters);
    } catch {
      alert('Parameters must be valid JSON');
      return;
    }
    const fnDef = { name: fnDraft.name, description: fnDraft.description, parameters: paramsObj, code: fnDraft.code };
    let newFns = config.functions ? [...config.functions] : [];
    if (editingFunction === -1) {
      newFns.push(fnDef);
    } else if (editingFunction !== null) {
      newFns[editingFunction] = fnDef;
    }
    setConfig({ ...config, functions: newFns });
    setEditingFunction(null);
  };

  const deleteFunction = (idx: number) => {
    if (!config.functions) return;
    const newFns = config.functions.slice();
    newFns.splice(idx, 1);
    setConfig({ ...config, functions: newFns });
  };
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
        <div className="space-y-2">
          <label className="block">Backend URL
            <input name="backendUrl" className="w-full p-2 rounded border mb-2" value={config?.backendUrl || ''} onChange={handleChange} />
          </label>
          <label className="block">API Key
            <input name="apiKey" className="w-full p-2 rounded border mb-2" value={config?.apiKey || ''} onChange={handleChange} />
          </label>
          <label className="block">Model
            <input name="model" className="w-full p-2 rounded border mb-2" value={config?.model || ''} onChange={handleChange} />
          </label>
          <label className="block">Max Tokens
            <input name="maxTokens" type="number" className="w-full p-2 rounded border mb-2" value={config?.maxTokens || 0} onChange={handleChange} />
          </label>
        </div>
        {/* User Functions Section */}
        <div className="mb-4 mt-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">User Functions</span>
            <button className="px-2 py-1 bg-blue-400 text-white rounded text-xs" onClick={startAddFunction}>Add Function</button>
          </div>
          {(config.functions && config.functions.length > 0) ? (
            <ul className="mb-2">
              {config.functions.map((fn, idx) => (
                <li key={fn.name} className="flex items-center justify-between mb-1">
                  <span className="truncate max-w-xs" title={fn.name}>{fn.name}</span>
                  <div className="flex gap-1">
                    <button className="text-xs px-2 py-0.5 bg-gray-300 rounded" onClick={() => startEditFunction(idx)}>Edit</button>
                    <button className="text-xs px-2 py-0.5 bg-red-400 text-white rounded" onClick={() => deleteFunction(idx)}>Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : <div className="text-xs text-gray-500 mb-2">No user functions defined.</div>}
          {editingFunction !== null && (
            <div className="border p-2 rounded bg-gray-50 dark:bg-gray-700 mb-2">
              <label className="block mb-1 text-xs">Name
                <input name="name" className="w-full p-1 rounded border mb-1" value={fnDraft.name} onChange={handleFnDraftChange} />
              </label>
              <label className="block mb-1 text-xs">Description
                <input name="description" className="w-full p-1 rounded border mb-1" value={fnDraft.description} onChange={handleFnDraftChange} />
              </label>
              <label className="block mb-1 text-xs">Parameters (JSON Schema)
                <textarea name="parameters" className="w-full p-1 rounded border mb-1 text-xs font-mono" rows={2} value={fnDraft.parameters} onChange={handleFnDraftChange} />
              </label>
              <label className="block mb-1 text-xs">Code (JS, function body, use <code>args</code> as input)
                <textarea name="code" className="w-full p-1 rounded border mb-1 text-xs font-mono" rows={3} value={fnDraft.code} onChange={handleFnDraftChange} />
              </label>
              <div className="flex gap-2 mt-1">
                <button className="px-2 py-1 bg-green-500 text-white rounded text-xs" onClick={saveFunction}>Save</button>
                <button className="px-2 py-1 bg-gray-400 text-white rounded text-xs" onClick={() => setEditingFunction(null)}>Cancel</button>
              </div>
              <div className="text-xs text-gray-500 mt-1">Caution: User code runs in a sandboxed iframe, but may still consume resources.</div>
            </div>
          )}
        </div>
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
        <div className="text-xs text-gray-500 mt-2">API keys and functions are stored locally in your browser. Clear storage to delete.</div>
      </div>
    </div>
  );
}
