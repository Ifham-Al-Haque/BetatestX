import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Clock, User, AlertCircle, CheckCircle, 
  Save, Loader2, ArrowLeft, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { itServicesApi } from '../services/itServicesApi';
import { Card, CardContent, CardHeader } from '../components/ui/card';
import Button from '../components/ui/button';
import Input from '../components/ui/input';
import Label from '../components/ui/label';
import Textarea from '../components/ui/textarea';

const ITRequestForm = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [categories, setCategories] = useState([]);
  const [priorities, setPriorities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    priority_id: '',
    request_type: 'it_service',
    estimated_completion_date: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      
      const [categoriesData, prioritiesData] = await Promise.all([
        itServicesApi.categories.getAll().catch(err => {
          console.error('Error fetching categories:', err);
          return [];
        }),
        itServicesApi.priorities.getAll().catch(err => {
          console.error('Error fetching priorities:', err);
          return [];
        })
      ]);

      setCategories(categoriesData);
      setPriorities(prioritiesData);
    } catch (err) {
      console.error('Error fetching form data:', err);
      showError('Error', 'Failed to load form data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    if (!formData.priority_id) {
      newErrors.priority_id = 'Priority is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const requestData = {
        ...formData,
        requester_id: user?.id,
        estimated_completion_date: formData.estimated_completion_date || null
      };

      const newRequest = await itServicesApi.requests.create(requestData);
      
      success('Request Submitted', 'Your IT request has been submitted successfully!');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category_id: '',
        priority_id: '',
        request_type: 'it_service',
        estimated_completion_date: ''
      });
      
    } catch (err) {
      console.error('Error submitting request:', err);
      showError('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Submit IT Request</h1>
                <p className="text-sm text-gray-600">Create a new IT service request</p>
              </div>
            </div>
            
            <Button
              variant="ghost"
              onClick={() => window.history.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                  <p className="text-sm text-gray-600">Please provide details about your IT request</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                    Request Title *
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Brief description of your request"
                    className={`mt-1 ${errors.title ? 'border-red-500' : ''}`}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    placeholder="Please provide detailed information about your request..."
                    className={`mt-1 ${errors.description ? 'border-red-500' : ''}`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                </div>

                {/* Category and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="category_id" className="text-sm font-medium text-gray-700">
                      Category *
                    </Label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={formData.category_id}
                      onChange={handleInputChange}
                      className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.category_id ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    {errors.category_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="priority_id" className="text-sm font-medium text-gray-700">
                      Priority *
                    </Label>
                    <select
                      id="priority_id"
                      name="priority_id"
                      value={formData.priority_id}
                      onChange={handleInputChange}
                      className={`mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.priority_id ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select priority level</option>
                      {priorities.map(priority => (
                        <option key={priority.id} value={priority.id}>
                          {priority.name} ({priority.sla_hours}h SLA)
                        </option>
                      ))}
                    </select>
                    {errors.priority_id && (
                      <p className="mt-1 text-sm text-red-600">{errors.priority_id}</p>
                    )}
                  </div>
                </div>

                {/* Request Type and Estimated Date */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="request_type" className="text-sm font-medium text-gray-700">
                      Request Type
                    </Label>
                    <select
                      id="request_type"
                      name="request_type"
                      value={formData.request_type}
                      onChange={handleInputChange}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="it_service">IT Service</option>
                      <option value="hardware">Hardware</option>
                      <option value="software">Software</option>
                      <option value="access">Access</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="estimated_completion_date" className="text-sm font-medium text-gray-700">
                      Preferred Completion Date
                    </Label>
                    <Input
                      id="estimated_completion_date"
                      name="estimated_completion_date"
                      type="date"
                      value={formData.estimated_completion_date}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ITRequestForm;
