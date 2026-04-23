import { create } from "zustand";
import type React from "react";

export interface ModalState {
  isOpen: boolean;
  modalContent: React.ReactNode;
  modalTitle: string;
}

export interface ModalActions {
  openModal: (content: React.ReactNode, title: string) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState & ModalActions>((set) => ({
  isOpen: false,
  modalContent: null,
  modalTitle: "",

  openModal: (content, title) => {
    set({ isOpen: true, modalContent: content, modalTitle: title });
  },

  closeModal: () => {
    set({ isOpen: false, modalContent: null, modalTitle: "" });
  },
}));
