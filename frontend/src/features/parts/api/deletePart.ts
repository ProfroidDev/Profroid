import axiosInstance from "../../../shared/api/axiosInstance";

export async function deletePart(partId: string): Promise<void> {
    await axiosInstance.delete(`/parts/${partId}`);
}