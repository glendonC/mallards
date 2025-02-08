import { useSortable } from '@dnd-kit/sortable'
import React from "react";

interface GridItemProps {
  item: {
    id: string;
    title: string;
    content: JSX.Element;
    type?: 'metric' | 'chart';  // Add type property
  };
  gridArea?: {
    gridColumn: string;
    gridRow: string;
  };
  isFocused: boolean;
  isHidden: boolean;
  onFocus: () => void;
  customColors: {
    tileColor: string;
    textColor: string;
    borderColor: string;
  };
}

const GridItem: React.FC<GridItemProps> = ({
  item,
  gridArea,
  isFocused,
  isHidden,
  onFocus,
  customColors,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    transition,
  } = useSortable({
    id: item.id,
    disabled: isFocused,
  });

  const style: React.CSSProperties = {
    backgroundColor: customColors.tileColor,
    color: customColors.textColor,
    borderColor: customColors.borderColor,
    transition,
    ...(gridArea && {
      gridColumn: gridArea.gridColumn,
      gridRow: gridArea.gridRow,
    }),
  };

  return (
    <div
      ref={setNodeRef}
      className={`grid-item ${item.id} ${isDragging ? "dragging" : ""} ${isHidden ? "hidden" : ""}`}
      data-type={item.type || 'metric'}
      style={style}
      onClick={(e) => {
        if (!isDragging) onFocus();
      }}
      {...attributes}
      {...listeners}
    >
      <div className="grid-item-header">
        <h3 className="text-sm font-medium text-gray-500">{item.title}</h3>
      </div>
      <div className="grid-item-content">
        {React.cloneElement(item.content, { 
          isFocused: false,
          isPreview: true  // Add this prop
        })}
      </div>
    </div>
  );
};

export default GridItem;
