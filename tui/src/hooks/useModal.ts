import { useModalStore } from "../stores/modalStore.js";

export function useModal() {
  return useModalStore();
}
