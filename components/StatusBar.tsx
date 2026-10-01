export default function StatusBar({ message }: { message: string }) {
  return (
    <div id="status" role="status" className="min-h-6 text-sm text-gray-700">
      {message}
    </div>
  );
}
