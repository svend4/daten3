import React, { memo, useCallback, useState, useId } from 'react';
import { Filter, ChevronDown, ChevronUp, X } from 'lucide-react';
import Button from '../common/Button';

interface FilterOption {
  id: string;
  label: string;
  value: string;
}

interface FilterGroup {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'range';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface FilterValues {
  [groupId: string]: string | string[] | { min: number; max: number };
}

interface FilterPanelProps {
  groups: FilterGroup[];
  values: FilterValues;
  onChange: (values: FilterValues) => void;
  onApply: () => void;
  onReset: () => void;
  className?: string;
}

/**
 * Filter panel component for search results.
 * Provides checkbox, radio, and range filter options.
 */
const FilterPanel: React.FC<FilterPanelProps> = ({
  groups,
  values,
  onChange,
  onApply,
  onReset,
  className = '',
}) => {
  const uniqueId = useId();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(groups.map((g) => g.id))
  );

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);

  const handleCheckboxChange = useCallback(
    (groupId: string, optionValue: string, checked: boolean) => {
      const currentValues = (values[groupId] as string[]) || [];
      const newValues = checked
        ? [...currentValues, optionValue]
        : currentValues.filter((v) => v !== optionValue);
      onChange({ ...values, [groupId]: newValues });
    },
    [values, onChange]
  );

  const handleRadioChange = useCallback(
    (groupId: string, optionValue: string) => {
      onChange({ ...values, [groupId]: optionValue });
    },
    [values, onChange]
  );

  const handleRangeChange = useCallback(
    (groupId: string, type: 'min' | 'max', value: number) => {
      const currentRange = (values[groupId] as { min: number; max: number }) || {
        min: 0,
        max: 0,
      };
      onChange({
        ...values,
        [groupId]: { ...currentRange, [type]: value },
      });
    },
    [values, onChange]
  );

  const hasActiveFilters = Object.values(values).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return v.min > 0 || v.max > 0;
    return v !== '';
  });

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-600" aria-hidden="true" />
          <h2 className="font-semibold text-gray-900">Фильтры</h2>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            aria-label="Сбросить все фильтры"
          >
            <X className="w-4 h-4" aria-hidden="true" />
            Сбросить
          </button>
        )}
      </div>

      {/* Filter Groups */}
      <div className="divide-y divide-gray-100">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.id);
          const groupLabelId = `${uniqueId}-group-${group.id}`;

          return (
            <div key={group.id} className="p-4">
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between text-left"
                aria-expanded={isExpanded}
                aria-controls={`${uniqueId}-panel-${group.id}`}
              >
                <span id={groupLabelId} className="font-medium text-gray-900">
                  {group.label}
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" aria-hidden="true" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" aria-hidden="true" />
                )}
              </button>

              {isExpanded && (
                <div
                  id={`${uniqueId}-panel-${group.id}`}
                  role="group"
                  aria-labelledby={groupLabelId}
                  className="mt-3 space-y-2"
                >
                  {group.type === 'checkbox' &&
                    group.options?.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2"
                      >
                        <input
                          type="checkbox"
                          checked={(values[group.id] as string[] || []).includes(option.value)}
                          onChange={(e) =>
                            handleCheckboxChange(group.id, option.value, e.target.checked)
                          }
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}

                  {group.type === 'radio' &&
                    group.options?.map((option) => (
                      <label
                        key={option.id}
                        className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg -mx-2"
                      >
                        <input
                          type="radio"
                          name={`${uniqueId}-${group.id}`}
                          checked={values[group.id] === option.value}
                          onChange={() => handleRadioChange(group.id, option.value)}
                          className="w-4 h-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{option.label}</span>
                      </label>
                    ))}

                  {group.type === 'range' && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">От</label>
                          <input
                            type="number"
                            min={group.min}
                            max={group.max}
                            step={group.step}
                            value={(values[group.id] as { min: number; max: number })?.min || ''}
                            onChange={(e) =>
                              handleRangeChange(group.id, 'min', Number(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <span className="text-gray-400 pt-5">—</span>
                        <div className="flex-1">
                          <label className="text-xs text-gray-500 mb-1 block">До</label>
                          <input
                            type="number"
                            min={group.min}
                            max={group.max}
                            step={group.step}
                            value={(values[group.id] as { min: number; max: number })?.max || ''}
                            onChange={(e) =>
                              handleRangeChange(group.id, 'max', Number(e.target.value))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Apply Button */}
      <div className="p-4 border-t border-gray-200">
        <Button onClick={onApply} fullWidth>
          Применить фильтры
        </Button>
      </div>
    </div>
  );
};

export default memo(FilterPanel);
