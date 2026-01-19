interface RecipeEmptyStateProps {
  hasSelectedDonuts: boolean
}

export function RecipeEmptyState({ hasSelectedDonuts }: RecipeEmptyStateProps) {
  return (
    <p className="text-gray-500">
      {hasSelectedDonuts
        ? '選択されたドーナツに対して、条件を満たすレシピが見つかりませんでした。'
        : 'ドーナツ選択タブでドーナツを選択し、レシピを検索してください。'}
    </p>
  )
}
