export default function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-10 w-10 border-4 border-mwu-blue border-t-transparent" />
      {text && <p className="text-sm text-gray-500 mt-3">{text}</p>}
    </div>
  );
}
