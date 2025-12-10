import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarFieldProps {
  label?: string;
  showLabel?: boolean;
  value: string;
  placeholder?: string;
  primaryColor: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  onChange: (value: string) => void;
}

export default function CalendarField({ 
  label = 'Date', 
  showLabel = true, 
  value, 
  placeholder = 'Select a date', 
  primaryColor, 
  disabled = false,
  minDate,
  maxDate,
  onChange 
}: CalendarFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Determine border color based on state (matching TextField)
  let borderColor: string;
  if (disabled) {
    borderColor = '#E5E7EB'; // gray-200
  } else if (isFocused || isOpen) {
    borderColor = '#9CA3AF'; // gray-400
  } else if (isHovered) {
    borderColor = '#9CA3AF'; // gray-400
  } else {
    borderColor = '#E5E7EB'; // gray-200
  }

  // Placeholder color is always consistent regardless of label state
  const placeholderColor = disabled ? '#9CA3AF' : '#64748B'; // gray-400 : slate-500
  const textColor = disabled ? '#9CA3AF' : (value ? '#3F3F46' : '#64748B'); // gray-400 : (zinc-700 : slate-500)
  
  // Placeholder typography - always consistent
  const placeholderTypography = {
    fontSize: 16,
    fontFamily: 'Poppins',
    fontWeight: 400,
    lineHeight: '24px',
    letterSpacing: 0.2,
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Initialize currentMonth from value if available
  useEffect(() => {
    if (value) {
      try {
        // Parse date string as YYYY-MM-DD in local timezone
        const [year, month, day] = value.split('-').map(Number);
        if (year && month && day) {
          const date = new Date(year, month - 1, day);
          if (!isNaN(date.getTime())) {
            setCurrentMonth(new Date(year, month - 1, 1));
          }
        }
      } catch {
        // Ignore invalid dates
      }
    }
  }, [value]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setIsFocused(!isOpen);
    }
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    onChange(dateString);
    setIsOpen(false);
    setIsFocused(false);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Helper function to format date as YYYY-MM-DD using local timezone
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateDisabled = (date: Date): boolean => {
    const dateString = formatDateLocal(date);
    if (minDate && dateString < minDate) return true;
    if (maxDate && dateString > maxDate) return true;
    return false;
  };

  const isDateSelected = (date: Date): boolean => {
    if (!value) return false;
    const dateString = formatDateLocal(date);
    return dateString === value;
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Date[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(new Date(year, month, -startingDayOfWeek + i + 1));
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div 
      ref={calendarRef}
      className="w-full flex flex-col justify-start items-start gap-2"
    >
      {showLabel && (
        <div 
          className="self-stretch justify-start text-base font-normal font-['Poppins'] leading-6 tracking-tight"
          style={{ color: disabled ? '#9CA3AF' : '#64748B' }}
        >
          {label}
        </div>
      )}

      <div className="relative w-full">
        <div
          className="self-stretch p-4 bg-white rounded-2xl shadow-[0px_2px_14px_0px_rgba(53,59,70,0.15)] outline outline-1 outline-offset-[-1px] flex justify-start items-center"
          style={{
            outlineColor: borderColor,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          onClick={handleToggle}
          onMouseEnter={() => !disabled && setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <input
            type="hidden"
            value={value || ''}
            onChange={() => {}}
          />
          <div className="flex-1 flex justify-start items-center">
            <div className="flex-1 justify-start">
              {!value ? (
                <span
                  style={{
                    color: placeholderColor,
                    ...placeholderTypography,
                  }}
                >
                  {placeholder}
                </span>
              ) : (
                <span
                  style={{
                    color: textColor,
                    ...placeholderTypography,
                  }}
                >
                  {(() => {
                    try {
                      // Parse date string as YYYY-MM-DD in local timezone
                      const [year, month, day] = value.split('-').map(Number);
                      if (year && month && day) {
                        const date = new Date(year, month - 1, day);
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          });
                        }
                      }
                      return value;
                    } catch {
                      return value;
                    }
                  })()}
                </span>
              )}
            </div>
          </div>
          <div data-size="24px" className="w-6 h-6 relative overflow-hidden flex-shrink-0">
            <Calendar 
              size={24} 
              style={{ 
                color: disabled ? '#9CA3AF' : '#3F3F46',
              }} 
            />
          </div>
        </div>

        {/* Calendar Popup */}
        {isOpen && !disabled && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 8,
              background: 'white',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
              border: '1px solid #E8EAEE',
              zIndex: 1000,
              padding: '12px',
              width: '260px',
            }}
          >
            {/* Calendar Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
              }}
            >
              <button
                onClick={() => navigateMonth('prev')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ChevronLeft size={16} color="#637085" />
              </button>
              <div
                style={{
                  fontFamily: 'Poppins',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#353B46',
                  textTransform: 'capitalize',
                }}
              >
                {monthName}
              </div>
              <button
                onClick={() => navigateMonth('next')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#F3F4F6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <ChevronRight size={16} color="#637085" />
              </button>
            </div>

            {/* Week Days Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
                marginBottom: '8px',
              }}
            >
              {weekDays.map((day) => (
                <div
                  key={day}
                  style={{
                    textAlign: 'center',
                    fontFamily: 'Poppins',
                    fontSize: '10px',
                    fontWeight: 500,
                    color: '#8C95A8',
                    padding: '4px 0',
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '2px',
              }}
            >
              {days.map((day, index) => {
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const isSelected = isDateSelected(day);
                const isDisabled = isDateDisabled(day);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={`${day.getTime()}-${index}`}
                    onClick={() => {
                      if (!isDisabled && isCurrentMonth) {
                        handleDateSelect(day);
                      }
                    }}
                    disabled={isDisabled || !isCurrentMonth}
                    style={{
                      background: isSelected ? primaryColor : 'transparent',
                      border: isTodayDate && !isSelected ? `1px solid ${primaryColor}` : '1px solid transparent',
                      borderRadius: '6px',
                      padding: '4px',
                      cursor: isDisabled || !isCurrentMonth ? 'not-allowed' : 'pointer',
                      fontFamily: 'Poppins',
                      fontSize: '12px',
                      fontWeight: isSelected ? 500 : 400,
                      color: isSelected
                        ? 'white'
                        : !isCurrentMonth
                        ? '#E8EAEE'
                        : isDisabled
                        ? '#D1D5DB'
                        : isTodayDate
                        ? primaryColor
                        : '#353B46',
                      transition: 'all 0.2s',
                      minHeight: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => {
                      if (!isDisabled && isCurrentMonth && !isSelected) {
                        e.currentTarget.style.backgroundColor = '#F3F4F6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

