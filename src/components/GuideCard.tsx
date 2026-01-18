interface GuideCardProps {
  title: string
  steps: string[]
  variant?: 'info' | 'warning'
}

export function GuideCard({ title, steps, variant = 'info' }: GuideCardProps) {
  const variantStyles = {
    info: 'bg-blue-50 border-blue-200 text-blue-900',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  }

  const titleColor = {
    info: 'text-blue-900',
    warning: 'text-yellow-900',
  }

  const textColor = {
    info: 'text-blue-800',
    warning: 'text-yellow-800',
  }

  return (
    <div className={`${variantStyles[variant]} border rounded-lg p-4 mb-4`} role="complementary">
      <h3 className={`font-semibold ${titleColor[variant]} mb-2 flex items-center gap-2`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <title>情報</title>
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        {title}
      </h3>
      <ol className={`list-decimal list-inside space-y-1 ${textColor[variant]}`}>
        {steps.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </div>
  )
}
