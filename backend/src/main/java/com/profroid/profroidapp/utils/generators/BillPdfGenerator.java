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
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Bill;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.Report;
import com.profroid.profroidapp.reportsubdomain.dataAccessLayer.ReportPart;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.ByteArrayInputStream;
import java.io.FileOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Component
public class BillPdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(BillPdfGenerator.class);

    public byte[] generateBillPdf(Bill bill, String language) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            boolean isFrench = "fr".equalsIgnoreCase(language);
            Locale locale = isFrench ? Locale.FRANCE : Locale.US;

            // Title
            String titleText = isFrench ? "FACTURE" : "INVOICE";
            Paragraph title = new Paragraph(titleText)
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);

            // Bill ID and status
            DeviceRgb statusColor = bill.getStatus() == Bill.BillStatus.PAID 
                    ? new DeviceRgb(34, 197, 94) // Green
                    : new DeviceRgb(239, 68, 68); // Red
            
            String statusLabel = isFrench ? "État: " : "Status: ";
            String statusValue = isFrench ? 
                (bill.getStatus() == Bill.BillStatus.PAID ? "PAYÉE" : "IMPAYÉE") :
                bill.getStatus().toString();
                    
            Paragraph billInfo = new Paragraph()
                    .add(new Paragraph("Bill ID: " + bill.getBillId())
                            .setFontSize(12)
                            .setBold())
                    .add(new Paragraph("\n" + statusLabel)
                            .setFontSize(12))
                    .add(new Paragraph(statusValue)
                            .setFontSize(12)
                            .setBold()
                            .setFontColor(statusColor))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(15);
            document.add(billInfo);

            String dateText = isFrench ? "Date: " : "Date: ";
            String generatedDate = LocalDateTime.now(ZoneId.of("America/Toronto"))
                .format(DateTimeFormatter.ofPattern("d MMMM yyyy", locale));
            document.add(new Paragraph(dateText + generatedDate)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // Company Header
            document.add(new Paragraph("Profroid")
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(5));
            String companySubtitle = isFrench ? "Services de Réfrigération et CVCA" : "Refrigeration & HVAC Services";
            document.add(new Paragraph(companySubtitle)
                    .setFontSize(10)
                    .setMarginBottom(15));

            // Customer Information
            Report report = bill.getReport();
            String billToLabel = isFrench ? "FACTURÉ À:" : "BILL TO:";
            document.add(new Paragraph(billToLabel)
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(5));
            
            String customerName = bill.getCustomer().getFirstName() + " " + bill.getCustomer().getLastName();
            document.add(new Paragraph(customerName)
                    .setFontSize(11)
                    .setMarginBottom(2));
            
            if (bill.getCustomer().getCustomerAddress() != null) {
                String address = bill.getCustomer().getCustomerAddress().getStreetAddress();
                String city = bill.getCustomer().getCustomerAddress().getCity();
                String province = bill.getCustomer().getCustomerAddress().getProvince();
                String postalCode = bill.getCustomer().getCustomerAddress().getPostalCode();
                
                if (address != null) document.add(new Paragraph(address).setFontSize(9));
                if (city != null && province != null) {
                    document.add(new Paragraph(city + ", " + province + " " + (postalCode != null ? postalCode : ""))
                            .setFontSize(9));
                }
            }
            
            document.add(new Paragraph("").setMarginBottom(15));

            // Service Details Header
            String serviceDetailsLabel = isFrench ? "DÉTAILS DU SERVICE" : "SERVICE DETAILS";
            document.add(new Paragraph(serviceDetailsLabel)
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(10));

            // Service Info Table
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1.5f, 2.5f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(15);
            
            String appointmentIdLabel = isFrench ? "ID du Rendez-vous" : "Appointment ID";
            String appointmentDateLabel = isFrench ? "Date du Rendez-vous" : "Appointment Date";
            String serviceTypeLabel = isFrench ? "Type de Service" : "Service Type";
            String reportIdLabel = isFrench ? "ID du Rapport" : "Report ID";
            String technicianLabel = isFrench ? "Technicien" : "Technician";
            
            addInfoRow(infoTable, appointmentIdLabel, bill.getAppointment().getAppointmentIdentifier().getAppointmentId());
            
            String appointmentDateFormatted = bill.getAppointment().getAppointmentDate()
                .format(DateTimeFormatter.ofPattern("d MMMM yyyy", locale));
            addInfoRow(infoTable, appointmentDateLabel, appointmentDateFormatted);
            
            String jobName = report.getAppointment().getJob().getJobName();
            addInfoRow(infoTable, serviceTypeLabel, jobName);
            addInfoRow(infoTable, reportIdLabel, report.getReportIdentifier().getReportId());
            addInfoRow(infoTable, technicianLabel, report.getAppointment().getTechnician().getFirstName() + " " + report.getAppointment().getTechnician().getLastName());
            document.add(infoTable);

            // Labor Charges
            Table laborTable = new Table(UnitValue.createPercentArray(new float[]{3f, 1f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(15);
            
            DeviceRgb headerBg = new DeviceRgb(156, 27, 27); // Profroid red
            String laborChargesLabel = isFrench ? "FRAIS DE MAIN-D'ŒUVRE" : "LABOR CHARGES";
            addSectionHeader(laborTable, laborChargesLabel, headerBg);
            
            BigDecimal hourlyRate = BigDecimal.valueOf(report.getAppointment().getJob().getHourlyRate());
            BigDecimal laborCost = report.getHoursWorked().multiply(hourlyRate);
            
            String hourlyRateLabel = isFrench ? "Taux horaire: $" : "Hourly Rate: $";
            String hoursLabel = isFrench ? " heures" : " hours";
            String hourlyRateText = hourlyRateLabel + formatDecimal(hourlyRate) + " × " + formatDecimal(report.getHoursWorked()) + hoursLabel;
            
            String additionalFeesLabel = isFrench ? "Frais supplémentaires (Frais)" : "Additional Fees (Frais)";
            String travelFeesLabel = isFrench ? "Frais de Déplacement" : "Travel Fees (Frais de Déplacement)";
            
            addMoneyRow(laborTable, hourlyRateText, laborCost);
            addMoneyRow(laborTable, additionalFeesLabel, report.getFrais());
            addMoneyRow(laborTable, travelFeesLabel, report.getFraisDeplacement());
            document.add(laborTable);

            // Parts Used
            if (report.getReportParts() != null && !report.getReportParts().isEmpty()) {
                Table partsTable = new Table(UnitValue.createPercentArray(new float[]{2f, 0.7f, 0.8f, 1f}))
                        .setWidth(UnitValue.createPercentValue(100))
                        .setMarginBottom(15);
                
                String partsUsedLabel = isFrench ? "PIÈCES UTILISÉES" : "PARTS USED";
                addSectionHeader(partsTable, partsUsedLabel, headerBg);
                
                // Parts header row
                DeviceRgb lightGray = new DeviceRgb(243, 244, 246);
                String partNameLabel = isFrench ? "Nom de la Pièce" : "Part Name";
                String qtyLabel = isFrench ? "Qté" : "Qty";
                String priceLabel = isFrench ? "Prix" : "Price";
                String totalLabel = isFrench ? "Total" : "Total";
                
                partsTable.addCell(new Cell().add(new Paragraph(partNameLabel).setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setPadding(5));
                partsTable.addCell(new Cell().add(new Paragraph(qtyLabel).setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setTextAlignment(TextAlignment.CENTER).setPadding(5));
                partsTable.addCell(new Cell().add(new Paragraph(priceLabel).setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setTextAlignment(TextAlignment.RIGHT).setPadding(5));
                partsTable.addCell(new Cell().add(new Paragraph(totalLabel).setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setTextAlignment(TextAlignment.RIGHT).setPadding(5));

                var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
                for (ReportPart part : report.getReportParts()) {
                    String partName = part.getPart() != null ? part.getPart().getName() : (isFrench ? "Pièce Inconnue" : "Unknown Part");
                    BigDecimal price = part.getPart() != null ? part.getPart().getPrice() : BigDecimal.ZERO;
                    BigDecimal total = price.multiply(BigDecimal.valueOf(part.getQuantity()));
                    
                    partsTable.addCell(new Cell().add(new Paragraph(partName).setFontSize(9))
                            .setBorder(border).setPadding(5));
                    partsTable.addCell(new Cell().add(new Paragraph(String.valueOf(part.getQuantity())).setFontSize(9))
                            .setTextAlignment(TextAlignment.CENTER).setBorder(border).setPadding(5));
                    partsTable.addCell(new Cell().add(new Paragraph(formatMoney(price)).setFontSize(9))
                            .setTextAlignment(TextAlignment.RIGHT).setBorder(border).setPadding(5));
                    partsTable.addCell(new Cell().add(new Paragraph(formatMoney(total)).setFontSize(9))
                            .setTextAlignment(TextAlignment.RIGHT).setBorder(border).setPadding(5));
                }
                document.add(partsTable);
            }

            // Totals Summary
            Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{2.5f, 1f}))
                    .setWidth(UnitValue.createPercentValue(60))
                    .setMarginLeft(240)
                    .setMarginBottom(20);
            
            var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
            
            String subtotalLabel = isFrench ? "Sous-total" : "Subtotal";
            totalsTable.addCell(new Cell().add(new Paragraph(subtotalLabel).setFontSize(11))
                    .setBorder(border).setPadding(5));
            totalsTable.addCell(new Cell().add(new Paragraph(formatMoney(report.getSubtotal())).setFontSize(11))
                    .setTextAlignment(TextAlignment.RIGHT).setBorder(border).setPadding(5));
            
            totalsTable.addCell(new Cell().add(new Paragraph("TPS (5%)").setFontSize(11))
                    .setBorder(border).setPadding(5));
            totalsTable.addCell(new Cell().add(new Paragraph(formatMoney(report.getTpsAmount())).setFontSize(11))
                    .setTextAlignment(TextAlignment.RIGHT).setBorder(border).setPadding(5));
            
            totalsTable.addCell(new Cell().add(new Paragraph("TVQ (9.975%)").setFontSize(11))
                    .setBorder(border).setPadding(5));
            totalsTable.addCell(new Cell().add(new Paragraph(formatMoney(report.getTvqAmount())).setFontSize(11))
                    .setTextAlignment(TextAlignment.RIGHT).setBorder(border).setPadding(5));
            
            DeviceRgb totalBg = new DeviceRgb(220, 220, 220);
            String totalAmountDueLabel = isFrench ? "MONTANT TOTAL DÛ" : "TOTAL AMOUNT DUE";
            totalsTable.addCell(new Cell().add(new Paragraph(totalAmountDueLabel).setBold().setFontSize(12))
                    .setBackgroundColor(totalBg).setBorder(border).setPadding(8));
            totalsTable.addCell(new Cell().add(new Paragraph(formatMoney(bill.getAmount())).setBold().setFontSize(12))
                    .setTextAlignment(TextAlignment.RIGHT).setBackgroundColor(totalBg).setBorder(border).setPadding(8));
            
            document.add(totalsTable);

            // Payment Information
            if (bill.getStatus() == Bill.BillStatus.PAID && bill.getPaidAt() != null) {
                DeviceRgb paidBg = new DeviceRgb(220, 252, 231); // Light green
                String paidLabel = isFrench ? "✓ PAYÉE" : "✓ PAID";
                String paymentReceivedLabel = isFrench ? "Paiement reçu le: " : "Payment received on: ";
                String paidAtDate = bill.getPaidAt().format(DateTimeFormatter.ofPattern("d MMMM yyyy", locale));
                
                Paragraph paidInfo = new Paragraph()
                        .add(new Paragraph(paidLabel).setBold().setFontSize(14).setFontColor(new DeviceRgb(34, 197, 94)))
                        .add(new Paragraph("\n" + paymentReceivedLabel + paidAtDate)
                                .setFontSize(10))
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBackgroundColor(paidBg)
                        .setPadding(10)
                        .setMarginBottom(15);

                document.add(paidInfo);
            } else {
                DeviceRgb unpaidBg = new DeviceRgb(254, 226, 226); // Light red
                String paymentDueLabel = isFrench ? "PAIEMENT DÛ" : "PAYMENT DUE";
                Paragraph unpaidInfo = new Paragraph(paymentDueLabel)
                        .setBold()
                        .setFontSize(12)
                        .setFontColor(new DeviceRgb(239, 68, 68))
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBackgroundColor(unpaidBg)
                        .setPadding(10)
                        .setMarginBottom(15);
                document.add(unpaidInfo);
            }

            // Footer
            document.add(new Paragraph("\n"));
            String thankYouLabel = isFrench ? "Merci de votre patronage!" : "Thank you for your business!";
            document.add(new Paragraph(thankYouLabel)
                    .setFontSize(11)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5));
            String questionsLabel = isFrench ? "Pour des questions concernant cette facture, veuillez nous contacter." : "For questions about this invoice, please contact us.";
            document.add(new Paragraph(questionsLabel)
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(10));
            String generatedLabel = isFrench ? "Cette facture a été générée automatiquement." : "This is a computer-generated invoice.";
            document.add(new Paragraph(generatedLabel)
                    .setFontSize(8)
                    .setItalic()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setFontColor(ColorConstants.GRAY));

            document.close();
            return outputStream.toByteArray();
        } catch (Exception e) {
            log.error("Error generating bill PDF: {}", e.getMessage(), e);
            throw new RuntimeException("Error generating bill PDF: " + e.getMessage(), e);
        }
    }

        public StoredFile generateAndStoreBillPdf(Bill bill, FileService fileService, String language) {
                byte[] pdf = generateBillPdf(bill, language);
                String filename = "bill_" + bill.getBillId() + ".pdf";
                MultipartFile mf = new InMemoryMultipartFile(filename, filename, "application/pdf", pdf);
                return fileService.upload(mf, FileOwnerType.BILL, bill.getBillId(), FileCategory.BILL);
        }
        
        public StoredFile generateAndStoreBillPdf(Bill bill, FileService fileService) {
                return generateAndStoreBillPdf(bill, fileService, "en");
        }

    private void addInfoRow(Table t, String label, String value) {
        var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
        t.addCell(new Cell().add(new Paragraph(label).setBold().setFontSize(10))
                .setBorder(border).setPadding(5));
        t.addCell(new Cell().add(new Paragraph(nullSafe(value)).setFontSize(10))
                .setBorder(border).setPadding(5));
    }

    private void addSectionHeader(Table t, String text, DeviceRgb bg) {
        t.addCell(new Cell(1, 4)
                .add(new Paragraph(text).setBold().setFontColor(ColorConstants.WHITE).setFontSize(11))
                .setBackgroundColor(bg)
                .setTextAlignment(TextAlignment.LEFT)
                .setPadding(8));
    }

    private void addMoneyRow(Table t, String label, BigDecimal value) {
        var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
        t.addCell(new Cell().add(new Paragraph(label).setFontSize(10))
                .setBorder(border).setPadding(5));
        t.addCell(new Cell().add(new Paragraph(formatMoney(value)).setFontSize(10))
                .setTextAlignment(TextAlignment.RIGHT).setBorder(border).setPadding(5));
    }

    private String nullSafe(String s) { 
        return s == null ? "" : s; 
    }
    
    private String formatMoney(BigDecimal v) { 
        return v == null ? "$0.00" : String.format("$%.2f", v); 
    }
    
    private String formatDecimal(BigDecimal v) {
        return v == null ? "0" : v.stripTrailingZeros().toPlainString();
    }

        // In-memory MultipartFile for storage
        private static class InMemoryMultipartFile implements MultipartFile {
                private final byte[] content;
                private final String filename;
                private final String contentType;
                private final String name;

                InMemoryMultipartFile(String name, String filename, String contentType, byte[] content) {
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
                        try (FileOutputStream fos = new FileOutputStream(dest)) {
                                fos.write(content);
                        }
                }
        }
}
