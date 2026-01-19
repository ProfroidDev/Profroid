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
import java.time.format.DateTimeFormatter;

@Component
public class BillPdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(BillPdfGenerator.class);

    public byte[] generateBillPdf(Bill bill) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        try {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);

            // Title
            Paragraph title = new Paragraph("INVOICE")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);

            // Bill ID and status
            DeviceRgb statusColor = bill.getStatus() == Bill.BillStatus.PAID 
                    ? new DeviceRgb(34, 197, 94) // Green
                    : new DeviceRgb(239, 68, 68); // Red
                    
            Paragraph billInfo = new Paragraph()
                    .add(new Paragraph("Bill ID: " + bill.getBillId())
                            .setFontSize(12)
                            .setBold())
                    .add(new Paragraph("\nStatus: ")
                            .setFontSize(12))
                    .add(new Paragraph(bill.getStatus().toString())
                            .setFontSize(12)
                            .setBold()
                            .setFontColor(statusColor))
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(15);
            document.add(billInfo);

            String generatedDate = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
            document.add(new Paragraph("Date: " + generatedDate)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20));

            // Company Header
            document.add(new Paragraph("Profroid")
                    .setFontSize(16)
                    .setBold()
                    .setMarginBottom(5));
            document.add(new Paragraph("Refrigeration & HVAC Services")
                    .setFontSize(10)
                    .setMarginBottom(15));

            // Customer Information
            Report report = bill.getReport();
            document.add(new Paragraph("BILL TO:")
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
            document.add(new Paragraph("SERVICE DETAILS")
                    .setFontSize(12)
                    .setBold()
                    .setMarginBottom(10));

            // Service Info Table
            Table infoTable = new Table(UnitValue.createPercentArray(new float[]{1.5f, 2.5f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(15);
            addInfoRow(infoTable, "Appointment ID", bill.getAppointment().getAppointmentIdentifier().getAppointmentId());
            addInfoRow(infoTable, "Appointment Date", bill.getAppointment().getAppointmentDate().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")));
            addInfoRow(infoTable, "Service Type", report.getAppointment().getJob().getJobName());
            addInfoRow(infoTable, "Report ID", report.getReportIdentifier().getReportId());
            addInfoRow(infoTable, "Technician", report.getAppointment().getTechnician().getFirstName() + " " + report.getAppointment().getTechnician().getLastName());
            document.add(infoTable);

            // Labor Charges
            Table laborTable = new Table(UnitValue.createPercentArray(new float[]{3f, 1f}))
                    .setWidth(UnitValue.createPercentValue(100))
                    .setMarginBottom(15);
            
            DeviceRgb headerBg = new DeviceRgb(156, 27, 27); // Profroid red
            addSectionHeader(laborTable, "LABOR CHARGES", headerBg);
            
            BigDecimal hourlyRate = BigDecimal.valueOf(report.getAppointment().getJob().getHourlyRate());
            BigDecimal laborCost = report.getHoursWorked().multiply(hourlyRate);
            addMoneyRow(laborTable, "Hourly Rate: $" + formatDecimal(hourlyRate) + " × " + formatDecimal(report.getHoursWorked()) + " hours", laborCost);
            addMoneyRow(laborTable, "Additional Fees (Frais)", report.getFrais());
            addMoneyRow(laborTable, "Travel Fees (Frais de Déplacement)", report.getFraisDeplacement());
            document.add(laborTable);

            // Parts Used
            if (report.getReportParts() != null && !report.getReportParts().isEmpty()) {
                Table partsTable = new Table(UnitValue.createPercentArray(new float[]{2f, 0.7f, 0.8f, 1f}))
                        .setWidth(UnitValue.createPercentValue(100))
                        .setMarginBottom(15);
                
                addSectionHeader(partsTable, "PARTS USED", headerBg);
                
                // Parts header row
                DeviceRgb lightGray = new DeviceRgb(243, 244, 246);
                partsTable.addCell(new Cell().add(new Paragraph("Part Name").setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setPadding(5));
                partsTable.addCell(new Cell().add(new Paragraph("Qty").setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setTextAlignment(TextAlignment.CENTER).setPadding(5));
                partsTable.addCell(new Cell().add(new Paragraph("Price").setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setTextAlignment(TextAlignment.RIGHT).setPadding(5));
                partsTable.addCell(new Cell().add(new Paragraph("Total").setBold().setFontSize(10))
                        .setBackgroundColor(lightGray).setTextAlignment(TextAlignment.RIGHT).setPadding(5));

                var border = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
                for (ReportPart part : report.getReportParts()) {
                    String partName = part.getPart() != null ? part.getPart().getName() : "Unknown Part";
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
            
            totalsTable.addCell(new Cell().add(new Paragraph("Subtotal").setFontSize(11))
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
            totalsTable.addCell(new Cell().add(new Paragraph("TOTAL AMOUNT DUE").setBold().setFontSize(12))
                    .setBackgroundColor(totalBg).setBorder(border).setPadding(8));
            totalsTable.addCell(new Cell().add(new Paragraph(formatMoney(bill.getAmount())).setBold().setFontSize(12))
                    .setTextAlignment(TextAlignment.RIGHT).setBackgroundColor(totalBg).setBorder(border).setPadding(8));
            
            document.add(totalsTable);

            // Payment Information
            if (bill.getStatus() == Bill.BillStatus.PAID && bill.getPaidAt() != null) {
                DeviceRgb paidBg = new DeviceRgb(220, 252, 231); // Light green
                Paragraph paidInfo = new Paragraph()
                        .add(new Paragraph("✓ PAID").setBold().setFontSize(14).setFontColor(new DeviceRgb(34, 197, 94)))
                        .add(new Paragraph("\nPayment received on: " + bill.getPaidAt().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy")))
                                .setFontSize(10))
                        .setTextAlignment(TextAlignment.CENTER)
                        .setBackgroundColor(paidBg)
                        .setPadding(10)
                        .setMarginBottom(15);
                document.add(paidInfo);
            } else {
                DeviceRgb unpaidBg = new DeviceRgb(254, 226, 226); // Light red
                Paragraph unpaidInfo = new Paragraph("PAYMENT DUE")
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
            document.add(new Paragraph("Thank you for your business!")
                    .setFontSize(11)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(5));
            document.add(new Paragraph("For questions about this invoice, please contact us.")
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(10));
            document.add(new Paragraph("This is a computer-generated invoice.")
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

        public StoredFile generateAndStoreBillPdf(Bill bill, FileService fileService) {
                byte[] pdf = generateBillPdf(bill);
                String filename = "bill_" + bill.getBillId() + ".pdf";
                MultipartFile mf = new InMemoryMultipartFile(filename, filename, "application/pdf", pdf);
                return fileService.upload(mf, FileOwnerType.BILL, bill.getBillId(), FileCategory.BILL);
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
