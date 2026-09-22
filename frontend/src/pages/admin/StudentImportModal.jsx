import { useState, useRef, useMemo } from "react";
import * as XLSX from "xlsx";
import { adminApi } from "../../services/api";
import Modal from "../../components/Modal";

// ---- Field definitions: required ones must be mapped before import ----
const FIELDS = [
  { key: "student_id", label: "Student ID", required: true },
  { key: "full_name", label: "Full Name", required: false },
  { key: "first_name", label: "First Name", required: false },
  { key: "middle_name", label: "Middle Name", required: false },
  { key: "last_name", label: "Last Name", required: false },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "college", label: "College", required: true },
  { key: "department", label: "Department", required: true },
  { key: "program", label: "Program", required: false },
  { key: "student_type", label: "Student Type", required: true },
  { key: "admission_year", label: "Admission Year", required: false },
  { key: "academic_year", label: "Academic Year", required: false },
];
const REQUIRED_FIELDS = FIELDS.filter((f) => f.required).map((f) => f.key);
const CHUNK_SIZE = 200; // rows per request; backend caps each request at 1000

// Accepts many header spellings per field
const HEADER_ALIASES = {
  student_id: ["student_id", "studentid", "id_no", "idno", "id", "student_no", "studentidno", "std_id", "stdid"],
  full_name: ["full_name", "fullname", "name", "student_name", "students_name"],
  first_name: ["first_name", "firstname", "given_name", "fname", "first"],
  middle_name: ["middle_name", "middlename", "mname", "middle", "fathers_name"],
  last_name: ["last_name", "lastname", "surname", "family_name", "lname", "last", "grandfathers_name", "grandfather_name", "grandfather"],
  email: ["email", "email_address", "e_mail", "mail", "university_email", "student_email"],
  phone: ["phone", "phone_number", "mobile", "telephone", "tel", "phone_no"],
  college: ["college", "college_name", "faculty", "school", "college_school", "collegeschool", "collegefaculty"],
  department: ["department", "dept", "department_name", "dept_name", "department_unit"],
  program: ["program", "program_name", "degree_program", "programme", "study_program", "field_of_study", "field"],
  student_type: ["student_type", "studenttype", "type", "student_type_name", "admission_type", "category"],
  admission_year: ["admission_year", "admissionyear", "year_of_admission", "admissiondate", "batch"],
  academic_year: ["academic_year", "academicyear", "year", "study_year"],
};

const normHeader = (h) =>
  String(h || "").toLowerCase().replace(/[\s\-.]+/g, "_").replace(/[^a-z0-9_]/g, "").replace(/_+/g, "_").replace(/^_+|_+$/g, "");

const autoMapField = (headers) => {
  const map = {};
  FIELDS.forEach((f) => {
    const idx = headers.findIndex((h) => HEADER_ALIASES[f.key].includes(normHeader(h)));
    map[f.key] = idx >= 0 ? idx : "";
  });
  return map;
};

const normName = (v) =>
  String(v || "")
    .replace(/\s|\u00A0/g, " ")
    .toLowerCase()
    .replace(/^(department|dept|college|school|faculty|program|programme)s?\s+(of|in)\s+/, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const lev = (a, b) => {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
};

const nameMatches = (a, b) => {
  const x = normName(a);
  const y = normName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  // typo tolerance (>= 85% similar), mirroring the backend
  const maxLen = Math.max(x.length, y.length);
  return maxLen >= 4 && 1 - lev(x, y) / maxLen >= 0.85;
};

const cell = (row, field) => String(row?.[field] ?? "").trim();

// Split a single "Full Name" value into first / middle / last
const splitFullName = (full) => {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: "", middle: "", last: "" };
  if (parts.length === 1) return { first: parts[0], middle: "", last: parts[0] };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(" "),
    last: parts[parts.length - 1],
  };
};

export default function StudentImportModal({ isOpen, onClose, onImported, config }) {
  const [step, setStep] = useState("upload"); // upload | map | preview | results
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]); // raw header texts
  const [dataRows, setDataRows] = useState([]); // arrays keyed by column index
  const [mapping, setMapping] = useState({});
  const [skippedTopRows, setSkippedTopRows] = useState(0);
  const [parseError, setParseError] = useState("");
  const [autoEmail, setAutoEmail] = useState(false);
  const [autoCreate, setAutoCreate] = useState(false);
  const [swapNotes, setSwapNotes] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState("");
  const [outcome, setOutcome] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const colleges = (config.colleges || []).map((c) => String(c.name));
  const departments = (config.departments || []).map((d) => String(d.name));
  const programs = (config.programs || []).map((p) => String(p.name));
  const studentTypes = (config.studentTypes || []).map((t) => String(t.name));

  // ---- Parse: read as 2-D array, auto-detect the header row anywhere in the top rows ----
  const handleFile = async (file) => {
    setParseError("");
    setOutcome(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false });
      if (!grid.length) {
        setParseError("The file is empty.");
        return;
      }
      const limit = Math.min(grid.length, 10);
      let headerIdx = -1;
      let bestScore = 0;
      for (let i = 0; i < limit; i++) {
        const score = (grid[i] || []).reduce(
          (acc, c) => acc + (HEADER_ALIASES && Object.values(HEADER_ALIASES).flat().includes(normHeader(c)) ? 1 : 0),
          0,
        );
        if (score > bestScore) {
          bestScore = score;
          headerIdx = i;
        }
      }
      if (bestScore < 2 || headerIdx < 0) {
        setParseError(
          "Could not find a header row. Make sure the first rows contain column titles like Student ID, First Name, Email, Department… You can still map the columns manually if you continue.",
        );
      }
      const h = headerIdx >= 0 ? headerIdx : 0;
      const rawHeaders = (grid[h] || []).map((c) => String(c).trim());
      const cols = rawHeaders.filter((c) => c !== "").length;
      if (cols === 0) {
        setParseError("The header row has no column titles.");
        return;
      }
      const skipped = grid.slice(0, h).filter((r) => (r || []).some((c) => String(c).trim() !== "")).length;
      const rows = grid.slice(h + 1).filter((r) => (r || []).some((c) => String(c).trim() !== ""));
      if (!rows.length) {
        setParseError("No data rows found below the header.");
        return;
      }
      setHeaders(rawHeaders);
      setDataRows(rows);

      // ---- Value-based sanity check: Ethiopian rosters often use "Program" for
      // Regular/Extension (which the system models as Student Type). If a mapped
      // column's VALUES look like the other kind, swap the mapping and explain. ----
      const notes = [];
      const base = autoMapField(rawHeaders);
      const sample = rows.slice(0, 30);
      const colValues = (idx) => sample.map((r) => String(r[idx] ?? "").trim()).filter(Boolean);
      const ratio = (vals, names) =>
        vals.length > 0 ? vals.filter((v) => names.some((n) => nameMatches(n, v))).length / vals.length : 0;
      if (base.program !== "" && base.student_type === "") {
        const vals = colValues(base.program);
        if (ratio(vals, studentTypes) >= 0.6 && ratio(vals, programs) < 0.6) {
          base.student_type = base.program;
          base.program = "";
          notes.push(
            'The "Program" column contains admission types (e.g. Regular, Extension) — it was mapped to Student Type instead. Programs are picked automatically from each student\'s department.',
          );
        }
      } else if (base.student_type !== "" && base.program === "") {
        const vals = colValues(base.student_type);
        if (ratio(vals, programs) >= 0.6 && ratio(vals, studentTypes) < 0.6) {
          base.program = base.student_type;
          base.student_type = "";
          notes.push('The "Student Type" column contains program names — it was mapped to Program.');
        }
      }
      setMapping(base);
      setSwapNotes(notes);
      setSkippedTopRows(skipped);
      setStep("map");
    } catch (e) {
      setParseError(`Could not read the file: ${e.message}`);
    }
  };

  // ---- Build row objects from the column mapping ----
  const buildRows = () =>
    dataRows.map((arr, i) => {
      const row = {};
      FIELDS.forEach((f) => {
        if (mapping[f.key] !== "" && mapping[f.key] != null) row[f.key] = arr[mapping[f.key]] ?? "";
      });
      row.__row = i + 1; // data row number (for display)
      return row;
    });

  // ---- Client-side pre-validation (mirrors the backend, incl. fuzzy name matching) ----
  const validateRows = (rows) => {
    const seen = { studentIds: new Set(), emails: new Set() };
    // Departments offering exactly one program — used to satisfy a missing Program column
    const singleProgramDepts = new Set(
      (config.departments || [])
        .filter((d) => (config.programs || []).filter((p) => String(p.department_id) === String(d.id)).length === 1)
        .map((d) => String(d.id)),
    );
    return rows.map((row) => {
      const errors = [];

      // Full Name -> first/middle/last when name columns are absent
      if (!cell(row, "first_name") && !cell(row, "last_name") && cell(row, "full_name")) {
        const { first, middle, last } = splitFullName(cell(row, "full_name"));
        row.first_name = first;
        row.middle_name = middle;
        row.last_name = last;
      }

      // Required mapping checks (email waivable via auto-generate)
      REQUIRED_FIELDS.forEach((f) => {
        if (f === "email" && autoEmail) return;
        if (!cell(row, f)) errors.push(`${FIELDS.find((x) => x.key === f).label.toLowerCase()} is required`);
      });
      if (!cell(row, "first_name")) errors.push("first name is required (map Full Name or First/Last Name columns)");
      if (!cell(row, "last_name")) errors.push("last name is required (map Full Name or First/Last Name columns)");

      const email = cell(row, "email").toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("invalid email");
      const ay = cell(row, "admission_year");
      if (ay && !(ay.match(/(19|20)\d{2}/) || []).length) errors.push("admission year not readable");
      if (cell(row, "college") && colleges.length && !colleges.some((n) => nameMatches(n, cell(row, "college"))))
        errors.push(`college "${cell(row, "college")}" not found`);
      if (cell(row, "department") && departments.length && !departments.some((n) => nameMatches(n, cell(row, "department"))))
        errors.push(`department "${cell(row, "department")}" not found`);
      const progVal = cell(row, "program");
      if (progVal && programs.length && !programs.some((n) => nameMatches(n, progVal))) {
        // Not an exact/fuzzy program name — acceptable only if it resolves as the row's
        // single-program department (backend does the same)
        const dept = departments.find((n) => nameMatches(n, progVal));
        const deptObj = dept && (config.departments || []).find((d) => nameMatches(d.name, dept));
        const single = deptObj && singleProgramDepts.has(String(deptObj.id));
        if (!single) errors.push(`program "${progVal}" not found`);
      }
      if (!progVal && cell(row, "department")) {
        const deptObj = (config.departments || []).find((d) => nameMatches(d.name, cell(row, "department")));
        // Missing program is fine when the department has exactly one program, or any
        // Bachelor's program (backend picks it automatically)
        const deptPrograms = deptObj ? (config.programs || []).filter((p) => String(p.department_id) === String(deptObj.id)) : [];
        const hasBachelor = deptPrograms.some((p) => String(p.name || "").toLowerCase().startsWith("bachelor"));
        if (deptObj && deptPrograms.length > 1 && !hasBachelor)
          errors.push(`program is required (department "${cell(row, "department")}" has multiple programs and no clear Bachelor's program — add a Program column)`);
      }
      if (cell(row, "student_type") && studentTypes.length && !studentTypes.some((n) => nameMatches(n, cell(row, "student_type"))))
        errors.push(`student type "${cell(row, "student_type")}" not found`);
      const sid = cell(row, "student_id");
      if (sid && seen.studentIds.has(sid)) errors.push("duplicate Student ID in file");
      if (email && seen.emails.has(email)) errors.push("duplicate email in file");
      seen.studentIds.add(sid);
      if (email) seen.emails.add(email);
      row.__errors = errors;
      return row;
    });
  };

  const mappedRows = useMemo(() => (step === "map" || step === "preview" ? validateRows(buildRows()) : []), [step, mapping, dataRows, config, autoEmail]);
  const validCount = mappedRows.filter((r) => r.__errors.length === 0).length;
  const errorCount = mappedRows.length - validCount;

  // Group errors so the admin sees WHAT is wrong, not 685 rows of it
  const errorBreakdown = useMemo(() => {
    const counts = {};
    mappedRows.forEach((r) => r.__errors.forEach((e) => { counts[e] = (counts[e] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [mappedRows]);

  const missingRequired = REQUIRED_FIELDS.filter(
    (f) => !(f === "email" && autoEmail) && (mapping[f.key] === "" || mapping[f.key] == null),
  );

  const downloadTemplate = () => {
    const header = ["student_id", "first_name", "middle_name", "last_name", "email", "phone", "college", "department", "program", "student_type", "admission_year", "academic_year"];
    const examples = [
      ["SG/1234/16", "Abebe", "", "Kebede", "abebe.kebede@mwu.edu.et", "0912345678", "College of Computing", "Computer Science", "Bachelor of Science in Computer Science", "Regular", "2019", "2019/20"],
      ["SG/1235/16", "Sara", "Tsion", "Alemu", "sara.alemu@mwu.edu.et", "0912345679", "College of Computing", "Computer Science", "Bachelor of Science in Computer Science", "Regular", "2019", "2019/20"],
    ];
    const csv = XLSX.utils.sheet_to_csv(XLSX.utils.aoa_to_sheet([header, ...examples]));
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "student_import_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const runImport = async () => {
    setImporting(true);
    setImportError("");
    const allResults = [];
    let imported = 0;
    let failed = 0;
    try {
      const clean = mappedRows.map(({ __errors, ...r }) => r);
      for (let i = 0; i < clean.length; i += CHUNK_SIZE) {
        const res = await adminApi.importStudents(clean.slice(i, i + CHUNK_SIZE), autoEmail, autoCreate);
        const d = res.data || {};
        imported += d.imported || 0;
        failed += d.failed || 0;
        (d.results || []).forEach((r) => allResults.push(r));
      }
      setOutcome({ imported, failed, results: allResults });
      setStep("results");
      onImported?.();
    } catch (err) {
      setImportError(err.response?.data?.message || "Import failed. Please try again.");
    }
    setImporting(false);
  };

  const downloadResults = () => {
    if (!outcome) return;
    const header = ["row", "status", "student_id", "name", "email", "password", "errors"];
    const lines = [header.join(",")];
    outcome.results.forEach((r) => {
      lines.push(
        [r.row, r.status, r.student_id, r.name, r.email, r.password || "", `"${(r.errors || []).join("; ").replace(/"/g, '""')}"`].join(","),
      );
    });
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "student_import_results.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setDataRows([]);
    setMapping({});
    setFileName("");
    setParseError("");
    setImportError("");
    setOutcome(null);
    setAutoEmail(false);
    setAutoCreate(false);
    setSwapNotes([]);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const resultImported = outcome?.results.filter((r) => r.status === "imported") || [];
  const resultFailed = outcome?.results.filter((r) => r.status === "failed") || [];
  const previewRows = mappedRows.slice(0, 8);

  return (
    <Modal isOpen={isOpen} onClose={close} title="Import Students from Excel / CSV" maxWidth="max-w-3xl">
      {step === "upload" && (
        <div>
          <p className="text-sm text-gray-600 mb-4">
            Upload a spreadsheet of students. The header row is auto-detected and columns can be mapped manually —
            the template shows the exact format. Each imported student gets a login account with an auto-generated password.
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-mwu-blue bg-blue-50" : "border-gray-300 hover:border-mwu-blue/50 hover:bg-gray-50"}`}
          >
            <svg className="w-10 h-10 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.9A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Drop your .xlsx or .csv file here, or click to browse</p>
            <p className="text-xs text-gray-400 mt-1">First sheet is used · header row auto-detected</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
            />
          </div>
          {fileName && <p className="text-xs text-gray-500 mt-2">Selected: {fileName}</p>}
          {parseError && (
            <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-800">{parseError}</div>
          )}
          <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100">
            <button onClick={downloadTemplate} className="text-sm font-medium text-mwu-blue hover:text-blue-700">
              ⬇ Download template (CSV)
            </button>
            <button onClick={close} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      )}

      {step === "map" && (
        <div>
          <div className="text-sm text-gray-700 mb-3">
            <span className="font-semibold">{fileName}</span> — {dataRows.length} data row{dataRows.length !== 1 ? "s" : ""} detected
            {skippedTopRows > 0 && <> · {skippedTopRows} title/spacer row{skippedTopRows > 1 ? "s" : ""} skipped</>}
          </div>
          <p className="text-xs text-gray-500 mb-3">Confirm which spreadsheet column holds each field (auto-mapped where possible).</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 max-h-72 overflow-auto p-1">
            {FIELDS.map((f) => {
              // When a single Full Name column is mapped, the First/Middle/Last dropdowns
              // are noise — the name is split automatically. Show them only otherwise.
              if (["first_name", "middle_name", "last_name"].includes(f.key) && mapping.full_name !== "" && mapping.full_name != null) {
                return null;
              }
              return (
              <div key={f.key}>
                <label className={`block text-xs font-semibold mb-1 ${missingRequired.includes(f.key) ? "text-red-600" : "text-gray-600"}`}>
                  {f.label}{f.required && " *"}
                </label>
                <select
                  value={mapping[f.key] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === "" ? "" : Number(e.target.value) }))}
                  className={`w-full px-2.5 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-mwu-blue/20 focus:border-mwu-blue outline-none ${missingRequired.includes(f.key) ? "border-red-300" : "border-gray-200"}`}
                >
                  <option value="">— not mapped —</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h || `Column ${i + 1}`}</option>
                  ))}
                </select>
              </div>
              );
            })}
          </div>

          <label className="flex items-start gap-2 text-sm text-gray-700 mb-3">
            <input type="checkbox" checked={autoEmail} onChange={(e) => setAutoEmail(e.target.checked)} className="mt-0.5 accent-blue-600" />
            <span>
              Auto-generate emails for rows without one
              <span className="block text-xs text-gray-400">Creates <code>std.&lt;student-id&gt;@student.mwu.edu.et</code></span>
            </span>
          </label>

          <label className="flex items-start gap-2 text-sm text-gray-700 mb-3">
            <input type="checkbox" checked={autoCreate} onChange={(e) => setAutoCreate(e.target.checked)} className="mt-0.5 accent-blue-600" />
            <span>
              Create missing departments, programs, or student types during import
              <span className="block text-xs text-gray-400">Names not found in the system are added automatically instead of failing the row (Admin → Colleges/Departments can review them later)</span>
            </span>
          </label>

          {swapNotes.length > 0 && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-sm text-blue-800 mb-3">
              {swapNotes.map((n, i) => (
                <p key={i}>ℹ️ {n}</p>
              ))}
            </div>
          )}

          {missingRequired.length > 0 && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-sm text-amber-800 mb-3">
              Unmapped columns: {missingRequired.map((k) => FIELDS.find((f) => f.key === k).label).join(", ")} — rows missing those values will be flagged on the next step.
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4 pt-4 border-t border-gray-100">
            <button onClick={reset} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              Choose another file
            </button>
            <button
              onClick={() => setStep("preview")}
              className="px-5 py-2.5 bg-gradient-to-r from-mwu-blue to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 transition-all shadow-sm"
            >
              Validate rows
            </button>
          </div>
        </div>
      )}

      {step === "preview" && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="text-sm text-gray-700">
              <span className="font-semibold">{fileName}</span> — {mappedRows.length} row{mappedRows.length !== 1 ? "s" : ""}
            </div>
            <div className="flex gap-2 text-xs font-semibold">
              <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700">{validCount} ready</span>
              {errorCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700">{errorCount} with errors</span>
              )}
            </div>
          </div>

          {errorBreakdown.length > 0 && (
            <div className="mb-4 p-3 rounded-xl bg-red-50/60 border border-red-100">
              <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Why rows are failing ({errorCount} rows)</p>
              <ul className="space-y-1">
                {errorBreakdown.map(([msg, count]) => (
                  <li key={msg} className="text-sm text-red-800 flex justify-between gap-3">
                    <span>{msg}</span>
                    <span className="font-semibold whitespace-nowrap">{count} row{count !== 1 ? "s" : ""}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-red-500 mt-2">
                Fix the values in your file and re-upload, or fix the names in Admin → Colleges/Departments/Programs. Rows with errors will be skipped; the rest will import.
              </p>
            </div>
          )}

          <div className="border border-gray-100 rounded-xl overflow-auto max-h-72">
            <table className="w-full text-xs">
              <thead className="bg-gray-50 sticky top-0">
                <tr className="text-left text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2">Row</th>
                  <th className="px-3 py-2">Student ID</th>
                  <th className="px-3 py-2">Name</th>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Department</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {previewRows.map((r) => (
                  <tr key={r.__row} className={r.__errors.length ? "bg-red-50/40" : ""}>
                    <td className="px-3 py-2 text-gray-400">{r.__row}</td>
                    <td className="px-3 py-2 font-medium text-gray-700">{cell(r, "student_id")}</td>
                    <td className="px-3 py-2 text-gray-700">{`${cell(r, "first_name")} ${cell(r, "middle_name")} ${cell(r, "last_name")}`.replace(/\s+/g, " ").trim()}</td>
                    <td className="px-3 py-2 text-gray-500">{cell(r, "email") || (autoEmail ? <span className="italic text-blue-500">auto</span> : "—")}</td>
                    <td className="px-3 py-2 text-gray-500">{cell(r, "department")}</td>
                    <td className="px-3 py-2">
                      {r.__errors.length === 0 ? (
                        <span className="px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">Ready</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-semibold" title={r.__errors.join("; ")}>
                          {r.__errors[0]}{r.__errors.length > 1 ? ` +${r.__errors.length - 1}` : ""}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {mappedRows.length > previewRows.length && (
            <p className="text-xs text-gray-400 mt-2">Showing first {previewRows.length} of {mappedRows.length} rows…</p>
          )}

          <label className="flex items-start gap-2 text-sm text-gray-700 mt-3">
            <input type="checkbox" checked={autoEmail} onChange={(e) => setAutoEmail(e.target.checked)} className="mt-0.5 accent-blue-600" />
            <span>Auto-generate emails for rows without one <span className="text-xs text-gray-400">(<code>std.&lt;student-id&gt;@student.mwu.edu.et</code>)</span></span>
          </label>

          {importError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">{importError}</div>
          )}

          <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100">
            <button onClick={() => setStep("map")} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              ← Back to mapping
            </button>
            <button
              onClick={runImport}
              disabled={importing || validCount === 0}
              className="px-5 py-2.5 bg-gradient-to-r from-mwu-blue to-blue-600 text-white rounded-xl text-sm font-semibold hover:from-mwu-blue-dark hover:to-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {importing ? "Importing…" : `Import ${validCount} student${validCount !== 1 ? "s" : ""}${errorCount > 0 ? `, skip ${errorCount}` : ""}`}
            </button>
          </div>
        </div>
      )}

      {step === "results" && outcome && (
        <div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-green-50 border border-green-100">
              <p className="text-2xl font-bold text-green-700">{outcome.imported}</p>
              <p className="text-sm text-green-600">Imported successfully</p>
            </div>
            <div className={`p-4 rounded-xl border ${outcome.failed ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
              <p className={`text-2xl font-bold ${outcome.failed ? "text-red-700" : "text-gray-400"}`}>{outcome.failed}</p>
              <p className={`text-sm ${outcome.failed ? "text-red-600" : "text-gray-400"}`}>Failed</p>
            </div>
          </div>

          {resultImported.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Generated login credentials <span className="font-normal text-gray-400">(save them — passwords are shown only once)</span>
              </p>
              <div className="border border-gray-100 rounded-xl overflow-auto max-h-60">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr className="text-left text-gray-500 uppercase tracking-wide">
                      <th className="px-3 py-2">Student ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Email</th>
                      <th className="px-3 py-2">Password</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {resultImported.map((r) => (
                      <tr key={`ok-${r.row}`}>
                        <td className="px-3 py-2 font-medium text-gray-700">{r.student_id}</td>
                        <td className="px-3 py-2 text-gray-700">{r.name}</td>
                        <td className="px-3 py-2 text-gray-500">
                          {r.email}{r.email_generated && <span className="ml-1 italic text-blue-500">(auto)</span>}
                        </td>
                        <td className="px-3 py-2"><code className="bg-blue-50 text-mwu-blue px-1.5 py-0.5 rounded font-semibold">{r.password}</code></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {resultFailed.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Rows not imported</p>
              <div className="border border-red-100 rounded-xl overflow-auto max-h-52">
                <table className="w-full text-xs">
                  <thead className="bg-red-50 sticky top-0">
                    <tr className="text-left text-red-500 uppercase tracking-wide">
                      <th className="px-3 py-2">Row</th>
                      <th className="px-3 py-2">Student</th>
                      <th className="px-3 py-2">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-red-50">
                    {resultFailed.map((r) => (
                      <tr key={`err-${r.row}`}>
                        <td className="px-3 py-2 text-gray-400">{r.row}</td>
                        <td className="px-3 py-2 font-medium text-gray-700">{r.student_id || r.name || "—"}</td>
                        <td className="px-3 py-2 text-red-700">{(r.errors || []).join("; ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end mt-5 pt-4 border-t border-gray-100">
            <button onClick={downloadResults} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
              ⬇ Download results (CSV)
            </button>
            <button onClick={close} className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 shadow-sm">
              Done
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
