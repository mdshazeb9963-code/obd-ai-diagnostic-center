package com.obdai.diagnostic.service;
import com.obdai.diagnostic.api.ApiModels;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;
import java.io.ByteArrayOutputStream;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
@Service
public class PdfReportService {
    public byte[] render(ApiModels.ScanReportDto report) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDFont regular = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            PDFont bold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            Writer w = new Writer(document, regular, bold);
            w.header();
            w.line(bold, 16, "OBD AI  /  DIAGNOSTIC CENTER", 42, new float[]{188,239,126});
            w.line(regular, 9, "VEHICLE DIAGNOSTIC REPORT", 42, new float[]{222,230,221});
            w.gap(13);
            w.section(report.vehicleName() == null ? "Vehicle details unavailable" : report.vehicleName());
            w.line(regular, 9, "File: " + report.fileName() + "     Format: " + report.sourceFormat().toUpperCase()
                + "     Scanned: " + DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'")
                .withZone(ZoneOffset.UTC).format(report.createdAt()), 42, new float[]{85,94,87});
            w.gap(12);
            w.section("VEHICLE HEALTH");
            w.line(bold, 13, report.healthScore() == null ? "Not rated" : report.healthScore() + " / 100", 42, new float[]{66,122,39});
            w.gap(8);
            w.section("SUMMARY");
            w.paragraph(report.summary() == null ? "No summary available." : report.summary(), 42);
            w.gap(8);
            w.section("DETECTED DIAGNOSTIC CODES (" + report.diagnostics().size() + ")");
            for (ApiModels.DiagnosticFinding finding : report.diagnostics()) {
                w.gap(6);
                w.section(finding.code() + "  " + (finding.title() == null ? "Unresolved code" : finding.title()));
                w.line(regular, 8, "Severity: " + (finding.severity() == null ? "UNKNOWN" : finding.severity())
                    + " | Confidence: " + (finding.confidence() == null ? "unavailable" : Math.round(finding.confidence() * 100) + "%")
                    + " | Source: " + (finding.source() == null ? "unavailable" : finding.source()), 49, new float[]{93,101,93});
                w.paragraph(finding.description() == null ? "No verified description is available." : finding.description(), 49);
                if (finding.symptoms() != null && !finding.symptoms().isEmpty()) w.paragraph("Reported symptoms: " + String.join(", ", finding.symptoms()), 49);
                if (finding.causes() != null && !finding.causes().isEmpty()) w.paragraph("Provider-reported possible causes: " + String.join(", ", finding.causes()), 49);
                if (finding.commonFixes() != null && !finding.commonFixes().isEmpty()) w.paragraph("Provider-reported common fixes: " + String.join(", ", finding.commonFixes()), 49);
                if (finding.drivingRecommendation() != null) w.paragraph("Driving guidance: " + finding.drivingRecommendation(), 49);
                if (finding.estimatedCostLow() != null && finding.estimatedCostHigh() != null)
                    w.line(regular, 8, "Provider estimate: " + (finding.currency() == null ? "" : finding.currency() + " ")
                        + finding.estimatedCostLow() + " - " + finding.estimatedCostHigh(), 49, new float[]{83,91,83});
                if (finding.repairProcedure() != null) w.paragraph("Repair procedure: " + finding.repairProcedure(), 49);
            }
            if (report.aiAnalysis() != null && !report.aiAnalysis().isBlank()) {
                w.gap(8); w.section("AI EXPLANATION"); w.paragraph(report.aiAnalysis(), 42);
            }
            w.close();
            document.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("PDF report could not be generated.", e);
        }
    }
    private static final class Writer {
        private final PDDocument document;private final PDFont regular;private final PDFont bold;
        private PDPageContentStream stream;private float y;
        Writer(PDDocument document,PDFont regular,PDFont bold){this.document=document;this.regular=regular;this.bold=bold;}
        void header()throws Exception{
            page(true);stream.setNonStrokingColor(17/255f,24/255f,19/255f);stream.addRect(0,PDRectangle.LETTER.getHeight()-95,PDRectangle.LETTER.getWidth(),95);stream.fill();
            y=PDRectangle.LETTER.getHeight()-48;
        }
        void page(boolean first)throws Exception{
            if(stream!=null)stream.close();
            PDPage page=new PDPage(PDRectangle.LETTER);document.addPage(page);stream=new PDPageContentStream(document,page);
            y=page.getMediaBox().getHeight()-45;
            stream.beginText();stream.setFont(regular,7);stream.setNonStrokingColor(115/255f,123/255f,115/255f);stream.newLineAtOffset(42,28);
            stream.showText("Informational support only. Verify safety-critical decisions with vehicle service information and a qualified technician.");stream.endText();
            if(!first){line(bold,8,"OBD AI  /  DIAGNOSTIC CENTER  -  CONTINUED",42,new float[]{66,92,60});gap(5);}
        }
        void line(PDFont font,float size,String text,float indent,float[] rgb)throws Exception{
            for(String part:wrap(ascii(text),font,size,PDRectangle.LETTER.getWidth()-indent-42)){
                if(y<52)page(false);
                stream.beginText();stream.setFont(font,size);stream.setNonStrokingColor(rgb[0]/255,rgb[1]/255,rgb[2]/255);
                stream.newLineAtOffset(indent,y);stream.showText(part);stream.endText();y-=size+5;
            }
        }
        void section(String text)throws Exception{line(bold,10,text,42,new float[]{50,60,51});}
        void paragraph(String text,float indent)throws Exception{line(regular,8.5f,text,indent,new float[]{83,91,83});}
        void gap(float value){y-=value;}
        void close()throws Exception{if(stream!=null){stream.close();stream=null;}}
        private List<String> wrap(String text,PDFont font,float size,float width)throws Exception{
            List<String> lines=new ArrayList<>();StringBuilder line=new StringBuilder();
            for(String word:text.split("\\s+")){
                if(word.isBlank())continue;String candidate=line.isEmpty()?word:line+" "+word;
                if(!line.isEmpty()&&font.getStringWidth(candidate)*size/1000>width){lines.add(line.toString());line=new StringBuilder(word);}
                else line=new StringBuilder(candidate);
            }
            if(!line.isEmpty())lines.add(line.toString());return lines;
        }
        private String ascii(String value){return value.replaceAll("[^\\x20-\\x7E]","?");}
    }
}
