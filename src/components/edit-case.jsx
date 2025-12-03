import React, { useState, useEffect, useRef } from "react";
import { useClickOutside } from "@/hooks/use-click-outside";

const EditCaseModal = ({ isOpen, onClose, caseData, onUpdate, user }) => {
    const modalRef = useRef();

    useClickOutside([modalRef], () => {
        if (isOpen) onClose();
    });

    const [formData, setFormData] = useState({
        client_id: "",
        cc_id: "",
        ct_id: "",
        user_id: "",
        case_remarks: "",
        case_cabinet: "",
        case_drawer: "",
        ctag_id: "",
    });

    const [clients, setClients] = useState([]);
    const [caseCategories, setCaseCategories] = useState([]);
    const [caseCategoryTypes, setCaseCategoryTypes] = useState([]);
    const [lawyers, setLawyers] = useState([]);
    const [caseTags, setCaseTags] = useState([]); // the case_tag_list of the case which is caseData.case_tag_list
    const [errors, setErrors] = useState({});

    // Fetch dropdown data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [clientsRes, categoriesRes, typesRes, lawyersRes, tagsRes] = await Promise.all([
                    fetch("http://localhost:3000/api/clients", { credentials: "include" }),
                    fetch("http://localhost:3000/api/case-categories", { credentials: "include" }),
                    fetch("http://localhost:3000/api/case-category-types", { credentials: "include" }),
                    fetch("http://localhost:3000/api/lawyer-specializations", { credentials: "include" }),
                ]);

                const [clientsData, categoriesData, typesData, lawyersData, tagsData] = await Promise.all([
                    clientsRes.json(),
                    categoriesRes.json(),
                    typesRes.json(),
                    lawyersRes.json(),
                ]);

                setClients(clientsData);
                setCaseCategories(categoriesData);
                setCaseCategoryTypes(typesData);
                setLawyers(lawyersData);
            } catch (err) {
                console.error("Error fetching dropdown data:", err);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    // Populate form with existing caseData
    useEffect(() => {
        if (caseData) {
            let parsedTags = [];

            try {
                parsedTags = Array.isArray(caseData.case_tag_list) ? caseData.case_tag_list : JSON.parse(caseData.case_tag_list || "[]");
            } catch (err) {
                parsedTags = [];
            }

            setCaseTags(parsedTags);

            // Parse case_tag to get the current tag
            let parsedTag = caseData.case_tag;
            try {
                parsedTag = typeof parsedTag === "string" ? JSON.parse(parsedTag) : parsedTag;
            } catch (e) {
                parsedTag = null;
            }

            setFormData({
                client_id: caseData.client_id || "",
                cc_id: caseData.cc_id || "",
                ct_id: caseData.ct_id || "",
                user_id:
                    user.user_role === "Lawyer"
                        ? user.user_id // lawyer always auto-assigned
                        : caseData.case_status === "Processing"
                          ? caseData.user_id || "" // if processing, keep assigned lawyer
                          : "", // if not processing, allow unassigned
                case_remarks: caseData.case_remarks || "",
                case_cabinet: caseData.case_cabinet || "",
                case_drawer: caseData.case_drawer || "",
                ctag_id: parsedTag?.ctag_id ?? "",
            });
        }
    }, [caseData]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Allow only numbers for cabinet/drawer
        if ((name === "case_cabinet" || name === "case_drawer") && value !== "" && !/^\d*$/.test(value)) {
            return;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const newErrors = {};

        if (formData.case_cabinet && isNaN(formData.case_cabinet)) {
            newErrors.case_cabinet = "Cabinet must be a number";
        }
        if (formData.case_drawer && isNaN(formData.case_drawer)) {
            newErrors.case_drawer = "Drawer must be a number";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        // find the FULL tag object from caseTags based on selected ctag_id
        const newSelectedTag = caseTags.find((tag) => tag.ctag_id === parseInt(formData.ctag_id));

        let updatedCase = {
            ...caseData,
            ...formData,
            case_tag: newSelectedTag,
            case_tag_list: JSON.stringify(caseTags), // keep the full list as is
        };

        if (updatedCase.user_id) {
            updatedCase.case_status = "Processing";
        }

        if (onUpdate) {
            onUpdate(updatedCase);
        }

        onClose();
    };

    if (!isOpen || !caseData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                ref={modalRef}
                className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-8 dark:bg-slate-800"
            >
                <h3 className="mb-4 text-2xl font-bold dark:text-white">Edit Case {caseData.case_id}</h3>

                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Client Dropdown */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Client</label>
                        <select
                            name="client_id"
                            value={formData.client_id}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
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

                    {/* Case Category Dropdown */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Category</label>
                        <select
                            name="cc_id"
                            value={formData.cc_id}
                            onChange={(e) => {
                                setFormData((prev) => ({
                                    ...prev,
                                    cc_id: e.target.value,
                                    ct_id: "", // Reset case type when category changes
                                }));
                            }}
                            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                        >
                            <option
                                value=""
                                disabled
                            >
                                Select Category
                            </option>
                            {caseCategories.map((cat) => (
                                <option
                                    key={cat.cc_id}
                                    value={cat.cc_id}
                                >
                                    {cat.cc_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Case Type Dropdown */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Case Type</label>
                        <select
                            name="ct_id"
                            value={formData.ct_id}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                            disabled={!formData.cc_id}
                        >
                            <option
                                value=""
                                disabled
                            >
                                {formData.cc_id ? "Select Case Type" : "Select Category first"}
                            </option>
                            {caseCategoryTypes
                                .filter((type) => type.cc_id === parseInt(formData.cc_id))
                                .map((type) => (
                                    <option
                                        key={type.ct_id}
                                        value={type.ct_id}
                                    >
                                        {type.ct_name}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {/* Lawyer Dropdown */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Assign to Lawyer</label>
                        <select
                            name="user_id"
                            value={formData.user_id}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                            disabled={user.user_role !== "Admin" || !formData.cc_id}
                        >
                            <option
                                value=""
                                disabled
                            >
                                {user.user_role !== "Admin"
                                    ? `${user.user_fname} ${user.user_mname} ${user.user_lname}`
                                    : !formData.cc_id
                                      ? "Select Category first"
                                      : "Select Lawyer"}
                            </option>

                            {user.user_role === "Admin" ? (
                                (() => {
                                    const filteredLawyers = lawyers.filter((lawyer) => lawyer.cc_id === parseInt(formData.cc_id));

                                    if (filteredLawyers.length > 0) {
                                        return filteredLawyers.map((lawyer) => (
                                            <option
                                                key={lawyer.user_id}
                                                value={lawyer.user_id}
                                            >
                                                {lawyer.user_fname} {lawyer.user_mname} {lawyer.user_lname}
                                            </option>
                                        ));
                                    }

                                    // fallback: no lawyers → assign to the admin (or super lawyer)
                                    return (
                                        <option value={user.user_id}>
                                            {user.user_fname} {user.user_mname} {user.user_lname} (You)
                                        </option>
                                    );
                                })()
                            ) : (
                                <option value={formData.user_id}>
                                    {user.user_fname} {user.user_mname} {user.user_lname}
                                </option>
                            )}
                        </select>
                    </div>

                    {/* Case Tag Dropdown */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Case Tag</label>
                        <select
                            name="ctag_id"
                            value={formData.ctag_id || ""}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                        >
                            {caseTags.map((tag) => (
                                <option
                                    key={tag.ctag_id}
                                    value={tag.ctag_id}
                                >
                                    {tag.ctag_name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Remarks */}
                <div className="mb-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-white">Description / Remarks</label>
                    <textarea
                        name="case_remarks"
                        value={formData.case_remarks}
                        onChange={handleChange}
                        className="mt-1 w-full resize-none rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                        rows={3}
                    ></textarea>
                </div>

                {/* Cabinet and Drawer */}
                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Cabinet</label>
                        <input
                            type="text"
                            name="case_cabinet"
                            value={formData.case_cabinet}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                        />
                        {errors.case_cabinet && <p className="text-sm text-red-500">{errors.case_cabinet}</p>}
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Drawer</label>
                        <input
                            type="text"
                            name="case_drawer"
                            value={formData.case_drawer}
                            onChange={handleChange}
                            className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-slate-700 dark:text-white"
                        />
                        {errors.case_drawer && <p className="text-sm text-red-500">{errors.case_drawer}</p>}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                        onClick={handleSubmit}
                    >
                        Update Case {user.user_role === "Lawyer" && caseData.case_status === "Pending" && " & Start Processing"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCaseModal;
