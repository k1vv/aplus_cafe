package com.apluscafe.service;

import com.apluscafe.entity.Order;
import com.apluscafe.entity.OrderItem;
import com.apluscafe.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReceiptService {

    private final OrderRepository orderRepository;

    private static final float MARGIN = 50;
    private static final float LINE_HEIGHT = 14;
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd MMM yyyy, h:mm a");

    public byte[] generateReceipt(Long orderId, Long userId) throws IOException {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        // Verify ownership
        if (!order.getUser().getId().equals(userId)) {
            throw new RuntimeException("Order not found");
        }

        try (PDDocument document = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float pageWidth = page.getMediaBox().getWidth();
                float yPosition = page.getMediaBox().getHeight() - MARGIN;

                // Header
                PDType1Font boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                PDType1Font regularFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);

                // Restaurant Name
                yPosition = drawCenteredText(contentStream, "APlus Cafe", boldFont, 24, pageWidth, yPosition);
                yPosition -= 5;
                yPosition = drawCenteredText(contentStream, "Order Receipt", regularFont, 12, pageWidth, yPosition);
                yPosition -= 20;

                // Divider
                yPosition = drawLine(contentStream, MARGIN, pageWidth - MARGIN, yPosition);
                yPosition -= 15;

                // Order Info
                yPosition = drawText(contentStream, "Order #" + order.getId(), boldFont, 12, MARGIN, yPosition);
                yPosition -= 5;
                yPosition = drawText(contentStream, "Date: " + order.getCreatedAt().format(DATE_FORMAT), regularFont, 10, MARGIN, yPosition);
                yPosition -= 5;
                yPosition = drawText(contentStream, "Status: " + order.getStatus().toString().replace("_", " "), regularFont, 10, MARGIN, yPosition);
                yPosition -= 5;
                yPosition = drawText(contentStream, "Type: " + order.getOrderType().toString().replace("_", " "), regularFont, 10, MARGIN, yPosition);
                yPosition -= 20;

                // Customer Info
                yPosition = drawText(contentStream, "Customer Information", boldFont, 12, MARGIN, yPosition);
                yPosition -= 5;
                yPosition = drawText(contentStream, "Name: " + order.getUser().getFullName(), regularFont, 10, MARGIN, yPosition);
                yPosition -= 5;
                yPosition = drawText(contentStream, "Email: " + order.getUser().getEmail(), regularFont, 10, MARGIN, yPosition);
                if (order.getUser().getPhone() != null) {
                    yPosition -= 5;
                    yPosition = drawText(contentStream, "Phone: " + order.getUser().getPhone(), regularFont, 10, MARGIN, yPosition);
                }
                yPosition -= 20;

                // Divider
                yPosition = drawLine(contentStream, MARGIN, pageWidth - MARGIN, yPosition);
                yPosition -= 15;

                // Items Header
                yPosition = drawText(contentStream, "Order Items", boldFont, 12, MARGIN, yPosition);
                yPosition -= 10;

                // Column headers
                float col1 = MARGIN;
                float col2 = MARGIN + 50;
                float col3 = pageWidth - MARGIN - 100;
                float col4 = pageWidth - MARGIN - 50;

                contentStream.setFont(boldFont, 10);
                drawTextAt(contentStream, "Qty", col1, yPosition);
                drawTextAt(contentStream, "Item", col2, yPosition);
                drawTextAt(contentStream, "Price", col3, yPosition);
                drawTextAt(contentStream, "Total", col4, yPosition);
                yPosition -= 5;
                yPosition = drawLine(contentStream, MARGIN, pageWidth - MARGIN, yPosition);
                yPosition -= 10;

                // Items
                contentStream.setFont(regularFont, 10);
                for (OrderItem item : order.getOrderItems()) {
                    drawTextAt(contentStream, String.valueOf(item.getQuantity()), col1, yPosition);
                    drawTextAt(contentStream, truncate(item.getMenu().getName(), 35), col2, yPosition);
                    drawTextAt(contentStream, formatPrice(item.getUnitPrice()), col3, yPosition);
                    drawTextAt(contentStream, formatPrice(item.getSubtotal()), col4, yPosition);
                    yPosition -= LINE_HEIGHT;
                }

                yPosition -= 10;
                yPosition = drawLine(contentStream, MARGIN, pageWidth - MARGIN, yPosition);
                yPosition -= 15;

                // Totals
                float labelX = pageWidth - MARGIN - 150;
                float valueX = pageWidth - MARGIN - 50;

                contentStream.setFont(regularFont, 10);
                drawTextAt(contentStream, "Subtotal:", labelX, yPosition);
                drawTextAt(contentStream, formatPrice(order.getSubtotal()), valueX, yPosition);
                yPosition -= LINE_HEIGHT;

                if (order.getServiceCharge() != null && order.getServiceCharge().compareTo(BigDecimal.ZERO) > 0) {
                    drawTextAt(contentStream, "SST (6%):", labelX, yPosition);
                    drawTextAt(contentStream, formatPrice(order.getServiceCharge()), valueX, yPosition);
                    yPosition -= LINE_HEIGHT;
                }

                if (order.getDeliveryFee() != null && order.getDeliveryFee().compareTo(BigDecimal.ZERO) > 0) {
                    drawTextAt(contentStream, "Delivery Fee:", labelX, yPosition);
                    drawTextAt(contentStream, formatPrice(order.getDeliveryFee()), valueX, yPosition);
                    yPosition -= LINE_HEIGHT;
                }

                yPosition -= 5;
                contentStream.setFont(boldFont, 12);
                drawTextAt(contentStream, "Total:", labelX, yPosition);
                drawTextAt(contentStream, formatPrice(order.getTotalAmount()), valueX, yPosition);
                yPosition -= 25;

                // Footer
                yPosition = drawLine(contentStream, MARGIN, pageWidth - MARGIN, yPosition);
                yPosition -= 15;
                yPosition = drawCenteredText(contentStream, "Thank you for your order!", boldFont, 12, pageWidth, yPosition);
                yPosition -= 5;
                yPosition = drawCenteredText(contentStream, "We appreciate your business.", regularFont, 10, pageWidth, yPosition);
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            document.save(baos);
            return baos.toByteArray();
        }
    }

    private float drawText(PDPageContentStream stream, String text, PDType1Font font, float fontSize, float x, float y) throws IOException {
        stream.beginText();
        stream.setFont(font, fontSize);
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
        return y - LINE_HEIGHT;
    }

    private float drawCenteredText(PDPageContentStream stream, String text, PDType1Font font, float fontSize, float pageWidth, float y) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000 * fontSize;
        float x = (pageWidth - textWidth) / 2;
        stream.beginText();
        stream.setFont(font, fontSize);
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
        return y - LINE_HEIGHT;
    }

    private void drawTextAt(PDPageContentStream stream, String text, float x, float y) throws IOException {
        stream.beginText();
        stream.newLineAtOffset(x, y);
        stream.showText(text);
        stream.endText();
    }

    private float drawLine(PDPageContentStream stream, float x1, float x2, float y) throws IOException {
        stream.moveTo(x1, y);
        stream.lineTo(x2, y);
        stream.stroke();
        return y;
    }

    private String formatPrice(BigDecimal price) {
        return "RM " + price.setScale(2).toPlainString();
    }

    private String truncate(String text, int maxLength) {
        if (text.length() <= maxLength) {
            return text;
        }
        return text.substring(0, maxLength - 3) + "...";
    }
}
