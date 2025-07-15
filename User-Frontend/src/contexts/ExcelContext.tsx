import axios from "axios";

export const downloadExcel = async (type: string, timePeriod: string) => {
  const response = await axios.get("/api/export", {
    params: { type, timePeriod },
    responseType: "blob",
    withCredentials: true,
  });
  // Create a link and trigger download
  const url = window.URL.createObjectURL(new Blob([response.data as BlobPart]));
  const link = document.createElement("a");
  link.href = url;
  const contentDisposition = response.headers["content-disposition"];
  let fileName = "export.xlsx";
  if (contentDisposition) {
    const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
    if (fileNameMatch && fileNameMatch.length === 2) fileName = fileNameMatch[1];
  }
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
};
