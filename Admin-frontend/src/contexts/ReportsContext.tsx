import axios from "axios";

export const downloadAdminExcel = async (fromDept: string, toDept: string, timePeriod: string) => {
  const response = await axios.get("/api/admin/reports/export", {
    params: { fromDept, toDept, timePeriod },
    responseType: "blob",
    withCredentials: true,
  });
  const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
  const link = document.createElement("a");
  link.href = url;
  const contentDisposition = response.headers["content-disposition"];
  let fileName = "admin_reports.xlsx";
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
  }
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};