import { useState, useRef } from "react";
import { X, Trash2 } from "lucide-react";
import { useClickOutside } from "@/hooks/use-click-outside";
import { useAuth } from "@/context/auth-context";
import toast from "react-hot-toast";
import api from "@/utils/api";

const AddClient = ({ AddClients, setAddClients, onClientAdded }) => {
    const { user } = useAuth();
    const modalRef = useRef(null);

    useClickOutside([modalRef], () => setAddClients(null));

    // Client type toggle
    const [clientType, setClientType] = useState("person"); // "person" or "company"

    // Client state
    const [clientData, setClientData] = useState({
        client_fullname: "",
        client_email: "",
        client_phonenum: "",
        client_address: "",
        client_password: "",
        created_by: user?.user_id,
    });

    // For individual clients → split into parts
    const [personName, setPersonName] = useState({
        first: "",
        middle: "",
        last: "",
    });

    // For contacts (split name parts)
    const [contactName, setContactName] = useState({
        first: "",
        middle: "",
        last: "",
    });

    // Contact state (other info)
    const [contact, setContact] = useState({
        contact_email: "",
        contact_phone: "",
        contact_role: "",
        contact_address: "",
    });

    const [contacts, setContacts] = useState([]);

    const handleAddContact = () => {
        // Build full name from parts
        const fullName = `${contactName.first} ${contactName.middle ? contactName.middle + " " : ""}${contactName.last}`.trim();

        if (!fullName || !contact.contact_email || !contact.contact_phone || !contact.contact_role) return;

        const newContact = {
            contact_fullname: fullName,
            ...contact,
        };

        setContacts([...contacts, newContact]);

        // Reset states
        setContactName({ first: "", middle: "", last: "" });
        setContact({
            contact_email: "",
            contact_phone: "",
            contact_role: "",
            contact_address: "",
        });
    };

    const handleRemoveContact = (index) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Adding client and contacts...", {
            duration: 4000,
        });

        try {
            // Build fullname depending on type
            let finalFullname = "";
            if (clientType === "person") {
                finalFullname = `${personName.first} ${personName.middle ? personName.middle + " " : ""}${personName.last}`.trim();
            } else {
                finalFullname = clientData.client_fullname;
            }

            // 1. Create client
            const newClient = await api.post("/clients", {
                ...clientData,
                client_fullname: finalFullname,
            });

            // Notify parent
            onClientAdded(newClient);
            setAddClients(null);

            toast.success("Client added successfully!", {
                id: toastId,
                duration: 4000,
            });

            // 2. Create contacts
            for (const c of contacts) {
                await api.post("/client-contacts", {
                    ...c,
                    client_id: newClient.client_id,
                });
            }

            if (contacts.length > 0) {
                toast.success("Client and contact/s added successfully!", {
                    id: toastId,
                    duration: 4000,
                });
            }

            setAddClients(null);
        } catch (err) {
            console.error(err);
            toast.error("Error adding client and contacts.", {
                id: toastId,
                duration: 4000,
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div
                ref={modalRef}
                className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-8 shadow-lg dark:bg-slate-800"
            >
                <button
                    onClick={() => setAddClients(null)}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-800 dark:hover:text-white"
                >
                    <X className="btn-ghost" size={40}/>
                </button>

                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Add New Client</h2>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6"
                >
                    {/* --- CLIENT INFO --- */}
                    <div>
                        <h3 className="mb-2 font-semibold text-blue-700 dark:text-blue-300">Client Information</h3>

                        {/* Client Type Toggle */}
                        <div className="mb-4 inline-flex overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600">
                            <button
                                type="button"
                                onClick={() => setClientType("person")}
                                className={`rounded-l px-4 py-1 font-medium ${
                                    clientType === "person"
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-white"
                                }`}
                            >
                                Individual
                            </button>
                            <button
                                type="button"
                                onClick={() => setClientType("company")}
                                className={`rounded-r px-4 py-1 font-medium ${
                                    clientType === "company"
                                        ? "bg-blue-600 text-white hover:bg-blue-700"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-slate-700 dark:text-white"
                                }`}
                            >
                                Company
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            {clientType === "person" ? (
                                <>
                                    <input
                                        type="text"
                                        placeholder="First Name *"
                                        value={personName.first}
                                        onChange={(e) => setPersonName({ ...personName, first: e.target.value })}
                                        className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Middle Name"
                                        value={personName.middle}
                                        onChange={(e) => setPersonName({ ...personName, middle: e.target.value })}
                                        className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last Name *"
                                        value={personName.last}
                                        onChange={(e) => setPersonName({ ...personName, last: e.target.value })}
                                        className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                        required
                                    />
                                </>
                            ) : (
                                <input
                                    type="text"
                                    placeholder="Company Name *"
                                    value={clientData.client_fullname}
                                    onChange={(e) =>
                                        setClientData({
                                            ...clientData,
                                            client_fullname: e.target.value,
                                        })
                                    }
                                    className="col-span-3 rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                    required
                                />
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <input
                                type="email"
                                placeholder="Email *"
                                value={clientData.client_email}
                                onChange={(e) => setClientData({ ...clientData, client_email: e.target.value })}
                                className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Phone Number *"
                                value={clientData.client_phonenum}
                                onChange={(e) =>
                                    setClientData({
                                        ...clientData,
                                        client_phonenum: e.target.value,
                                    })
                                }
                                className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div className="mt-4">
                            <input
                                type="text"
                                placeholder="Address *"
                                value={clientData.client_address}
                                onChange={(e) =>
                                    setClientData({
                                        ...clientData,
                                        client_address: e.target.value,
                                    })
                                }
                                className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* --- CONTACT PERSON --- */}
                    <div>
                        <h3 className="mb-3 text-lg font-semibold text-blue-700 dark:text-blue-300">Contact Person</h3>

                        <div className="space-y-4">
                            {/* Row 1: Name fields */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <input
                                    type="text"
                                    placeholder="First Name"
                                    value={contactName.first}
                                    onChange={(e) => setContactName({ ...contactName, first: e.target.value })}
                                    className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Middle Name"
                                    value={contactName.middle}
                                    onChange={(e) => setContactName({ ...contactName, middle: e.target.value })}
                                    className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Last Name"
                                    value={contactName.last}
                                    onChange={(e) => setContactName({ ...contactName, last: e.target.value })}
                                    className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            {/* Row 2: Contact info */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={contact.contact_email}
                                    onChange={(e) => setContact({ ...contact, contact_email: e.target.value })}
                                    className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone"
                                    value={contact.contact_phone}
                                    onChange={(e) => setContact({ ...contact, contact_phone: e.target.value })}
                                    className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            {/* Row 3: Role & Address */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <input
                                    type="text"
                                    placeholder="Relation / Role"
                                    value={contact.contact_role}
                                    onChange={(e) => setContact({ ...contact, contact_role: e.target.value })}
                                    className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                />
                                <input
                                    type="text"
                                    placeholder="Address"
                                    value={contact.contact_address}
                                    onChange={(e) => setContact({ ...contact, contact_address: e.target.value })}
                                    className="rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                                />
                            </div>

                            {/* Add button */}
                            <div className="flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleAddContact}
                                    className="rounded-lg border border-blue-400 px-6 py-2 text-blue-500 shadow hover:bg-blue-600 hover:text-white dark:border-blue-900 dark:text-blue-400 dark:hover:bg-blue-900 dark:hover:text-white"
                                >
                                    + Add Contact
                                </button>
                            </div>
                        </div>

                        {/* Contact list */}
                        {contacts.length > 0 && (
                            <div className="mt-6 overflow-x-auto">
                                <table className="w-full table-auto text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 text-left text-xs font-semibold uppercase text-gray-600 dark:bg-slate-700 dark:text-gray-300">
                                            <th className="px-3 py-2">Full Name</th>
                                            <th className="px-3 py-2">Email</th>
                                            <th className="px-3 py-2">Phone</th>
                                            <th className="px-3 py-2">Role</th>
                                            <th className="px-3 py-2">Address</th>
                                            <th className="px-3 py-2">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-slate-600">
                                        {contacts.map((c, idx) => (
                                            <tr
                                                key={idx}
                                                className="hover:bg-gray-50 dark:hover:bg-slate-800"
                                            >
                                                <td className="px-3 py-2">{c.contact_fullname}</td>
                                                <td className="px-3 py-2">{c.contact_email}</td>
                                                <td className="px-3 py-2">{c.contact_phone}</td>
                                                <td className="px-3 py-2">{c.contact_role}</td>
                                                <td className="px-3 py-2">{c.contact_address || "-"}</td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveContact(idx)}
                                                        className="rounded p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddClient;
