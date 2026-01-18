package com.profroid.profroidapp.utils.generators;

import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import com.profroid.profroidapp.reportsubdomain.presentationLayer.ReportResponseModel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Component
public class ReportPdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(ReportPdfGenerator.class);

    public byte[] generateReportPdf(ReportResponseModel report) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            Paragraph title = new Paragraph("Service Report")
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);

            String generatedDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy - HH:mm"));
            document.add(new Paragraph("Generated on: " + generatedDate)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(15));

            // Report + Appointment info
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1.2f, 2.8f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(10);
            addInfoRow(infoTable, "Report ID", report.getReportId());
            addInfoRow(infoTable, "Appointment", report.getAppointmentId());
            addInfoRow(infoTable, "Date", report.getAppointmentDate());
            addInfoRow(infoTable, "Status", report.getAppointmentStatus());
            document.add(infoTable);

            // Customer + Technician
            Table ctTable = new Table(UnitValue.createPercentArray(new float[]{1.2f, 2.8f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(10);
            addInfoRow(ctTable, "Customer", report.getCustomerFirstName() + " " + report.getCustomerLastName());
            addInfoRow(ctTable, "Phone", report.getCustomerPhone() != null ? report.getCustomerPhone() : "");
            addInfoRow(ctTable, "Technician", report.getTechnicianFirstName() + " " + report.getTechnicianLastName());
            addInfoRow(ctTable, "Job", report.getJobName());
            document.add(ctTable);

            // Costs summary
            Table costTable = new Table(UnitValue.createPercentArray(new float[]{2f, 1f}))
                    .setWidth(UnitValue.createPercentValue(60))
                    .setMarginBottom(12);
            addMoneyRow(costTable, "Hourly Rate", report.getHourlyRate());
            addMoneyRow(costTable, "Hours Worked", report.getHoursWorked());
            addMoneyRow(costTable, "Labor Cost", report.getLaborCost());
            addMoneyRow(costTable, "Frais", report.getFrais());
            addMoneyRow(costTable, "Travel", report.getFraisDeplacement());
            document.add(costTable);

            // Parts table
            if (report.getParts() != null && !report.getParts().isEmpty()) {
                float[] widths = {1.3f, 2.4f, 0.8f, 1.0f, 1.1f};
                Table parts = new Table(UnitValue.createPercentArray(widths))
                        .setWidth(UnitValue.createPercentValue(100))
                        .setMarginBottom(12);
                DeviceRgb headerBg = new DeviceRgb(156, 27, 27);
                addHeader(parts, "Part ID", headerBg);
                addHeader(parts, "Name", headerBg);
                addHeader(parts, "Qty", headerBg);
                addHeader(parts, "Price", headerBg);
                addHeader(parts, "Total", headerBg);

                var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
                for (ReportResponseModel.ReportPartResponseModel p : report.getParts()) {
                    parts.addCell(new Cell().add(new Paragraph(nullSafe(p.getPartId())).setFontSize(9)).setBorder(border));
                    parts.addCell(new Cell().add(new Paragraph(nullSafe(p.getPartName())).setFontSize(9)).setBorder(border));
                    parts.addCell(new Cell().add(new Paragraph(String.valueOf(p.getQuantity())).setFontSize(9)).setTextAlignment(TextAlignment.CENTER).setBorder(border));
                    parts.addCell(new Cell().add(new Paragraph(formatMoney(p.getPrice())).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT).setBorder(border));
                    parts.addCell(new Cell().add(new Paragraph(formatMoney(p.getTotalPrice())).setFontSize(9)).setTextAlignment(TextAlignment.RIGHT).setBorder(border));
                }
                document.add(parts);
            }

            // Totals
            Table totals = new Table(UnitValue.createPercentArray(new float[]{2f, 1f}))
                    .setWidth(UnitValue.createPercentValue(60));
            addMoneyRow(totals, "Subtotal", report.getSubtotal());
            addMoneyRow(totals, "TPS (5%)", report.getTpsAmount());
            addMoneyRow(totals, "TVQ (9.975%)", report.getTvqAmount());
            addMoneyRow(totals, "Total", report.getTotal());
            document.add(totals);

            document.add(new Paragraph("\nNotes: This report was generated automatically.").setFontSize(9));

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating report PDF: " + e.getMessage(), e);
        }
    }

    public StoredFile generateAndStoreReportPdf(ReportResponseModel report, FileService fileService) {
        byte[] pdf = generateReportPdf(report);
        String filename = "report_" + report.getReportId() + ".pdf";
        MultipartFile mf = new InMemoryMultipartFile(
            filename, filename, "application/pdf", pdf
        );
        return fileService.upload(mf, FileOwnerType.REPORT, report.getReportId(), FileCategory.REPORT);
    }

    private void addInfoRow(Table t, String label, String value) {
        var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
        t.addCell(new Cell().add(new Paragraph(label).setBold()).setBorder(border));
        t.addCell(new Cell().add(new Paragraph(nullSafe(value))).setBorder(border));
    }

    private void addHeader(Table t, String text, DeviceRgb bg) {
        t.addHeaderCell(new Cell()
                .add(new Paragraph(text).setBold().setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(bg)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(6));
    }

    private void addMoneyRow(Table t, String label, BigDecimal value) {
        var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
        t.addCell(new Cell().add(new Paragraph(label)).setBorder(border));
        t.addCell(new Cell().add(new Paragraph(formatMoney(value))).setTextAlignment(TextAlignment.RIGHT).setBorder(border));
    }

    private String nullSafe(String s) { return s == null ? "" : s; }
    private String formatMoney(BigDecimal v) { return v == null ? "$0.00" : String.format("$%.2f", v); }

    // In-memory MultipartFile implementation
    private static class InMemoryMultipartFile implements MultipartFile {
        private final byte[] content;
        private final String filename;
        private final String contentType;
        private final String name;

        public InMemoryMultipartFile(String name, String filename, String contentType, byte[] content) {
            this.name = name;
            this.filename = filename;
            this.contentType = contentType;
            this.content = content;
        }

        @Override
        public String getName() { return name; }

        @Override
        public String getOriginalFilename() { return filename; }

        @Override
        public String getContentType() { return contentType; }

        @Override
        public boolean isEmpty() { return content.length == 0; }

        @Override
        public long getSize() { return content.length; }

        @Override
        public byte[] getBytes() { return content; }

        @Override
        public java.io.InputStream getInputStream() { return new ByteArrayInputStream(content); }

        @Override
        public void transferTo(java.io.File dest) throws java.io.IOException {
            try (java.io.FileOutputStream fos = new java.io.FileOutputStream(dest)) {
                fos.write(content);
            }
        }
    }
}
