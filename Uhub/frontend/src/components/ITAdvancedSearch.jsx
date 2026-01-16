import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, X, Save, Bookmark, ChevronDown, ChevronUp,
  FileText, Package, Ticket, Calendar, User, Tag, Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { itServicesApi } from '../services/itServicesApi';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import { useToast } from '../context/ToastContext';

const ITAdvancedSearch = ({ onResultSelect, onClose }) => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('all'); // all, requests, assets, tickets
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    dateFrom: '',
    dateTo: '',
    assignedTo: '',
    department: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedPresets, setSavedPresets] = useState([]);
  const [results, setResults] = useState({
    requests: [],
    assets: [],
    tickets: []
  });
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState(null);

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('it_search_presets');
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading presets:', e);
      }
    }
  }, []);

  // Perform search
  const performSearch = useCallback(async () => {
    if (!searchTerm && !Object.values(filters).some(f => f)) {
      setResults({ requests: [], assets: [], tickets: [] });
      return;
    }

    setLoading(true);
    try {
      const searchFilters = {
        search: searchTerm,
        ...filters
      };

      const promises = [];
      
      if (searchType === 'all' || searchType === 'requests') {
        promises.push(
          itServicesApi.requests.getAll(searchFilters, user?.id, userProfile?.role)
            .then(res => ({ type: 'requests', data: res.data || [] }))
            .catch(err => ({ type: 'requests', data: [], error: err }))
        );
      }
      
      if (searchType === 'all' || searchType === 'assets') {
        promises.push(
          itServicesApi.assets.getAll(searchFilters)
            .then(res => ({ type: 'assets', data: res.data || [] }))
            .catch(err => ({ type: 'assets', data: [], error: err }))
        );
      }
      
      if (searchType === 'all' || searchType === 'tickets') {
        promises.push(
          itServicesApi.tickets.getAll(searchFilters)
            .then(res => ({ type: 'tickets', data: res.data || [] }))
            .catch(err => ({ type: 'tickets', data: [], error: err }))
        );
      }

      const results = await Promise.all(promises);
      const newResults = { requests: [], assets: [], tickets: [] };
      
      results.forEach(result => {
        if (result.type === 'requests') newResults.requests = result.data;
        if (result.type === 'assets') newResults.assets = result.data;
        if (result.type === 'tickets') newResults.tickets = result.data;
      });

      setResults(newResults);
    } catch (err) {
      console.error('Search error:', err);
      showError('Failed to perform search');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, searchType, filters, user?.id, userProfile?.role, showError]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [performSearch]);

  // Save current filter as preset
  const savePreset = () => {
    const presetName = prompt('Enter a name for this filter preset:');
    if (!presetName) return;

    const preset = {
      id: Date.now(),
      name: presetName,
      searchTerm,
      searchType,
      filters,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedPresets, preset];
    setSavedPresets(updated);
    localStorage.setItem('it_search_presets', JSON.stringify(updated));
    success('Filter preset saved successfully');
  };

  // Load preset
  const loadPreset = (preset) => {
    setSearchTerm(preset.searchTerm || '');
    setSearchType(preset.searchType || 'all');
    setFilters(preset.filters || {});
    setActivePreset(preset.id);
    success(`Loaded preset: ${preset.name}`);
  };

  // Delete preset
  const deletePreset = (id) => {
    const updated = savedPresets.filter(p => p.id !== id);
    setSavedPresets(updated);
    localStorage.setItem('it_search_presets', JSON.stringify(updated));
    if (activePreset === id) setActivePreset(null);
    success('Preset deleted');
  };

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilters({
      status: '',
      category: '',
      priority: '',
      dateFrom: '',
      dateTo: '',
      assignedTo: '',
      department: ''
    });
    setActivePreset(null);
  };

  const totalResults = results.requests.length + results.assets.length + results.tickets.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Advanced Search</h2>
              <p className="text-sm text-gray-600 mt-1">Search across IT requests, assets, and tickets</p>
            </div>
            <Button variant="ghost" onClick={onClose} className="p-2">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by title, description, number, or any keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="requests">Requests</option>
              <option value="assets">Assets</option>
              <option value="tickets">Tickets</option>
            </select>
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button onClick={savePreset} variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Preset
            </Button>
          </div>

          {/* Saved Presets */}
          {savedPresets.length > 0 && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">Saved Presets:</span>
              {savedPresets.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className={`px-3 py-1 text-sm rounded-lg flex items-center gap-2 ${
                    activePreset === preset.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Bookmark className="w-3 h-3" />
                  {preset.name}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this preset?')) deletePreset(preset.id);
                    }}
                    className="ml-1 hover:text-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-gray-200 overflow-hidden"
            >
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Status</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full"
                  />
                </div>
                <div className="col-span-2 md:col-span-4 flex justify-end gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No results found. Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Requests Results */}
              {(searchType === 'all' || searchType === 'requests') && results.requests.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Requests ({results.requests.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {results.requests.map(request => (
                      <Card
                        key={request.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onResultSelect && onResultSelect('request', request)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{request.title}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>#{request.request_number || request.id}</span>
                                <span className="capitalize">{request.status}</span>
                                {request.category?.name && (
                                  <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    {request.category.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Assets Results */}
              {(searchType === 'all' || searchType === 'assets') && results.assets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Assets ({results.assets.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {results.assets.map(asset => (
                      <Card
                        key={asset.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onResultSelect && onResultSelect('asset', asset)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{asset.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {asset.asset_tag} • {asset.type}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span className="capitalize">{asset.status}</span>
                                {asset.location && (
                                  <span className="flex items-center gap-1">
                                    <Building className="w-3 h-3" />
                                    {asset.location}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Tickets Results */}
              {(searchType === 'all' || searchType === 'tickets') && results.tickets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Ticket className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tickets ({results.tickets.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {results.tickets.map(ticket => (
                      <Card
                        key={ticket.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => onResultSelect && onResultSelect('ticket', ticket)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{ticket.title}</h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {ticket.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>#{ticket.ticket_number || ticket.id}</span>
                                <span className="capitalize">{ticket.status}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Found {totalResults} result{totalResults !== 1 ? 's' : ''}
          </div>
          <Button onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ITAdvancedSearch;
