export default function ProgressIndicator({ currentStep, totalSteps }: { currentStep: number, totalSteps: number }) {
  const percentage = Math.round((currentStep / totalSteps) * 100);
  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>Paso {currentStep} de {totalSteps}</span>
        <span>{percentage} % completado</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}
