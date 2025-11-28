import React, { useState, useRef, useEffect } from "react";
import AddContact from "../components/add-contact";
import { useClickOutside } from "@/hooks/use-click-outside";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/auth-context";
import api from "../utils/api";

const ClientContact = () => {
    const { user } = useAuth();

    const [tableData, setTableData] = useState([]);
    const [clients, setClients] = useState([]);

    const [showAddContacts, setShowAddContacts] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [editContact, setEditContact] = useState(null);

    const [removeContactModalOpen, setRemoveContactModalOpen] = useState(false);
    const [contactToBeRemoved, setContactToBeRemoved] = useState(null);

    // Fetching client and its contacts
    useEffect(() => {
        const fetchData = async () => {
            try {
                const client_contacts_endpoint =
                    user?.user_role === "Admin" || user?.user_role === "Staff"
                        ? "/client-contacts"
                        : `/a-lawyer-client-contacts/${user.user_id}`;

                const clients_endpoint =
                    user?.user_role === "Admin" || user?.user_role === "Staff"
                        ? "/clients"
                        : `/clients/${user.user_id}`;

                const [contactsData, clientsData] = await Promise.all([
                    api.get(client_contacts_endpoint),
                    api.get(clients_endpoint),
                ]);

                setTableData(contactsData);
                setClients(clientsData);
            } catch (err) {
                console.error("Fetch Error:", err);
                setError(err.message || "Failed to fetch contacts or clients.");
                toast.error("Unable to load client contacts or clients.");
            }
        };

        fetchData();
    }, []);

    const getClientNameById = (id) => {
        const client = clients.find((c) => c.client_id === id);
        return client ? client.client_fullname : "Unknown";
    };

    const filteredData = tableData.filter((item) =>
        Object.values(item).some((value) => String(value).toLowerCase().includes(searchTerm.toLowerCase())),
    );

    const modalRef = useRef(null);
    useClickOutside([modalRef], () => {
        if (isModalOpen) setIsModalOpen(false);
    });

    const rowsPerPage = 5;
    const totalPages = Math.ceil(filteredData.length / rowsPerPage);
    const paginatedContacts = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const handleAddNewContact = async (newContact) => {
        const toastId = toast.loading("Adding new contact...");

        try {
            const createdContact = await api.post("/client-contacts", {
                ...newContact,
                contact_created_by: user.user_id,
            });

            // Update UI instantly
            setTableData((prev) => [createdContact, ...prev]);

            toast.success("Contact successfully added!", {
                id: toastId,
                duration: 4000,
            });

            // Close modal
            setShowAddContacts(false);
        } catch (err) {
            console.error("Error adding new contact:", err);
            toast.error("Error adding new contact.", {
                id: toastId,
                duration: 3000,
            });
        }
    };

    const handleContactRemoval = async (contact) => {
        const toastId = toast.loading(`Removing contact: ${contact.contact_fullname}...`);

        try {
            await api.put(`/client-contacts/${contact.contact_id}`, {
                ...contact,
                contact_status: "Removed",
                contact_updated_by: user.user_id,
            });

            // Remove contact from UI
            setTableData((prev) => prev.filter((item) => item.contact_id !== contact.contact_id));

            toast.success("Contact successfully removed.", {
                id: toastId,
                duration: 4000,
            });
        } catch (error) {
            console.error("Removal error:", error);
            toast.error("Error removing contact.", {
                id: toastId,
                duration: 3000,
            });
        } finally {
            setRemoveContactModalOpen(false);
            setContactToBeRemoved(null);
        }
    };

    return (
        <div className="bg-blue rounded-xl">
            {error && (
                <div className="alert alert-error mx-10 mb-5 mt-5 shadow-lg">
                    <div>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="title">Clients {" > "} Contacts</h1>
                    <p className="text-sm text-gray-500">Manage all client contacts information here...</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="card mb-6 flex flex-col items-center gap-4 rounded-lg bg-white p-4 shadow-md dark:bg-slate-800 md:flex-row">
                <input
                    type="text"
                    placeholder="Search client contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-gray-100 px-4 py-2 text-gray-900 placeholder-gray-500 outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder-gray-400 md:flex-1"
                />
                <button
                    onClick={() => {
                        setSearchTerm("");
                        setShowAddContacts(true);
                    }}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                >
                    Add Contact
                </button>
            </div>

            {/* Table */}
            <div className="card overflow-x-auto">
                <table className="min-w-full table-auto text-left text-sm">
                    <thead className="card-title text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3">Fullname</th>
                            <th className="px-4 py-3">Email</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Role / Relation</th>
                            <th className="px-4 py-3">Client</th>
                            <th className="px-4 py-3 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="text-gray-700 dark:text-white">
                        {paginatedContacts.length > 0 ? (
                            paginatedContacts.map((contact) => (
                                <tr
                                    key={contact.contact_id}
                                    className="border-t border-gray-200 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-slate-800"
                                >
                                    <td className="px-4 py-3">{contact.contact_fullname}</td>
                                    <td className="px-4 py-3">{contact.contact_email}</td>
                                    <td className="px-4 py-3">{contact.contact_phone}</td>
                                    <td className="px-4 py-3">{contact.contact_role}</td>
                                    <td className="px-4 py-3">{getClientNameById(contact.client_id)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-3">
                                            <button
                                                onClick={() => setEditContact(contact)}
                                                className="text-yellow-600 hover:text-yellow-700"
                                                title="Edit Contact"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setContactToBeRemoved(contact);
                                                    setRemoveContactModalOpen(true);
                                                }}
                                                className="text-red-600 hover:text-red-700"
                                                title="Delete Contact"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan="6"
                                    className="px-4 py-6 text-center text-slate-500 dark:text-slate-400"
                                >
                                    No client contacts found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="mt-2 flex items-center justify-end px-4 py-3 text-sm text-gray-700 dark:text-white">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                        >
                            &lt;
                        </button>

                        <div>
                            Page {currentPage} of {totalPages}
                        </div>

                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded border border-gray-300 bg-white px-3 py-1 hover:bg-gray-100 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600"
                        >
                            &gt;
                        </button>
                    </div>
                </div>
            )}

            {/* Add Contact Modal */}
            {showAddContacts && (
                <AddContact
                    onAdd={(newContact) => handleAddNewContact(newContact)}
                    onClose={() => setShowAddContacts(false)}
                    clients={clients}
                />
            )}

            {/* Edit Contact Modal */}
            {editContact && (
                <EditContactModal
                    contact={editContact}
                    onClose={() => setEditContact(null)}
                    clients={clients}
                    onSave={(updatedContact) => {
                        setTableData((prevData) => prevData.map((item) => (item.contact_id === updatedContact.contact_id ? updatedContact : item)));
                        setEditContact(null);
                    }}
                />
            )}

            {/* Removal Confirmation Modal */}
            {removeContactModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
                        <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Confirm Contact Removal</h3>
                        <p className="mb-6 text-gray-700 dark:text-gray-300">
                            Are you sure you want to remove <span className="font-semibold underline">{contactToBeRemoved?.contact_fullname}</span>?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRemoveContactModalOpen(false)}
                                className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleContactRemoval(contactToBeRemoved);
                                }}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Remove
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back Link */}
            <div className="mt-6">
                <a
                    href="/clients"
                    className="text-blue-600 hover:underline"
                >
                    {" < Back "}
                </a>
            </div>
        </div>
    );
};

export default ClientContact;

// EditContactModal Component
const EditContactModal = ({ contact, onClose, onSave, clients = [] }) => {
    const { user } = useAuth();

    // Helper to split a full name into first, middle, last
    const splitName = (fullName = "") => {
        const parts = fullName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return ["", "", ""];
        if (parts.length === 1) return [parts[0], "", ""];
        if (parts.length === 2) return [parts[0], "", parts[1]];
        return [parts[0], parts.slice(1, -1).join(" "), parts[parts.length - 1]];
    };

    const [formData, setFormData] = useState(() => {
        const initial = contact || {};
        const [firstName, middleName, lastName] = splitName(initial.contact_fullname || "");
        return { ...initial, firstName, middleName, lastName };
    });

    // Sync when contact prop changes
    useEffect(() => {
        if (contact) {
            const [firstName, middleName, lastName] = splitName(contact.contact_fullname || "");
            setFormData({ ...contact, firstName, middleName, lastName });
        }
    }, [contact]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        const toastId = toast.loading("Updating contact...");

        try {
            const { firstName, middleName, lastName, ...rest } = formData;
            const contact_fullname = [firstName, middleName, lastName].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();

            const updatedContact = await api.put(`/client-contacts/${rest.contact_id}`, {
                ...rest,
                contact_fullname,
                contact_updated_by: user.user_id,
            });
            onSave(updatedContact); // update state in parent

            toast.success("Contact successfully updated!", {
                id: toastId,
                duration: 3000,
            });

            onClose();
        } catch (err) {
            console.error(err);
            toast.error("Error updating contact.", {
                id: toastId,
                duration: 3000,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-md dark:bg-slate-800">
                <h2 className="mb-4 text-xl font-bold text-gray-800 dark:text-white">Edit Contact</h2>
                <div className="space-y-3">
                    {/* Name fields split */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <input
                            name="firstName"
                            value={formData.firstName || ""}
                            onChange={handleChange}
                            className="w-full rounded border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                            placeholder="First Name"
                        />
                        <input
                            name="middleName"
                            value={formData.middleName || ""}
                            onChange={handleChange}
                            className="w-full rounded border px-2 py-2 dark:bg-slate-700 dark:text-slate-50"
                            placeholder="Middle Name (optional)"
                        />
                        <input
                            name="lastName"
                            value={formData.lastName || ""}
                            onChange={handleChange}
                            className="w-full rounded border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                            placeholder="Last Name"
                        />
                    </div>
                    <input
                        name="contact_email"
                        value={formData.contact_email || ""}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                        placeholder="Email"
                    />
                    <input
                        name="contact_phone"
                        value={formData.contact_phone || ""}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                        placeholder="Phone Number"
                    />
                    <input
                        name="contact_role"
                        value={formData.contact_role || ""}
                        onChange={handleChange}
                        className="w-full rounded border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                        placeholder="Role / Relation"
                    />
                    <select
                        name="client_id"
                        value={formData.client_id}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-slate-50"
                    >
                        <option
                            value=""
                            disabled
                        >
                            Select Client
                        </option>
                        {clients.map((client) => (
                            <option
                                key={client.client_id}
                                value={client.client_id}
                            >
                                {client.client_fullname}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
