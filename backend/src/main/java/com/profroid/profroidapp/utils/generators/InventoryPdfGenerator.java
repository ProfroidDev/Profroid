package com.profroid.profroidapp.utils.generators;

import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.profroid.profroidapp.partsubdomain.presentationLayer.PartResponseModel;
import com.profroid.profroidapp.filesubdomain.businessLayer.FileService;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileCategory;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.FileOwnerType;
import com.profroid.profroidapp.filesubdomain.dataAccessLayer.StoredFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class InventoryPdfGenerator {

    private static final Logger log = LoggerFactory.getLogger(InventoryPdfGenerator.class);

    public byte[] generateInventoryPdf(List<PartResponseModel> parts) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        
        try {
            PdfWriter writer = new PdfWriter(outputStream);
            PdfDocument pdfDocument = new PdfDocument(writer);
            Document document = new Document(pdfDocument);
            
            // Add title
            Paragraph title = new Paragraph("Inventory Report")
                    .setFontSize(24)
                    .setBold()
                    .setTextAlignment(TextAlignment.CENTER);
            document.add(title);
            
            // Add generation date
            String generatedDate = LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("MMMM dd, yyyy - HH:mm:ss"));
            Paragraph dateInfo = new Paragraph("Generated on: " + generatedDate)
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER)
                    .setMarginBottom(20);
            document.add(dateInfo);
            
            // Add summary statistics
            Paragraph summary = new Paragraph()
                    .add("Total Items: " + parts.size())
                    .setFontSize(11)
                    .setMarginBottom(15);
            document.add(summary);
            
            // Create table
            float[] columnWidths = {1.5f, 2, 1.5f, 1.5f, 1.5f, 1.5f, 1.2f};
            Table table = new Table(UnitValue.createPercentArray(columnWidths));
            table.setWidth(UnitValue.createPercentValue(100));
            
            // Add header row
            String[] headers = {"Part ID", "Name", "Category", "Quantity", "Price", "Supplier", "Status"};
            DeviceRgb headerBackground = new DeviceRgb(156, 27, 27); // #9C1B1B
            
            for (String header : headers) {
                Cell headerCell = new Cell()
                        .add(new Paragraph(header)
                                .setFontSize(10)
                                .setBold())
                        .setBackgroundColor(headerBackground)
                        .setFontColor(ColorConstants.WHITE)
                        .setTextAlignment(TextAlignment.CENTER)
                        .setPadding(8)
                        .setBorder(new SolidBorder(ColorConstants.LIGHT_GRAY, 1));
                table.addHeaderCell(headerCell);
            }
            
            // Add data rows
            for (PartResponseModel part : parts) {
                addTableRow(table, part);
            }
            
            document.add(table);
            
            // Add footer
            Paragraph footer = new Paragraph()
                    .setMarginTop(20)
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.CENTER)
                    .add("This is an automatically generated report. For questions, contact your system administrator.");
            document.add(footer);
            
            document.close();
            
            return outputStream.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF: " + e.getMessage(), e);
        }
    }

    public InventoryPdfResult generateAndStoreInventoryPdf(List<PartResponseModel> parts, FileService fileService) {
        log.debug("Generating and storing inventory PDF for {} parts", parts.size());
        byte[] pdfContent = generateInventoryPdf(parts);
        String filename = buildFilename();
        log.debug("Generated PDF filename: {}", filename);
        StoredFile storedFile = storePdfInFileService(pdfContent, fileService, filename);
        log.info("Successfully stored PDF in MinIO: bucket={}, key={}", storedFile.getBucket(), storedFile.getObjectKey());
        return new InventoryPdfResult(pdfContent, storedFile, filename);
    }
    
    private void addTableRow(Table table, PartResponseModel part) {
        DeviceRgb statusColor = getStatusColor(part.getStatus());
        Border cellBorder = new SolidBorder(ColorConstants.LIGHT_GRAY, 1);
        
        // Part ID
        Cell cell1 = new Cell()
                .add(new Paragraph(part.getPartId() != null ? part.getPartId() : "").setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(6)
                .setBorder(cellBorder);
        table.addCell(cell1);
        
        // Name
        Cell cell2 = new Cell()
                .add(new Paragraph(part.getName() != null ? part.getName() : "").setFontSize(9))
                .setPadding(6)
                .setBorder(cellBorder);
        table.addCell(cell2);
        
        // Category
        Cell cell3 = new Cell()
                .add(new Paragraph(part.getCategory() != null ? part.getCategory() : "").setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(6)
                .setBorder(cellBorder);
        table.addCell(cell3);
        
        // Quantity
        Cell cell4 = new Cell()
                .add(new Paragraph(part.getQuantity() != null ? part.getQuantity().toString() : "0").setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(6)
                .setBorder(cellBorder);
        table.addCell(cell4);
        
        // Price
        String priceStr = part.getPrice() != null ? String.format("$%.2f", part.getPrice()) : "$0.00";
        Cell cell5 = new Cell()
                .add(new Paragraph(priceStr).setFontSize(9))
                .setTextAlignment(TextAlignment.RIGHT)
                .setPadding(6)
                .setBorder(cellBorder);
        table.addCell(cell5);
        
        // Supplier
        Cell cell6 = new Cell()
                .add(new Paragraph(part.getSupplier() != null ? part.getSupplier() : "").setFontSize(9))
                .setPadding(6)
                .setBorder(cellBorder);
        table.addCell(cell6);
        
        // Status
        Cell cell7 = new Cell()
                .add(new Paragraph(part.getStatus() != null ? part.getStatus() : "Unknown").setFontSize(9).setFontColor(ColorConstants.WHITE))
                .setBackgroundColor(statusColor)
                .setTextAlignment(TextAlignment.CENTER)
                .setPadding(6)
                .setBorder(cellBorder);
        table.addCell(cell7);
    }
    
    private DeviceRgb getStatusColor(String status) {
        if (status == null) {
            return new DeviceRgb(156, 27, 27); // Red
        }
        
        return switch (status) {
            case "In Stock" -> new DeviceRgb(34, 197, 94); // Green
            case "Low Stock" -> new DeviceRgb(251, 146, 60); // Orange
            case "Out of Stock" -> new DeviceRgb(239, 68, 68); // Red
            default -> new DeviceRgb(156, 27, 27); // Default red
        };
    }
    
    public StoredFile storePdfInFileService(byte[] pdfContent, FileService fileService) {
        return storePdfInFileService(pdfContent, fileService, buildFilename());
    }

    public StoredFile storePdfInFileService(byte[] pdfContent, FileService fileService, String filename) {
        try {
            log.debug("Storing PDF file: {}, size: {} bytes", filename, pdfContent.length);
            
            // Create a mock MultipartFile from the byte array
            MultipartFile file = new InMemoryMultipartFile(
                    filename,
                    filename,
                    "application/pdf",
                    pdfContent
            );
            
            // Store in file service
            StoredFile stored = fileService.upload(
                    file,
                    FileOwnerType.SYSTEM,
                    "inventory",
                    FileCategory.REPORT
            );
            
            log.info("PDF stored successfully with ID: {}", stored.getId());
            return stored;
        } catch (Exception e) {
            log.error("Error storing PDF in file service", e);
            throw new RuntimeException("Error storing PDF in file service: " + e.getMessage(), e);
        }
    }

    private String buildFilename() {
        return "inventory_report_" + LocalDate.now() + ".pdf";
    }
    
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
        public String getName() {
            return name;
        }
        
        @Override
        public String getOriginalFilename() {
            return filename;
        }
        
        @Override
        public String getContentType() {
            return contentType;
        }
        
        @Override
        public boolean isEmpty() {
            return content.length == 0;
        }
        
        @Override
        public long getSize() {
            return content.length;
        }
        
        @Override
        public byte[] getBytes() {
            return content;
        }
        
        @Override
        public java.io.InputStream getInputStream() {
            return new ByteArrayInputStream(content);
        }
        
        @Override
        public void transferTo(java.io.File dest) throws java.io.IOException {
            try (java.io.FileOutputStream fos = new java.io.FileOutputStream(dest)) {
                fos.write(content);
            }
        }
    }

    public record InventoryPdfResult(byte[] pdfContent, StoredFile storedFile, String filename) {}
}

