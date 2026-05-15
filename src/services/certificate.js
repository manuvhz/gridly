const formatDate = () =>
  new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date());

export const downloadCertificate = async ({ user, title, code = "GRIDLY" }) => {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  doc.setFillColor(6, 19, 15);
  doc.rect(0, 0, width, height, "F");

  doc.setDrawColor(52, 211, 153);
  doc.setLineWidth(4);
  doc.roundedRect(38, 38, width - 76, height - 76, 18, 18);

  doc.setFillColor(15, 118, 110);
  doc.circle(width - 118, 116, 44, "F");
  doc.setFillColor(22, 163, 74);
  doc.circle(width - 162, 152, 20, "F");

  doc.setTextColor(110, 231, 183);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.text("GRIDLY", 74, 112);

  doc.setTextColor(226, 255, 241);
  doc.setFontSize(17);
  doc.setFont("helvetica", "normal");
  doc.text("Universidad de Córdoba · Licenciatura en Informática", 74, 142);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(44);
  doc.text("Certificado de logro", width / 2, 226, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(18);
  doc.setTextColor(190, 224, 209);
  doc.text("Se certifica que", width / 2, 278, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(34);
  doc.setTextColor(255, 255, 255);
  doc.text(user.name, width / 2, 326, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(17);
  doc.setTextColor(190, 224, 209);
  doc.text("ha completado satisfactoriamente", width / 2, 368, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(110, 231, 183);
  doc.text(title, width / 2, 408, { align: "center", maxWidth: width - 170 });

  doc.setDrawColor(52, 211, 153);
  doc.line(120, height - 142, 300, height - 142);
  doc.line(width - 300, height - 142, width - 120, height - 142);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(190, 224, 209);
  doc.text("Manuel Vargas", 210, height - 118, { align: "center" });
  doc.text("Gridly Learning System", width - 210, height - 118, { align: "center" });

  doc.setFontSize(11);
  doc.text(`Emitido el ${formatDate()} · Codigo: ${code}-${Date.now().toString().slice(-6)}`, width / 2, height - 74, {
    align: "center",
  });

  doc.save(`certificado-gridly-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
};
