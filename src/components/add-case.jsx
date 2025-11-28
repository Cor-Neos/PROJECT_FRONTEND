import React, { useRef, useEffect, useState } from "react";
import api from "../utils/api.js";

const AddNewCase = ({ isModalOpen, setIsModalOpen, handleAddCase, newCase, setNewCase, addCaseModalRef, user }) => {
    if (!isModalOpen) return null;

    const [clients, setClients] = useState([]);
    const [caseCategories, setCaseCategories] = useState([]);
    const [caseCategoryTypes, setCaseCategoryTypes] = useState([]);
    const [lawyers, setLawyers] = useState([]);

    // Fetching clients here for the dropdown can be implemented later
    useEffect(() => {
        const fetchClientsAndLawyers = async () => {
            try {
                const [clientsData, lawyersData] = await Promise.all([
                    api.get("/clients"),
                    api.get("/lawyer-specializations"),
                ]);
                setClients(clientsData);
                setLawyers(lawyersData);
            } catch (error) {
                console.error("Error fetching clients:", error);
            }
        };
        fetchClientsAndLawyers();
    }, []);

    // Fetching case categories and types here
    useEffect(() => {
        const fetchCaseCategoriesAndTypes = async () => {
            try {
                const [categoriesData, typesData] = await Promise.all([
                    api.get("/case-categories"),
                    api.get("/case-category-types"),
                ]);
                setCaseCategories(categoriesData);
                setCaseCategoryTypes(typesData);
            } catch (error) {
                console.error("Error fetching case categories or types:", error);
            }
        };
        fetchCaseCategoriesAndTypes();
    }, []);

    useEffect(() => {
        if (newCase.user_id) {
            setNewCase((prev) => ({ ...prev, case_status: "Processing" }));
        } else {
            setNewCase((prev) => ({ ...prev, case_status: "Pending" }));
        }
    }, [newCase.user_id]);

    // Validation for required fields
    const isFormValid = () => {
        return (
            newCase.client_id &&
            newCase.cc_id &&
            newCase.ct_id &&
            newCase.case_fee &&
            newCase.case_status &&
            newCase.case_remarks &&
            newCase.case_cabinet
        );
    };
    const [errorMsg, setErrorMsg] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div
                ref={addCaseModalRef}
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800"
            >
                {errorMsg && <div className="mt-2 text-center text-sm text-red-600">{errorMsg}</div>}
                <h3 className="mb-6 text-xl font-bold text-slate-900 dark:text-slate-50">Add New Case</h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Client Dropdown */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Client</label>
                        <select
                            value={newCase.client_id}
                            onChange={(e) => setNewCase({ ...newCase, client_id: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
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

                    {/* Case CATEGORY ID */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                        <select
                            value={newCase.cc_id}
                            onChange={(e) => {
                                const selectedCcId = e.target.value;
                                setNewCase({ ...newCase, cc_id: selectedCcId, ct_id: "" }); // reset ct_id when category changes
                            }}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                        >
                            <option
                                value=""
                                disabled
                            >
                                Select Category
                            </option>
                            {caseCategories.map((category) => (
                                <option
                                    key={category.cc_id}
                                    value={category.cc_id}
                                >
                                    {category.cc_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Case TYPE (filtered by cc_id) */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Case Type (Case Name)</label>
                        <select
                            value={newCase.ct_id}
                            onChange={(e) => setNewCase({ ...newCase, ct_id: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                            disabled={!newCase.cc_id} // disable until a category is selected
                        >
                            <option
                                value=""
                                disabled
                            >
                                {newCase.cc_id ? "Select Case Type" : "Select Category first"}
                            </option>
                            {caseCategoryTypes
                                .filter((type) => type.cc_id === parseInt(newCase.cc_id)) // filter types by category id
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

                    {/* Assign To Lawyers Dropdown */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Assign To</label>
                        <select
                            value={newCase.user_id}
                            onChange={(e) => setNewCase({ ...newCase, user_id: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                            disabled={user.user_role !== "Admin" || !newCase.cc_id} // disabled if not Admin or no case category
                        >
                            <option
                                value=""
                                disabled
                            >
                                {user.user_role !== "Admin"
                                    ? `${user.user_fname} ${user.user_mname} ${user.user_lname}`
                                    : !newCase.cc_id
                                      ? "Select Category first"
                                      : "Select Lawyer"}
                            </option>

                            {user.user_role === "Admin" ? (
                                lawyers
                                    .filter((lawyer) => lawyer.cc_id === parseInt(newCase.cc_id)) // filter lawyers by category
                                    .map((lawyer) => (
                                        <option
                                            key={lawyer.user_id}
                                            value={lawyer.user_id}
                                        >
                                            {lawyer.user_fname} {lawyer.user_mname} {lawyer.user_lname}
                                        </option>
                                    ))
                            ) : (
                                <option value={newCase.user_id}>
                                    {user.user_fname} {user.user_mname} {user.user_lname}
                                </option>
                            )}
                        </select>
                    </div>

                    {/* Fee */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Fee</label>
                        <input
                            type="number"
                            value={newCase.case_fee}
                            onChange={(e) => setNewCase({ ...newCase, case_fee: e.target.value })}
                            onBlur={() => {
                                // On blur, if fee is empty or less than 0, set to 0.00
                                if (!newCase.case_fee || parseFloat(newCase.case_fee) < 0) {
                                    setNewCase((prev) => ({ ...prev, case_fee: "0.00" }));
                                } else {
                                    // Format to two decimal places
                                    const formattedFee = parseFloat(newCase.case_fee).toFixed(2);
                                    setNewCase((prev) => ({ ...prev, case_fee: formattedFee }));
                                }
                            }}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                            placeholder="0.00"
                        />
                        {newCase.ct_id && (
                            <p className="mt-1 text-xs text-gray-500">
                                Fee range:{" "}
                                {caseCategoryTypes.find((type) => type.ct_id === parseInt(newCase.ct_id))?.ct_fee || "No range fee info available"}
                            </p>
                        )}
                    </div>

                    {/* Case Status */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Case Status</label>
                        <input
                            type="text"
                            value={newCase.case_status}
                            readOnly
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    {/* Remarks */}
                    <div className="md:col-span-2">
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Remarks / Description </label>
                        <textarea
                            value={newCase.case_remarks}
                            onChange={(e) => setNewCase({ ...newCase, case_remarks: e.target.value })}
                            className="w-full resize-none rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                            placeholder="Enter remarks or description..."
                            rows={3}
                        ></textarea>
                    </div>

                    {/* Cabinet */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Cabinet</label>
                        <input
                            type="number"
                            value={newCase.case_cabinet}
                            onChange={(e) => setNewCase({ ...newCase, case_cabinet: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                        />
                    </div>

                    {/* Drawer */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Drawer</label>
                        <input
                            type="text"
                            value={newCase.case_drawer}
                            onChange={(e) => setNewCase({ ...newCase, case_drawer: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-slate-700 dark:text-white"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => setIsModalOpen(false)}
                        className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (!isFormValid()) {
                                setErrorMsg("Please fill out all required fields before adding the case.");
                                return;
                            }
                            setErrorMsg("");
                            handleAddCase();
                        }}
                        className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 ${!isFormValid() ? "cursor-not-allowed opacity-50" : ""}`}
                        disabled={!isFormValid()}
                    >
                        Add Case
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddNewCase;
