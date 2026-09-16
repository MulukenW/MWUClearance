export default function SelectInput({ label, error, register, name, options = [], placeholder, required, onChange: onChangeProp, value, ...rest }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
      <select
        value={value}
        onChange={(e) => { if (onChangeProp) onChangeProp(e); }}
        {...(register ? register(name, { required }) : {})}
        {...rest}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none ${error ? 'border-red-400' : 'border-gray-300'}`}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
