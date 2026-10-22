package com.obdai.diagnostic.service;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import java.nio.charset.StandardCharsets;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class DtcParserTest {
    private final DtcParser parser=new DtcParser();
    @Test void extractsGenericManufacturerAndFutureShapedCodesWithoutCatalogLookup(){
        String input="Torque export: P0300, P1FFF; chassis C0123; body B2101; network U3000; future P0A1B and P3A1B; invalid PFA1B; repeated p0300";
        var parsed=parser.parse(file("scan.log",input));
        assertEquals(List.of("P0300","P1FFF","C0123","B2101","U3000","P0A1B","P3A1B"),parsed.codes());
    }
    @Test void findsCodesVehicleVinAndMileageInCsvJsonXmlAndPlainText(){
        for(String extension:List.of("csv","json","xml","txt")){
            String body="VIN: 1HGCM82633A004352 Mileage: 123456 km DTC=P0420";
            var parsed=parser.parse(file("export."+extension,body));
            assertEquals(List.of("P0420"),parsed.codes(),extension);
            assertEquals("1HGCM82633A004352",parsed.vin(),extension);
            assertEquals(76712L,parsed.mileage(),extension);
            assertEquals(extension,parsed.format());
        }
    }
    @Test void ignoresInvalidCodeFragmentsAndDeduplicatesCodes(){
        var parsed=parser.parse(file("scan.csv","XP0300 P03000 P0300 P0300; A1234 P030G"));
        assertEquals(List.of("P0300"),parsed.codes());
    }
    @Test void extractsCodesFromUnknownTextExtensionsAndRejectsBinaryContent(){
        assertEquals("unknown",parser.parse(file("custom.export","P0300")).format());
        assertThrows(RuntimeException.class,()->parser.parse(new MockMultipartFile("file","scan.log","text/plain",new byte[]{80,51,48,48,0,120})));
        assertThrows(RuntimeException.class,()->parser.parse(new MockMultipartFile("file","empty.txt","text/plain",new byte[0])));
    }
    private MockMultipartFile file(String name,String value){return new MockMultipartFile("file",name,"text/plain",value.getBytes(StandardCharsets.UTF_8));}
}
