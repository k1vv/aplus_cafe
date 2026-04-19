package com.apluscafe.dto.response;

import com.apluscafe.entity.CafeTable;
import com.apluscafe.enums.TableShape;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CafeTableResponse {

    private Long id;
    private String tableNumber;
    private Integer capacity;
    private Double positionX;
    private Double positionY;
    private Double width;
    private Double height;
    private String floorSection;
    private TableShape shape;
    private Boolean isActive;

    public static CafeTableResponse fromEntity(CafeTable table) {
        return CafeTableResponse.builder()
                .id(table.getId())
                .tableNumber(table.getTableNumber())
                .capacity(table.getCapacity())
                .positionX(table.getPositionX())
                .positionY(table.getPositionY())
                .width(table.getWidth())
                .height(table.getHeight())
                .floorSection(table.getFloorSection())
                .shape(table.getShape())
                .isActive(table.getIsActive())
                .build();
    }
}
