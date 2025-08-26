import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Filter, Building, User, 
  CheckCircle, XCircle, Edit, Trash2, Eye, Calendar, Tag, 
  ArrowRight, ArrowLeft, Package, Monitor, Smartphone, Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itServicesApi } from '../services/itServicesApi';

import UserDropdown from '../components/UserDropdown';
import DarkModeToggle from '../components/DarkModeToggle';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const ITAssets = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });

  const [formData, setFormData] = useState({
    asset_tag: '',
    name: '',
    type: '',
    model: '',
    serial_number: '',
    manufacturer: '',
    purchase_date: '',
    warranty_expiry: '',
    location: '',
    notes: ''
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [assetsData, employeesData] = await Promise.all([
        itServicesApi.assets.getAll(filters),
        // You would need to implement this API call to get employees
        Promise.resolve({ data: [] })
      ]);

      setAssets(assetsData.data || []);
      setEmployees(employeesData.data || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showError('Error', 'Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const assetData = {
        ...formData,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null
      };

      if (editingAsset) {
        await itServicesApi.assets.update(editingAsset.id, assetData);
        success('Success', 'Asset updated successfully!');
      } else {
        await itServicesApi.assets.create(assetData);
        success('Success', 'Asset created successfully!');
      }

      setShowForm(false);
      setEditingAsset(null);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Error submitting asset:', err);
      showError('Error', 'Failed to submit asset. Please try again.');
    }
  };

  const handleEdit = (asset) => {
    setEditingAsset(asset);
    setFormData({
      asset_tag: asset.asset_tag,
      name: asset.name,
      type: asset.type,
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      manufacturer: asset.manufacturer || '',
      purchase_date: asset.purchase_date || '',
      warranty_expiry: asset.warranty_expiry || '',
      location: asset.location || '',
      notes: asset.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await itServicesApi.assets.delete(id);
        success('Success', 'Asset deleted successfully!');
        fetchData();
      } catch (err) {
        console.error('Error deleting asset:', err);
        showError('Error', 'Failed to delete asset. Please try again.');
      }
    }
  };

  const handleAssign = async (assetId, employeeId) => {
    try {
      await itServicesApi.assets.assign(assetId, employeeId, user.id);
      success('Success', 'Asset assigned successfully!');
      fetchData();
    } catch (err) {
      console.error('Error assigning asset:', err);
      showError('Error', 'Failed to assign asset. Please try again.');
    }
  };

  const handleReturn = async (assetId) => {
    try {
      await itServicesApi.assets.return(assetId, user.id);
      success('Success', 'Asset returned successfully!');
      fetchData();
    } catch (err) {
      console.error('Error returning asset:', err);
      showError('Error', 'Failed to return asset. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      asset_tag: '',
      name: '',
      type: '',
      model: '',
      serial_number: '',
      manufacturer: '',
      purchase_date: '',
      warranty_expiry: '',
      location: '',
      notes: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'retired': return 'bg-gray-100 text-gray-800';
      case 'lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'laptop':
      case 'computer':
      case 'desktop':
        return <Monitor className="w-5 h-5" />;
      case 'mobile':
      case 'phone':
      case 'smartphone':
        return <Smartphone className="w-5 h-5" />;
      case 'printer':
      case 'scanner':
        return <Printer className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const canEdit = (asset) => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'it_manager';
  };

  const canDelete = (asset) => {
    return userProfile?.role === 'admin' || 
           userProfile?.role === 'it_manager';
  };

  if (loading) {
    return (
      <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
        
        <div className="ml-80 p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)" }}>
      
      <div className="ml-80 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">IT Assets</h1>
            <p className="text-gray-600">Manage IT assets and track assignments</p>
          </div>
          <div className="flex items-center space-x-4">
            <DarkModeToggle />
            <UserDropdown />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Assets</p>
                  <p className="text-2xl font-bold text-gray-900">{assets.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assets.filter(a => a.status === 'available').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assets.filter(a => a.status === 'assigned').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Package className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maintenance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {assets.filter(a => a.status === 'maintenance').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search assets..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-64"
                  />
                </div>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="retired">Retired</option>
                  <option value="lost">Lost</option>
                </select>

                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="laptop">Laptop</option>
                  <option value="desktop">Desktop</option>
                  <option value="mobile">Mobile</option>
                  <option value="printer">Printer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {canEdit({}) && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Asset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Asset Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">
                  {editingAsset ? 'Edit Asset' : 'New IT Asset'}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowForm(false);
                    setEditingAsset(null);
                    resetForm();
                  }}
                >
                  <XCircle className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="asset_tag">Asset Tag *</Label>
                    <Input
                      id="asset_tag"
                      value={formData.asset_tag}
                      onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                      required
                      placeholder="e.g., IT-001"
                    />
                  </div>

                  <div>
                    <Label htmlFor="name">Asset Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Dell Latitude Laptop"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="type">Asset Type *</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Type</option>
                      <option value="laptop">Laptop</option>
                      <option value="desktop">Desktop</option>
                      <option value="mobile">Mobile</option>
                      <option value="printer">Printer</option>
                      <option value="scanner">Scanner</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="model">Model</Label>
                    <Input
                      id="model"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g., Latitude 5520"
                    />
                  </div>

                  <div>
                    <Label htmlFor="serial_number">Serial Number</Label>
                    <Input
                      id="serial_number"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      placeholder="e.g., ABC123XYZ"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="manufacturer">Manufacturer</Label>
                    <Input
                      id="manufacturer"
                      value={formData.manufacturer}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      placeholder="e.g., Dell, HP, Lenovo"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., IT Department, Floor 3"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="purchase_date">Purchase Date</Label>
                    <Input
                      id="purchase_date"
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
                    <Input
                      id="warranty_expiry"
                      type="date"
                      value={formData.warranty_expiry}
                      onChange={(e) => setFormData({ ...formData, warranty_expiry: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    placeholder="Additional notes about the asset..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingAsset(null);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    {editingAsset ? 'Update Asset' : 'Create Asset'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Assets List */}
        <Card>
          <CardHeader>
            <CardHeader>IT Assets</CardHeader>
          </CardHeader>
          <CardContent>
            {assets.length === 0 ? (
              <div className="text-center py-8">
                <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No assets found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assets.map((asset) => (
                  <motion.div
                    key={asset.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {getTypeIcon(asset.type)}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {asset.name}
                            </h3>
                            <p className="text-sm text-gray-500">{asset.asset_tag}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
                            {asset.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                          {asset.model && (
                            <div className="flex items-center space-x-1">
                              <Tag className="w-4 h-4" />
                              <span>{asset.model}</span>
                            </div>
                          )}
                          {asset.manufacturer && (
                            <div className="flex items-center space-x-1">
                              <Building className="w-4 h-4" />
                              <span>{asset.manufacturer}</span>
                            </div>
                          )}
                          {asset.location && (
                            <div className="flex items-center space-x-1">
                              <Tag className="w-4 h-4" />
                              <span>{asset.location}</span>
                            </div>
                          )}
                          {asset.purchase_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Purchased: {new Date(asset.purchase_date).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {asset.assigned_employee && (
                          <div className="flex items-center space-x-1 text-sm text-blue-600 mb-2">
                            <User className="w-4 h-4" />
                            <span>Assigned to: {asset.assigned_employee.full_name}</span>
                          </div>
                        )}

                        {asset.notes && (
                          <p className="text-gray-600 text-sm">{asset.notes}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {asset.status === 'available' && canEdit(asset) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAssign(asset.id, user.id)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Assign
                          </Button>
                        )}
                        
                        {asset.status === 'assigned' && asset.assigned_to === user.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReturn(asset.id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Return
                          </Button>
                        )}

                        {canEdit(asset) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(asset)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {canDelete(asset) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(asset.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ITAssets;
