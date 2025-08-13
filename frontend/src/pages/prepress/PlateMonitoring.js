import React, { useEffect, useMemo, useState } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {
  Squares2X2Icon,
  ArrowsPointingInIcon,
  PlusIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
  TrashIcon,
  RectangleGroupIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';

const PlateCanvas = ({ plate, placements, previewPlacement }) => {
  if (!plate) return null;
  const canvasWidth = 820; // px
  const canvasHeight = 420; // px
  const border = 2; // border stroke
  const padding = border; // draw content inside the border
  const innerWidth = canvasWidth - padding * 2;
  const innerHeight = canvasHeight - padding * 2;
  const scaleX = innerWidth / plate.widthCm;
  const scaleY = innerHeight / plate.heightCm;

  const rects = placements.map((p, idx) => ({
    key: `p-${idx}`,
    x: padding + p.xCm * scaleX,
    y: padding + p.yCm * scaleY,
    w: p.widthCm * scaleX,
    h: p.heightCm * scaleY,
    color: '#60a5fa',
  }));

  if (previewPlacement) {
    rects.push({
      key: 'preview',
      x: padding + previewPlacement.xCm * scaleX,
      y: padding + previewPlacement.yCm * scaleY,
      w: previewPlacement.widthCm * scaleX,
      h: previewPlacement.heightCm * scaleY,
      color: '#f59e0b',
      dashed: true,
    });
  }

  // Draw background grid every 50 cm
  const gridLines = [];
  const stepX = 50 * scaleX;
  for (let x = padding; x <= canvasWidth - padding + 0.5; x += stepX) {
    gridLines.push(
      <line key={`gx-${x}`} x1={x} y1={padding} x2={x} y2={canvasHeight - padding} stroke="#e5e7eb" strokeWidth={1} />
    );
  }
  const stepY = 50 * scaleY;
  for (let y = padding; y <= canvasHeight - padding + 0.5; y += stepY) {
    gridLines.push(
      <line key={`gy-${y}`} x1={padding} y1={y} x2={canvasWidth - padding} y2={y} stroke="#e5e7eb" strokeWidth={1} />
    );
  }

  return (
    <svg width={canvasWidth} height={canvasHeight} className="rounded bg-white shadow border">
      <defs>
        <linearGradient id="plateGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#eef2ff" />
        </linearGradient>
      </defs>
      {/* Plate background */}
      <rect x={0} y={0} width={canvasWidth} height={canvasHeight} fill="url(#plateGrad)" stroke="#0f172a" strokeWidth={border} />
      {/* Grid */}
      <g>{gridLines}</g>
      {/* Left/right margins */}
      <rect x={padding} y={padding} width={plate.marginLeftCm * scaleX} height={innerHeight} fill="#e2e8f0" />
      <rect x={canvasWidth - padding - plate.marginRightCm * scaleX} y={padding} width={plate.marginRightCm * scaleX} height={innerHeight} fill="#e2e8f0" />
      {rects.map((r) => (
        <g key={r.key}>
          <rect x={r.x} y={r.y} width={r.w} height={r.h} fill={r.color} opacity={0.75} stroke="#1f2937" strokeDasharray={r.dashed ? '6 6' : '0'} />
        </g>
      ))}
    </svg>
  );
};

const PlateMonitoring = () => {
  const [plates, setPlates] = useState([]);
  const [activePlateId, setActivePlateId] = useState('');
  const [plateData, setPlateData] = useState(null); // { plate, stats }
  const [simulation, setSimulation] = useState(null); // { fits, position, stats }
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddJobModal, setShowAddJobModal] = useState(false);
  const [jobWidth, setJobWidth] = useState('');
  const [jobHeight, setJobHeight] = useState('');
  const [statsSummary, setStatsSummary] = useState(null);
  const [prepressOrders, setPrepressOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  // Smooth slide-over state
  const [placementsPanelMounted, setPlacementsPanelMounted] = useState(false);
  const [placementsPanelOpen, setPlacementsPanelOpen] = useState(false);

  const openPlacementsPanel = () => {
    if (!placementsPanelMounted) {
      setPlacementsPanelMounted(true);
      requestAnimationFrame(() => setPlacementsPanelOpen(true));
    } else {
      setPlacementsPanelOpen(true);
    }
  };

  const closePlacementsPanel = () => {
    setPlacementsPanelOpen(false);
    setTimeout(() => setPlacementsPanelMounted(false), 300);
  };

  const loadPlates = async () => {
    try {
      const { data } = await api.get('/api/plates?status=Active');
      setPlates(data);
      if (data.length && !activePlateId) setActivePlateId(data[0]._id);
    } catch (e) {
      toast.error('Failed to load plates');
    }
  };

  const loadPlate = async (id) => {
    if (!id) return;
    try {
      const { data } = await api.get(`/api/plates/${id}`);
      setPlateData(data);
      setSimulation(null);
    } catch (e) {
      toast.error('Failed to load plate');
    }
  };

  useEffect(() => {
    loadPlates();
    // Fetch global stats
    (async () => {
      try {
        const { data } = await api.get('/api/plates/stats');
        setStatsSummary(data);
      } catch (e) {
        // optional
      }
    })();
  }, []);

  useEffect(() => {
    loadPlate(activePlateId);
  }, [activePlateId]);

  const stats = plateData?.stats;
  const plate = plateData?.plate;

  const onSimulate = async () => {
    if (!activePlateId || !jobWidth || !jobHeight) return;
    const widthCm = Number(jobWidth);
    const heightCm = Number(jobHeight);
    if (Number.isNaN(widthCm) || Number.isNaN(heightCm)) {
      toast.warn('Please enter valid numeric dimensions (cm)');
      return;
    }
    try {
      const { data } = await api.post(`/api/plates/${activePlateId}/simulate`, { widthCm, heightCm });
      setSimulation(data);
      if (!data.fits) toast.warning('Job does not fit on remaining space');
    } catch (e) {
      toast.error('Failed to simulate placement');
    }
  };

  const onCommit = async () => {
    if (!simulation?.fits || !simulation?.position) {
      toast.warn('Simulate first and ensure it fits');
      return;
    }
    try {
      const widthCm = Number(jobWidth);
      const heightCm = Number(jobHeight);
      await api.post(`/api/plates/${activePlateId}/placements`, { widthCm, heightCm, orderId: selectedOrderId || undefined });
      toast.success('Placement added');
      setJobWidth('');
      setJobHeight('');
      setSelectedOrderId('');
      setShowAddJobModal(false);
      await loadPlate(activePlateId);
    } catch (e) {
      toast.error('Failed to add placement');
    }
  };

  const [newPlate, setNewPlate] = useState({ name: '', widthCm: 500, heightCm: 500, marginLeftCm: 2, marginRightCm: 2 });
  const onCreatePlate = async () => {
    if (!newPlate.widthCm || !newPlate.heightCm) return;
    setCreating(true);
    try {
      await api.post('/api/plates', newPlate);
      await loadPlates();
      toast.success('Plate created');
      setShowCreateModal(false);
    } catch (e) {
      toast.error('Failed to create plate');
    } finally {
      setCreating(false);
    }
  };

  const onRemovePlacement = async (index) => {
    try {
      await api.delete(`/api/plates/${activePlateId}/placements`, { data: { index } });
      toast.success('Placement removed');
      await loadPlate(activePlateId);
    } catch (e) {
      toast.error('Failed to remove placement');
    }
  };

  const onCompletePlate = async () => {
    try {
      await api.put(`/api/plates/${activePlateId}/complete`);
      toast.success('Plate marked completed');
      await loadPlates();
      setActivePlateId('');
      setPlateData(null);
    } catch (e) {
      toast.error('Failed to complete plate');
    }
  };

  const percentage = (value) => (value != null ? value.toFixed(1) + '%' : '—');
  const usedUsablePct = plate && plateData?.stats?.usableArea > 0 ? (plateData.stats.usedArea / plateData.stats.usableArea) * 100 : 0;

  // Orders in Prepress queue
  const fetchPrepressOrders = async () => {
    try {
      const { data } = await api.get('/api/orders?status=In%20Prepress');
      setPrepressOrders(data.orders || []);
    } catch (e) {
      // silent
    }
  };

  // Convert dimension value to cm based on unit
  const toCm = (value, unit) => {
    if (value == null) return 0;
    if (unit === 'cm' || !unit) return Number(value) || 0;
    if (unit === 'mm') return (Number(value) || 0) / 10;
    if (unit === 'inch') return (Number(value) || 0) * 2.54;
    return Number(value) || 0;
  };

  const applyOrderDimensions = (order) => {
    const dims = order?.specifications?.dimensions;
    if (!dims) {
      toast.warning('Order has no dimensions');
      return;
    }
    const unit = dims.unit || 'mm';
    const widthCm = toCm(dims.width, unit) * (parseInt(dims.widthRepeatCount || 1));
    const heightCm = toCm(dims.height, unit) * (parseInt(dims.heightRepeatCount || 1));
    setJobWidth(widthCm ? String(Number(widthCm.toFixed(2))) : '');
    setJobHeight(heightCm ? String(Number(heightCm.toFixed(2))) : '');
  };

  // Open Add Job modal and load orders
  const openAddJobModal = async () => {
    setShowAddJobModal(true);
    setSimulation(null);
    await fetchPrepressOrders();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
            <Squares2X2Icon className="h-8 w-8 mr-3 text-indigo-600" />
            Plate Monitoring
          </h1>
          <p className="text-gray-600 mt-1">Position jobs efficiently and minimize plate waste</p>
        </div>
        <div className="flex space-x-3 items-center">
          <select
            className="border rounded px-3 py-2 bg-white"
            value={activePlateId}
            onChange={(e) => setActivePlateId(e.target.value)}
          >
            <option value="">Select active plate…</option>
            {plates.map((p) => (
              <option key={p._id} value={p._id}>
                {(p.name || 'Plate')} — {p.widthCm}×{p.heightCm} cm
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4 mr-2" /> New Plate
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {plate && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <ChartBarIcon className="h-6 w-6 text-indigo-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Used of usable area</p>
                <p className="text-lg font-semibold text-gray-900">{percentage(usedUsablePct)}</p>
              </div>
            </div>
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${Math.min(100, usedUsablePct)}%` }}></div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <ArrowsPointingInIcon className="h-6 w-6 text-emerald-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-lg font-semibold text-gray-900">{(plateData.stats.remainingArea / 10000).toFixed(2)} m²</p>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <RectangleGroupIcon className="h-6 w-6 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Placements</p>
                <p className="text-lg font-semibold text-gray-900">{plate.placements.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg p-5">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-500">Estimated waste (margins)</p>
                <p className="text-lg font-semibold text-gray-900">{percentage(plateData.stats.wastePct)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {plate && (
        <div className="space-y-6">
          {/* Visualization (full width) */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900">Current Plate</h3>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-start mr-10 ml-10">
              <div className="w-full overflow-auto">
                <PlateCanvas plate={plate} placements={plate.placements} previewPlacement={simulation?.position || null} />
              </div>
              <div className="w-full md:w-60 flex flex-col gap-3 items-start justify-start min-h-[340px]">
                <button
                  onClick={openAddJobModal}
                  className="w-56 px-8 py-5 bg-amber-500 hover:bg-amber-600 text-white rounded-md inline-flex items-center text-base font-medium whitespace-nowrap justify-start text-left"
                >
                  <PlusIcon className="h-5 w-5 mr-2" /> Add Job
                </button>
                <button
                  onClick={openPlacementsPanel}
                  className="w-56 px-8 py-5 bg-slate-700 hover:bg-slate-800 text-white rounded-md inline-flex items-center text-base font-medium whitespace-nowrap justify-start text-left"
                >
                  <RectangleGroupIcon className="h-5 w-5 mr-2" /> Placements
                </button>
                <button
                  onClick={onCompletePlate}
                  className="w-56 px-8 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md inline-flex items-center text-base font-medium whitespace-nowrap justify-start text-left"
                >
                  <CheckCircleIcon className="h-5 w-5 mr-2" /> Complete Plate
                </button>
              </div>
            </div>
            {simulation && (
              <div className="mt-3 text-sm">
                {simulation.fits ? (
                  <span className="text-emerald-700">Fits at ({simulation.position.xCm}, {simulation.position.yCm}) cm{simulation.position.rotated ? ' with rotation' : ''}</span>
                ) : (
                  <span className="text-red-600">Does not fit</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Plate Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Plate</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input className="w-full border rounded px-3 py-2" value={newPlate.name} onChange={(e) => setNewPlate({ ...newPlate, name: e.target.value })} placeholder="Optional" />
                </div>
                <div className="hidden md:block"></div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={newPlate.widthCm} onChange={(e) => setNewPlate({ ...newPlate, widthCm: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={newPlate.heightCm} onChange={(e) => setNewPlate({ ...newPlate, heightCm: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Left Margin (cm)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={newPlate.marginLeftCm} onChange={(e) => setNewPlate({ ...newPlate, marginLeftCm: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Right Margin (cm)</label>
                  <input type="number" className="w-full border rounded px-3 py-2" value={newPlate.marginRightCm} onChange={(e) => setNewPlate({ ...newPlate, marginRightCm: Number(e.target.value) })} />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Cancel</button>
                <button onClick={onCreatePlate} disabled={creating} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">{creating ? 'Creating…' : 'Create Plate'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {showAddJobModal && plate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-xl shadow-lg rounded-md bg-white">
            <div className="mt-1">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add/Simulate Job</h3>
              {/* Order selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select order in Prepress</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-white"
                  value={selectedOrderId}
                  onChange={(e) => {
                    const id = e.target.value; setSelectedOrderId(id);
                    const ord = prepressOrders.find(o => o._id === id);
                    if (ord) applyOrderDimensions(ord);
                  }}
                >
                  <option value="">— Choose an order (optional) —</option>
                  {prepressOrders.map(o => (
                    <option key={o._id} value={o._id}>
                      #{o.orderNumber} — {o.title || 'Untitled'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Selecting an order auto-fills dimensions (converted to cm and multiplied by repeats).</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                  <input className="w-full border rounded px-3 py-2" value={jobWidth} onChange={(e) => setJobWidth(e.target.value)} placeholder="e.g. 100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input className="w-full border rounded px-3 py-2" value={jobHeight} onChange={(e) => setJobHeight(e.target.value)} placeholder="e.g. 50" />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setShowAddJobModal(false)} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">Close</button>
                <button onClick={onSimulate} className="px-4 py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600">Simulate</button>
                <button onClick={onCommit} disabled={!simulation?.fits} className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50">Commit</button>
              </div>
              {simulation && (
                <div className="mt-3 p-3 rounded bg-gray-50 text-sm">
                  {simulation.fits ? (
                    <span className="text-emerald-700">Fits at ({simulation.position.xCm}, {simulation.position.yCm}) cm{simulation.position.rotated ? ' with rotation' : ''}</span>
                  ) : (
                    <span className="text-red-600">Does not fit</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Placements Slide-over with smooth transition */}
      {placementsPanelMounted && plate && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className={`absolute inset-0 bg-gray-900/30 transition-opacity duration-300 ${placementsPanelOpen ? 'opacity-100' : 'opacity-0'} pointer-events-auto`} onClick={closePlacementsPanel}></div>
          <aside className={`absolute right-0 top-0 h-full w-[360px] bg-white shadow-xl border-l p-6 flex flex-col transform transition-transform duration-300 ${placementsPanelOpen ? 'translate-x-0' : 'translate-x-full'} pointer-events-auto`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Placements</h3>
              <button onClick={closePlacementsPanel} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="text-xs text-gray-500 mb-2">{plate.placements.length} total</div>
            <div className="space-y-3 overflow-auto">
              {plate.placements.length === 0 ? (
                <div className="text-sm text-gray-500">No placements yet.</div>
              ) : (
                plate.placements.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.widthCm} × {p.heightCm} cm {p.rotated ? '(rot)' : ''}</div>
                      <div className="text-xs text-gray-600">at ({p.xCm}, {p.yCm}) cm</div>
                    </div>
                    <button onClick={() => onRemovePlacement(idx)} className="text-red-600 hover:text-red-700 inline-flex items-center text-xs">
                      <TrashIcon className="h-4 w-4 mr-1" /> Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default PlateMonitoring;


