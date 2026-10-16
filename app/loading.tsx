export default function Loading() {
  return (
    <div className="space-y-4 py-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <article key={i} className="content-section article-card">
          <div className="article-layout">
            <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
            <div className="article-main flex-1 space-y-3">
              <div className="flex gap-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32" />
              </div>
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
