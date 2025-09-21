import { useState, useCallback } from "react";

export const useModal = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setSelectedItem(null);
    setIsSubmitting(false);
  }, []);

  const openEditModal = useCallback((item: any) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  }, []);

  const closeEditModal = useCallback(() => {
    setSelectedItem(null);
    setEditModalOpen(false);
    setIsSubmitting(false);
  }, []);

  const openViewModal = useCallback((item: any) => {
    setSelectedItem(item);
    setViewModalOpen(true);
  }, []);

  const closeViewModal = useCallback(() => {
    setSelectedItem(null);
    setViewModalOpen(false);
  }, []);

  return {
    createModalOpen,
    editModalOpen,
    viewModalOpen,
    selectedItem,
    isSubmitting,
    setIsSubmitting,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openViewModal,
    closeViewModal,
  };
};
