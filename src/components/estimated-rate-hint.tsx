/** Tooltip line for a rate estimated from sibling days */
export function EstimatedRateHint() {
  return <p className="mt-1 text-xs text-yellow-500">⚠️ НБУ не встановив курс на цю дату — використано середнє між курсами найближчого попереднього та наступного дня</p>;
}
