import { useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AssetForm from "../components/AssetForm";
import { useAsset, useUpdateAsset } from "../hooks/useApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { useToast } from "../context/ToastContext";

export default function AssetEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { success, error: showError } = useToast();
  const { data: asset, isLoading, error } = useAsset(id);
  const updateAssetMutation = useUpdateAsset();

  const handleClose = useCallback(() => {
    navigate(`/assets/${id}`);
  }, [navigate, id]);

  const handleSubmit = useCallback(async (formData) => {
    try {
      await updateAssetMutation.mutateAsync({ id, data: formData });
      success("Success", "Asset updated successfully.");
      navigate(`/assets/${id}`);
    } catch (err) {
      showError("Error", err.message);
    }
  }, [updateAssetMutation, id, navigate, success, showError]);

  if (isLoading) {
    return (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Unable to load asset</h3>
          <p className="text-red-600 dark:text-red-400 mt-1">{error?.message || 'Asset not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <AssetForm
      asset={asset}
      onClose={handleClose}
      onSubmit={handleSubmit}
      isLoading={updateAssetMutation.isLoading}
    />
  );
}


