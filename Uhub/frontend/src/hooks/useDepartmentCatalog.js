import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentCatalogApi } from '../services/departmentCatalogApi';
import { DEPARTMENT_HIERARCHY } from '../config/departmentHierarchy';

export const useDepartmentCatalog = (includeInactive = false) => {
  return useQuery({
    queryKey: ['department-catalog', includeInactive],
    queryFn: () => departmentCatalogApi.getCatalog(includeInactive),
    staleTime: 60 * 1000,
    placeholderData: {
      departments: [],
      branches: [],
      hierarchy: DEPARTMENT_HIERARCHY,
      fromDatabase: false,
    },
  });
};

const invalidateCatalog = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ['department-catalog'] });
  queryClient.invalidateQueries({ queryKey: ['employees'] });
};

export const useDepartmentCatalogMutations = () => {
  const queryClient = useQueryClient();

  const onSuccess = () => invalidateCatalog(queryClient);

  return {
    createDepartment: useMutation({
      mutationFn: departmentCatalogApi.createDepartment,
      onSuccess,
    }),
    updateDepartment: useMutation({
      mutationFn: ({ department, ...payload }) =>
        departmentCatalogApi.updateDepartment(department, payload),
      onSuccess,
    }),
    archiveDepartment: useMutation({
      mutationFn: departmentCatalogApi.archiveDepartment,
      onSuccess,
    }),
    restoreDepartment: useMutation({
      mutationFn: departmentCatalogApi.restoreDepartment,
      onSuccess,
    }),
    deleteDepartment: useMutation({
      mutationFn: departmentCatalogApi.deleteDepartment,
      onSuccess,
    }),
    createBranch: useMutation({
      mutationFn: ({ department, name }) => departmentCatalogApi.createBranch(department, { name }),
      onSuccess,
    }),
    updateBranch: useMutation({
      mutationFn: ({ branch, ...payload }) => departmentCatalogApi.updateBranch(branch, payload),
      onSuccess,
    }),
    archiveBranch: useMutation({
      mutationFn: departmentCatalogApi.archiveBranch,
      onSuccess,
    }),
    restoreBranch: useMutation({
      mutationFn: departmentCatalogApi.restoreBranch,
      onSuccess,
    }),
    deleteBranch: useMutation({
      mutationFn: departmentCatalogApi.deleteBranch,
      onSuccess,
    }),
  };
};
