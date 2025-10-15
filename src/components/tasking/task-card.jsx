import { useDraggable } from "@dnd-kit/core";

export function TaskCard({ task }) {
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

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={`cursor-grab rounded-lg bg-slate-700 px-3 py-2 shadow-sm hover:shadow-md dark:bg-blue-950 ${task.doc_prio_level === "High" ? "border-l-4 border-red-500" : task.doc_prio_level === "Mid" ? "border-l-4 border-yellow-500" : "border-l-4 border-blue-500"}`}
            style={style}
        >
            <h3 className="text-sm font-medium text-slate-200">
                {task.doc_name}
                {task.doc_tag && (
                    <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-semibold text-white ${getTagColor(task.doc_tag)}`}>
                        {task.doc_tag}
                    </span>
                )}
            </h3>
            {task.doc_task && <p className="mt-2 text-xs text-slate-300">{task.doc_task}</p>}
        </div>
    );
}

export default TaskCard;