import React, { useState, useRef } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";

const AddContact = ({ onAdd, onClose, clients = [] }) => {
    const [formData, setFormData] = useState({
        contact_fullname: "",
        contact_email: "",
        contact_phone: "",
        contact_role: "",
        contact_address: "",
        client_id: "",
    });

    const [contactName, setContactName] = useState({
        first: "",
        middle: "",
        last: "",
    });

    const modalRef = useRef(null);
    useClickOutside([modalRef], () => onClose(null));

    const handleNameChange = (e) => {
        const { name, value } = e.target;

        // update partial name fields
        setContactName((prev) => {
            const updated = { ...prev, [name]: value };

            // combine to form full name dynamically
            const fullName = `${updated.first} ${updated.middle ? updated.middle + " " : ""}${updated.last}`.trim();

            // update formData.contact_fullname
            setFormData((prevForm) => ({
                ...prevForm,
                contact_fullname: fullName,
            }));

            return updated;
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "contact_phone") {
            // Allow only digits
            const onlyNumbers = value.replace(/\D/g, "");
            // Limit to 11 digits
            if (onlyNumbers.length <= 11) {
                setFormData((prev) => ({ ...prev, [name]: onlyNumbers }));
            }
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const { contact_fullname, contact_email, contact_phone, contact_role, contact_address, client_id } = formData;

        if (!contact_fullname || !contact_email || !contact_phone || !contact_role || !contact_address || !client_id) {
            alert("Please fill in all required fields.");
            return;
        }

        const confirmAddingContact = window.confirm("Are you sure you want to add this contact?");
        if (confirmAddingContact) {
            onAdd(formData);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div
                ref={modalRef}
                className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800"
            >
                <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Add Client Contact Person</h2>
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    {/* CLIENT */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Client <span className="text-red-500">*</span>
                    </label>
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
                                {client.client_fullname || `Client ${client.client_id}`}
                            </option>
                        ))}
                    </select>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                            {/* FIRST NAME */}
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="first"
                                placeholder="Enter First Name"
                                value={contactName.first}
                                onChange={handleNameChange}
                                required
                                className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            {/* MIDDLE NAME */}
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Middle Name</label>
                            <input
                                name="middle"
                                placeholder="Enter Middle Name (optional)"
                                value={contactName.middle}
                                onChange={handleNameChange}
                                className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            {/* LAST NAME */}
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="last"
                                placeholder="Enter Last Name"
                                value={contactName.last}
                                onChange={handleNameChange}
                                required
                                className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* EMAIL */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        name="contact_email"
                        type="email"
                        placeholder="Enter Email Address"
                        value={formData.contact_email}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                    />

                    {/* PHONE */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        name="contact_phone"
                        placeholder="Enter Phone Number"
                        value={formData.contact_phone}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                    />

                    {/* ADDRESS */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Address <span className="text-red-500">*</span>
                    </label>
                    <input
                        name="contact_address"
                        placeholder="Enter Address"
                        value={formData.contact_address}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                    />

                    {/* ROLE */}
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                        Role (e.g. Manager, Secretary) <span className="text-red-500">*</span>
                    </label>
                    <input
                        name="contact_role"
                        placeholder="Enter Role"
                        value={formData.contact_role}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                    />

                    {/* BUTTONS */}
                    <div className="mt-4 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddContact;
