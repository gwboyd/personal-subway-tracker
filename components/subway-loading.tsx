export default function SubwayLoading() {
  return (
    <div className="p-8 text-center">
      <div className="flex flex-col items-center">
        <div className="w-8 h-8 rounded-full mb-2 bg-muted animate-pulse" />
        <div className="h-4 w-48 bg-muted animate-pulse rounded-md" />
      </div>
    </div>
  )
}
