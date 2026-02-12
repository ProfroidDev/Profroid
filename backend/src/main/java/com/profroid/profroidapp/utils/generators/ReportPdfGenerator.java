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
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class ReportPdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(ReportPdfGenerator.class);

    public byte[] generateReportPdf(ReportResponseModel report, String language) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            boolean isFrench = "fr".equalsIgnoreCase(language);
            Locale locale = isFrench ? Locale.FRANCE : Locale.US;

            String titleText = isFrench ? "Rapport de Service" : "Service Report";
            Paragraph title = new Paragraph(titleText)
                    .setFontSize(20)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);

            String generatedOnLabel = isFrench ? "Généré le: " : "Generated on: ";
            String generatedDate = LocalDateTime.now(ZoneId.of("America/Toronto"))
                .format(DateTimeFormatter.ofPattern("d MMMM yyyy - HH:mm", locale));
            document.add(new Paragraph(generatedOnLabel + generatedDate)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(15));

            // Report + Appointment info
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1.2f, 2.8f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(10);
            
            String reportIdLabel = isFrench ? "ID du Rapport" : "Report ID";
            String appointmentLabel = isFrench ? "Rendez-vous" : "Appointment";
            String dateLabel = isFrench ? "Date" : "Date";
            String statusLabel = isFrench ? "État" : "Status";
            
            // Translate appointment status
            String statusValue = report.getAppointmentStatus();
            if (isFrench && statusValue != null) {
                statusValue = statusValue.equals("COMPLETED") ? "Complété" : 
                             statusValue.equals("SCHEDULED") ? "Planifié" : 
                             statusValue.equals("CANCELLED") ? "Annulé" : statusValue;
            }
            
            addInfoRow(infoTable, reportIdLabel, report.getReportId());
            addInfoRow(infoTable, appointmentLabel, report.getAppointmentId());
            addInfoRow(infoTable, dateLabel, report.getAppointmentDate());
            addInfoRow(infoTable, statusLabel, statusValue);
            document.add(infoTable);

            // Customer + Technician
            Table ctTable = new Table(UnitValue.createPercentArray(new float[]{1.2f, 2.8f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(10);
            
            String customerLabel = isFrench ? "Client" : "Customer";
            String phoneLabel = isFrench ? "Téléphone" : "Phone";
            String technicianLabel = isFrench ? "Technicien" : "Technician";
            String jobLabel = isFrench ? "Travail" : "Job";
            
            // Use French job name if available
            String jobName = isFrench && report.getJobNameFr() != null ? report.getJobNameFr() : report.getJobName();
            
            addInfoRow(ctTable, customerLabel, report.getCustomerFirstName() + " " + report.getCustomerLastName());
            addInfoRow(ctTable, phoneLabel, report.getCustomerPhone() != null ? report.getCustomerPhone() : "");
            addInfoRow(ctTable, technicianLabel, report.getTechnicianFirstName() + " " + report.getTechnicianLastName());
            addInfoRow(ctTable, jobLabel, jobName);
            document.add(ctTable);

            // Costs summary
            Table costTable = new Table(UnitValue.createPercentArray(new float[]{2f, 1f}))
                    .setWidth(UnitValue.createPercentValue(60))
                    .setMarginBottom(12);
            
            String hourlyRateLabel = isFrench ? "Taux horaire" : "Hourly Rate";
            String hoursWorkedLabel = isFrench ? "Heures travaillées" : "Hours Worked";
            String laborCostLabel = isFrench ? "Coût du travail" : "Labor Cost";
            String fraisLabel = isFrench ? "Frais" : "Frais";
            String travelLabel = isFrench ? "Déplacement" : "Travel";
            
            addMoneyRow(costTable, hourlyRateLabel, report.getHourlyRate());
            addMoneyRow(costTable, hoursWorkedLabel, report.getHoursWorked());
            addMoneyRow(costTable, laborCostLabel, report.getLaborCost());
            addMoneyRow(costTable, fraisLabel, report.getFrais());
            addMoneyRow(costTable, travelLabel, report.getFraisDeplacement());
            document.add(costTable);

            // Parts table
            if (report.getParts() != null && !report.getParts().isEmpty()) {
                float[] widths = {1.3f, 2.4f, 0.8f, 1.0f, 1.1f};
                Table parts = new Table(UnitValue.createPercentArray(widths))
                        .setWidth(UnitValue.createPercentValue(100))
                        .setMarginBottom(12);
                DeviceRgb headerBg = new DeviceRgb(156, 27, 27);
                
                String partIdLabel = isFrench ? "ID Pièce" : "Part ID";
                String partNameLabel = isFrench ? "Nom" : "Name";
                String qtyLabel = isFrench ? "Qté" : "Qty";
                String priceLabel = isFrench ? "Prix" : "Price";
                String totalLabel = isFrench ? "Total" : "Total";
                
                addHeader(parts, partIdLabel, headerBg);
                addHeader(parts, partNameLabel, headerBg);
                addHeader(parts, qtyLabel, headerBg);
                addHeader(parts, priceLabel, headerBg);
                addHeader(parts, totalLabel, headerBg);

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
            
            String subtotalLabel = isFrench ? "Sous-total" : "Subtotal";
            String totalLabel = isFrench ? "Total" : "Total";
            
            addMoneyRow(totals, subtotalLabel, report.getSubtotal());
            addMoneyRow(totals, "TPS (5%)", report.getTpsAmount());
            addMoneyRow(totals, "TVQ (9.975%)", report.getTvqAmount());
            addMoneyRow(totals, totalLabel, report.getTotal());
            document.add(totals);

            String notesLabel = isFrench ? "Notes: Ce rapport a été généré automatiquement." : "Notes: This report was generated automatically.";
            document.add(new Paragraph("\n" + notesLabel).setFontSize(9));

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating report PDF: " + e.getMessage(), e);
        }
    }

    public StoredFile generateAndStoreReportPdf(ReportResponseModel report, FileService fileService, String language) {
        byte[] pdf = generateReportPdf(report, language);
        String filename = "report_" + report.getReportId() + ".pdf";
        MultipartFile mf = new InMemoryMultipartFile(
            filename, filename, "application/pdf", pdf
        );
        return fileService.upload(mf, FileOwnerType.REPORT, report.getReportId(), FileCategory.REPORT);
    }
    
    public StoredFile generateAndStoreReportPdf(ReportResponseModel report, FileService fileService) {
        return generateAndStoreReportPdf(report, fileService, "en");
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
