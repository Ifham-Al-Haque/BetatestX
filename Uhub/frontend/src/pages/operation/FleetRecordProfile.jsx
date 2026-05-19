import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VehicleDetailsModal from '../../components/fleet/VehicleDetailsModal';

const FleetRecordProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <VehicleDetailsModal
      variant="page"
      vehicleId={id}
      isOpen
      listPath="/operation/fleet-records"
      onClose={() => navigate('/operation/fleet-records')}
    />
  );
};

export default FleetRecordProfile;
