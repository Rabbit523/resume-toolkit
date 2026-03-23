import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableItem from './SortableItem';

export default function SortableList({ items, onReorder }) {
  const sensors = useSensors(useSensor(PointerSensor));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
          const oldIndex = items.findIndex((i) => i.key === active.id);
          const newIndex = items.findIndex((i) => i.key === over.id);
          onReorder(arrayMove(items, oldIndex, newIndex));
        }
      }}
    >
      <SortableContext items={items.map((i) => i.key)} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.key} id={item.key}>
            {item.children}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
