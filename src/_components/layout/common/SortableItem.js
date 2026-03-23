import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableItem({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        marginBottom: 8,
        padding: 10,
        border: '2px dashed rgb(38, 40, 92)',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }}
    >
      <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '4px 8px', fontWeight: 'bold' }}>
        ☰
      </div>

      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}
