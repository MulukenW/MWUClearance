export default function FormInput({ label, error, register, name, type = 'text', placeholder, required, ...rest }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
      <input
        type={type}
        placeholder={placeholder}
        {...(register ? register(name, { required }) : {})}
        {...rest}
        className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-mwu-blue focus:border-transparent outline-none transition-all ${error ? 'border-red-400' : 'border-gray-300'}`}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
