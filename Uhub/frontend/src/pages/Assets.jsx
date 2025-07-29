// src/pages/Assets.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Monitor, Laptop, Smartphone, Server, Printer, Network, 
  Search, Filter, Plus, Edit, Trash, User, Calendar, 
  CheckCircle, AlertTriangle, Clock, DollarSign 
} from "lucide-react";
import { supabase } from "../supabaseClient";
import Sidebar from "../components/Sidebar";
import UserDropdown from "../components/UserDropdown";
import DarkModeToggle from "../components/DarkModeToggle";

export default function Assets() {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    status: "In Stock",
    assigned_to: "",
    serial_number: "",
    purchase_date: "",
    warranty_expiry: "",
    purchase_price: "",
    location: "",
    notes: ""
  });

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    const { data, error } = await supabase
      .from("assets")
      .select(`
        id, name, type, status, created_at, assigned_to,
        employees (full_name, employee_id)
      `);

    if (error) {
      console.error("Error fetching assets:", error.message);
    } else {
      const enriched = data.map((asset) => ({
        ...asset,
        employee_name: asset.employees?.full_name,
        employee_id: asset.employees?.employee_id,
        // Add default values for new fields that don't exist in DB yet
        serial_number: asset.serial_number || '',
        purchase_date: asset.purchase_date || '',
        warranty_expiry: asset.warranty_expiry || '',
        purchase_price: asset.purchase_price || '',
        location: asset.location || '',
        notes: asset.notes || ''
      }));
      setAssets(enriched);
    }
    setLoading(false);
  }

  async function fetchEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, employee_id");
    
    if (!error) {
      setEmployees(data);
    }
  }

  async function handleDelete(id) {
    const confirmDelete = window.confirm("Are you sure you want to delete this asset?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("assets").delete().eq("id", id);
    if (error) {
      alert("Delete failed: " + error.message);
    } else {
      fetchAssets();
    }
  }

  function handleEdit(asset) {
    setEditingAsset(asset);
    setFormData({
      name: asset.name || "",
      type: asset.type || "",
      status: asset.status || "In Stock",
      assigned_to: asset.assigned_to || "",
      serial_number: asset.serial_number || "",
      purchase_date: asset.purchase_date || "",
      warranty_expiry: asset.warranty_expiry || "",
      purchase_price: asset.purchase_price || '',
      location: asset.location || '',
      notes: asset.notes || ""
    });
    setShowForm(true);
  }

  function handleAddNew() {
    setEditingAsset(null);
    setFormData({
      name: "",
      type: "",
      status: "In Stock",
      assigned_to: "",
      serial_number: "",
      purchase_date: "",
      warranty_expiry: "",
      purchase_price: "",
      location: "",
      notes: ""
    });
    setShowForm(true);
  }

  async function handleFormSubmit(e) {
    e.preventDefault();

    const payload = {
      name: formData.name,
      type: formData.type,
      status: formData.status,
      assigned_to: formData.assigned_to || null,
      // Only include fields that exist in the database
      // serial_number: formData.serial_number,
      // purchase_date: formData.purchase_date,
      // warranty_expiry: formData.warranty_expiry,
      // purchase_price: formData.purchase_price,
      // location: formData.location,
      // notes: formData.notes
    };

    if (editingAsset) {
      const { error } = await supabase
        .from("assets")
        .update(payload)
        .eq("id", editingAsset.id);

      if (error) {
        alert("Update failed: " + error.message);
      }
    } else {
      const { error } = await supabase.from("assets").insert(payload);
      if (error) {
        alert("Add failed: " + error.message);
      }
    }

    setShowForm(false);
    fetchAssets();
  }

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.type.toLowerCase().includes(search.toLowerCase()) ||
      a.serial_number?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesType = typeFilter ? a.type === typeFilter : true;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate statistics
  const stats = {
    total: assets.length,
    inStock: assets.filter(a => a.status === "In Stock").length,
    assigned: assets.filter(a => a.status === "Assigned").length,
    retired: assets.filter(a => a.status === "Retired").length,
    totalValue: assets.reduce((sum, a) => sum + (Number(a.purchase_price) || 0), 0)
  };

  const getAssetIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'laptop': return <Laptop className="w-6 h-6" />;
      case 'desktop': return <Monitor className="w-6 h-6" />;
      case 'phone': return <Smartphone className="w-6 h-6" />;
      case 'server': return <Server className="w-6 h-6" />;
      case 'printer': return <Printer className="w-6 h-6" />;
      case 'network': return <Network className="w-6 h-6" />;
      default: return <Monitor className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Stock': return 'bg-green-100 text-green-800 border-green-200';
      case 'Assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Retired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color }) => (
    <motion.div
      className="bg-white p-6 rounded-xl shadow border border-gray-200 hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      <div className="flex">
        <Sidebar />
        <main className="flex-1 ml-64 p-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Monitor className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Asset Management</h1>
                <p className="text-gray-600">Track and manage IT assets and equipment</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <DarkModeToggle />
              <UserDropdown />
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={Monitor}
              title="Total Assets"
              value={stats.total}
              subtitle="All equipment"
              color="text-blue-600"
            />
            <StatCard
              icon={CheckCircle}
              title="In Stock"
              value={stats.inStock}
              subtitle="Available"
              color="text-green-600"
            />
            <StatCard
              icon={User}
              title="Assigned"
              value={stats.assigned}
              subtitle="In use"
              color="text-purple-600"
            />
            <StatCard
              icon={DollarSign}
              title="Total Value"
              value={`AED ${stats.totalValue.toLocaleString()}`}
              subtitle="Asset worth"
              color="text-orange-600"
            />
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="In Stock">In Stock</option>
                  <option value="Assigned">Assigned</option>
                  <option value="Retired">Retired</option>
                </select>
                <select
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="">All Types</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Desktop">Desktop</option>
                  <option value="Phone">Phone</option>
                  <option value="Server">Server</option>
                  <option value="Printer">Printer</option>
                  <option value="Network">Network</option>
                </select>
              </div>
              <button
                onClick={handleAddNew}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Asset
              </button>
            </div>
          </div>

          {/* Asset Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-8"
              >
                <h3 className="text-xl font-semibold mb-4">
                  {editingAsset ? "Edit Asset" : "Add New Asset"}
                </h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Asset Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Type (e.g., Laptop)"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      required
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Retired">Retired</option>
                    </select>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Employee</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.full_name} ({emp.employee_id})
                        </option>
                      ))}
                    </select>
                    {/* Temporarily hidden - will be enabled when database schema is updated
                    <input
                      type="text"
                      placeholder="Serial Number"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="text"
                      placeholder="Location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="date"
                      placeholder="Purchase Date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="date"
                      placeholder="Warranty Expiry"
                      value={formData.warranty_expiry}
                      onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Purchase Price (AED)"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    */}
                  </div>
                  {/* Temporarily hidden - will be enabled when database schema is updated
                  <textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  */}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                    >
                      {editingAsset ? "Update Asset" : "Add Asset"}
                    </button>
                    <button
                      type="button"
                      className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-2 rounded-lg transition-colors"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Assets Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset, index) => (
                <motion.div
                  key={asset.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {getAssetIcon(asset.type)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{asset.name}</h3>
                          <p className="text-sm text-gray-500">{asset.type}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(asset.status)}`}>
                        {asset.status}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      {/* Temporarily hidden - will be enabled when database schema is updated
                      {asset.serial_number && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Serial:</span> {asset.serial_number}
                        </p>
                      )}
                      */}
                      {asset.employee_name && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Assigned to:</span> {asset.employee_name}
                        </p>
                      )}
                      {/* Temporarily hidden - will be enabled when database schema is updated
                      {asset.location && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Location:</span> {asset.location}
                        </p>
                      )}
                      {asset.purchase_price && (
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Value:</span> AED {Number(asset.purchase_price).toLocaleString()}
                        </p>
                      )}
                      */}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {new Date(asset.created_at).toLocaleDateString()}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(asset)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && filteredAssets.length === 0 && (
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No assets found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
