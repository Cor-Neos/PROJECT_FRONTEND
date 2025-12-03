import { useDraggable } from "@dnd-kit/core";
import { GripVertical } from "lucide-react";

export function TaskCard({ task, onClick }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: task.doc_id,
    });

    const style = transform ? { transform: `translate(${transform.x}px, ${transform.y}px)` } : undefined;

    const getTagColor = (tag) => {
        if (!tag) return "bg-gray-600";
        if (tag.toLowerCase().includes("rejected")) return "bg-red-600";
        if (tag.toLowerCase().includes("approved")) return "bg-green-600";
        if (tag.toLowerCase().includes("pending")) return "bg-yellow-500";
        return "bg-gray-600";
    };

    // check if task is overdue and if overdue, add red border
    const isOverdue = () => {
        if (!task.doc_due_date) return false; // no due date → not overdue

        const due = new Date(task.doc_due_date);
        if (isNaN(due.getTime())) return false; // invalid date → not overdue

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Start of today
        due.setHours(0, 0, 0, 0); // Start of due date

        return due < today; // overdue only if due date is *before today*
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`relative cursor-pointer rounded-lg p-3 shadow-sm hover:shadow-md dark:bg-blue-950 ${
                task.doc_prio_level === "High"
                    ? "border-l-4 border-red-500"
                    : task.doc_prio_level === "Mid"
                      ? "border-l-4 border-yellow-500"
                      : "border-l-4 border-blue-500"
            } ${isOverdue() ? "bg-red-200 text-red-700" : "bg-slate-700 text-slate-200"}`}
            onClick={() => onClick(task)}
        >
            {/* Drag Handle - fixed center-right */}
            <div
                {...listeners}
                {...attributes}
                onClick={(e) => e.stopPropagation()}
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-grab text-slate-400 hover:text-slate-200"
            >
                <GripVertical size={20} />
            </div>

            {/* Card content */}
            <h3 className={`pr-5 text-sm font-medium`}>
                {task.doc_name}
                {task.doc_tag && (
                    <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white ${getTagColor(task.doc_tag)}`}>
                        {task.doc_tag}
                    </span>
                )}
            </h3>
            {task.doc_task && <p className="mt-2 pr-6 text-xs">{task.doc_task}</p>}
        </div>
    );
}

export default TaskCard;
