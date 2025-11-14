'use client'

import { useState, useEffect } from 'react'

const months = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
]

const convertToThaiNumber = (value: number | string): string => {
  const thaiDigits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙']
  return String(value)
    .split('')
    .map((char) => {
      const parsed = Number(char)
      return Number.isNaN(parsed) ? char : thaiDigits[parsed]
    })
    .join('')
}

type ThaiDateParts = {
  day: number
  monthIndex: number
  buddhistYear: number
}

type TrainingDateField =
  | 'trainingRphStart'
  | 'trainingRphEnd'
  | 'trainingRhcStart'
  | 'trainingRhcEnd'

type TrainingDatePart = 'day' | 'monthIndex' | 'buddhistYear'

type TrainingValues = {
  hospital?: string
  province?: string
  start?: string
  end?: string
}

type TrainingLine = {
  main: string
  period: string
}

type FormDataState = {
  name: string
  surname: string
  position: string
  currentWorkplace: string
  province: string
  level: string
  yearsWorked: number | ''
  monthsWorked: number | ''
  trainingPracticeYears: number | ''
  trainingPracticeMonths: number | ''
  startDate: string
  endDate: string
  unit: string
  startMonth: string
  startYear: number | ''
  amount: number | ''
  trainingRphHospital: string
  trainingRphProvince: string
  trainingRphStart: string
  trainingRphEnd: string
  trainingRhcHospital: string
  trainingRhcProvince: string
  trainingRhcStart: string
  trainingRhcEnd: string
}

const numericFieldNames = new Set<keyof FormDataState>([
  'startYear',
  'yearsWorked',
  'monthsWorked',
  'trainingPracticeYears',
  'trainingPracticeMonths',
  'amount',
])

const formatThaiDate = (isoDate: string): string => {
  if (!isoDate) {
    return ''
  }

  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) {
    return convertToThaiNumber(isoDate)
  }

  const day = convertToThaiNumber(date.getDate())
  const monthName = months[date.getMonth()] ?? ''
  const buddhistYear = date.getFullYear() + 543
  const yearText = convertToThaiNumber(buddhistYear)

  return `${day} ${monthName} ..${yearText}..`.trim()
}

const parseThaiDateParts = (isoDate: string): ThaiDateParts => {
  const fallbackYear = new Date().getFullYear() + 543
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return {
      day: 1,
      monthIndex: 0,
      buddhistYear: fallbackYear,
    }
  }

  return {
    day: date.getDate(),
    monthIndex: date.getMonth(),
    buddhistYear: date.getFullYear() + 543,
  }
}

const buildIsoDate = ({ day, monthIndex, buddhistYear }: ThaiDateParts): string => {
  const gregorianYear = buddhistYear - 543
  const candidate = new Date(gregorianYear, monthIndex, day)

  if (
    Number.isNaN(candidate.getTime()) ||
    candidate.getFullYear() !== gregorianYear ||
    candidate.getMonth() !== monthIndex ||
    candidate.getDate() !== day
  ) {
    return ''
  }

  const yearString = candidate.getFullYear()
  const monthString = String(candidate.getMonth() + 1).padStart(2, '0')
  const dayString = String(candidate.getDate()).padStart(2, '0')

  return `${yearString}-${monthString}-${dayString}`
}

const getLastDayOfThaiMonth = (buddhistYear: number, monthIndex: number): number => {
  const gregorianYear = buddhistYear - 543
  return new Date(gregorianYear, monthIndex + 1, 0).getDate()
}

const buildTrainingLine = (
  label: string,
  placeholders: TrainingValues,
  values: TrainingValues,
  fallback: TrainingLine,
): TrainingLine => {
  const hospital = values.hospital?.trim() ?? ''
  const province = values.province?.trim() ?? ''
  const start = values.start?.trim() ?? ''
  const end = values.end?.trim() ?? ''

  const hasData = hospital || province || start || end
  if (!hasData) {
    return fallback
  }

  const hospitalText = hospital ? ` ${hospital}` : placeholders.hospital ?? ''
  const provinceText = province ? ` ${province}` : placeholders.province ?? ''
  const startText = start ? ` ${start}` : placeholders.start ?? ''
  const endText = end ? ` ${end}` : placeholders.end ?? ''

  return {
    main: `• ${label}${hospitalText} จังหวัด${provinceText}`,
    period: `ตั้งแต่${startText}ถึง${endText}`,
  }
}

const numberToThaiText = (num: number): string => {
  const thaiDigits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const thaiPositions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']

  if (!Number.isFinite(num) || num < 0) {
    return ''
  }

  const integer = Math.floor(num)
  if (integer === 0) {
    return 'ศูนย์บาทถ้วน'
  }

  const convertSegment = (segment: string): string => {
    const digits = segment.split('')
    const len = digits.length
    let text = ''

    digits.forEach((digitChar, index) => {
      const digit = Number(digitChar)
      if (Number.isNaN(digit) || digit === 0) {
        return
      }

      const position = len - index - 1
      if (position === 0) {
        if (digit === 1 && len > 1) {
          text += 'เอ็ด'
        } else {
          text += thaiDigits[digit]
        }
        return
      }

      if (position === 1) {
        if (digit === 1) {
          text += 'สิบ'
        } else if (digit === 2) {
          text += 'ยี่สิบ'
        } else {
          text += thaiDigits[digit] + thaiPositions[position]
        }
        return
      }

      if (digit === 1) {
        text += 'หนึ่ง' + thaiPositions[position]
      } else {
        text += thaiDigits[digit] + thaiPositions[position]
      }
    })

    return text
  }

  const segments: string[] = []
  let remaining = integer.toString()

  while (remaining.length > 0) {
    const segment = remaining.slice(-6)
    segments.unshift(segment)
    remaining = remaining.slice(0, -6)
  }

  let result = ''

  segments.forEach((segment, index) => {
    const segmentText = convertSegment(segment)
    if (segmentText) {
      result += segmentText
    }

    if (index < segments.length - 1 && (segmentText || result)) {
      result += 'ล้าน'
    }
  })

  return `${result}บาทถ้วน`
}

const getNext12MonthsWithYear = (startMonth: string, startYear: number) => {
  const fallbackIndex = 0
  const startIndex = months.indexOf(startMonth)
  const safeIndex = startIndex === -1 ? fallbackIndex : startIndex
  const data = []

  for (let i = 0; i < 12; i += 1) {
    const monthIndex = (safeIndex + i) % 12
    const year = startYear + Math.floor((safeIndex + i) / 12)
    data.push({ month: months[monthIndex], year })
  }

  return data
}

const calculateDateDifference = (startDate: string, endDate: string): { years: number; months: number } => {
  if (!startDate || !endDate) {
    return { years: 0, months: 0 }
  }

  const start = new Date(startDate)
  const end = new Date(endDate)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return { years: 0, months: 0 }
  }

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()

  // Adjust if end day is before start day in the month
  if (end.getDate() < start.getDate()) {
    months--
  }

  // Adjust negative months
  if (months < 0) {
    years--
    months += 12
  }

  // Ensure non-negative values
  years = Math.max(0, years)
  months = Math.max(0, months)

  return { years, months }
}

export default function Home() {
  const [formData, setFormData] = useState<FormDataState>({
    name: '',
    surname: '',
    position: '',
    currentWorkplace: '',
    province: '',
    level: '',
    yearsWorked: '',
    monthsWorked: '',
    trainingPracticeYears: '',
    trainingPracticeMonths: '',
    startDate: '',
    endDate: '',
    unit: '',
    startMonth: '',
    startYear: '',
    amount: '',
    trainingRphHospital: '',
    trainingRphProvince: '',
    trainingRphStart: '',
    trainingRphEnd: '',
    trainingRhcHospital: '',
    trainingRhcProvince: '',
    trainingRhcStart: '',
    trainingRhcEnd: '',
  })
  const [generated, setGenerated] = useState(false)

  // Auto-calculate yearsWorked and monthsWorked from startDate and endDate
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const { years, months } = calculateDateDifference(formData.startDate, formData.endDate)
      setFormData(prev => ({
        ...prev,
        yearsWorked: years,
        monthsWorked: months
      }))
    }
  }, [formData.startDate, formData.endDate])

  const updateThaiDateField = (
    field: 'startDate' | 'endDate',
    updates: Partial<ThaiDateParts>,
  ) => {
    setFormData((prev) => {
      const currentParts = parseThaiDateParts(prev[field])
      const merged: ThaiDateParts = {
        ...currentParts,
        ...updates,
      }

      const lastDay = getLastDayOfThaiMonth(merged.buddhistYear, merged.monthIndex)
      const safeParts: ThaiDateParts = {
        ...merged,
        day: Math.min(merged.day, lastDay),
      }

      const isoDate = buildIsoDate(safeParts)
      if (!isoDate) {
        return prev
      }

      return {
        ...prev,
        [field]: isoDate,
      }
    })
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target
    const fieldName = name as keyof FormDataState

    setFormData((prev) => ({
      ...prev,
      [fieldName]:
        numericFieldNames.has(fieldName)
          ? value === ''
            ? ''
            : Number(value)
          : value,
    }))
  }

  const currentBuddhistYear = new Date().getFullYear() + 543
  const resolvedStartYear =
    typeof formData.startYear === 'number' && Number.isFinite(formData.startYear)
      ? formData.startYear
      : currentBuddhistYear
  const resolvedStartMonth = months.includes(formData.startMonth)
    ? formData.startMonth
    : months[0]
  const monthsData = getNext12MonthsWithYear(resolvedStartMonth, resolvedStartYear)
  const yearsWorkedValue =
    typeof formData.yearsWorked === 'number' && Number.isFinite(formData.yearsWorked)
      ? formData.yearsWorked
      : 0
  const monthsWorkedValue =
    typeof formData.monthsWorked === 'number' && Number.isFinite(formData.monthsWorked)
      ? formData.monthsWorked
      : 0
  const trainingPracticeYearsValue =
    typeof formData.trainingPracticeYears === 'number' &&
    Number.isFinite(formData.trainingPracticeYears)
      ? formData.trainingPracticeYears
      : null
  const trainingPracticeMonthsValue =
    typeof formData.trainingPracticeMonths === 'number' &&
    Number.isFinite(formData.trainingPracticeMonths)
      ? formData.trainingPracticeMonths
      : null
  const trainingPracticeYearsDisplay = trainingPracticeYearsValue !== null
    ? convertToThaiNumber(trainingPracticeYearsValue)
    : '..............'
  const trainingPracticeMonthsDisplay = trainingPracticeMonthsValue !== null
    ? convertToThaiNumber(trainingPracticeMonthsValue)
    : '..............'
  const baseTotalMonths = yearsWorkedValue * 12 + monthsWorkedValue
  const startDateParts = parseThaiDateParts(formData.startDate)
  const endDateParts = parseThaiDateParts(formData.endDate)
  const yearOptions = Array.from({ length: 41 }, (_, index) => currentBuddhistYear - 20 + index)
  const dayOptions = Array.from({ length: 31 }, (_, index) => index + 1)
  const amountValue =
    typeof formData.amount === 'number' && Number.isFinite(formData.amount)
      ? formData.amount
      : NaN
  const amountDisplayText = Number.isFinite(amountValue) ? convertToThaiNumber(amountValue) : ''
  const amountThaiText = Number.isFinite(amountValue) ? numberToThaiText(amountValue) : ''

  const handlePrimaryDateSelectChange = (
    field: 'startDate' | 'endDate',
    part: keyof ThaiDateParts,
    rawValue: string,
  ) => {
    if (rawValue === '') {
      setFormData((prev) => ({
        ...prev,
        [field]: '',
      }))
      return
    }

    updateThaiDateField(field, { [part]: Number(rawValue) })
  }
  const handleTrainingDateChange = (
    field: TrainingDateField,
    part: TrainingDatePart,
    rawValue: string,
  ) => {
    if (rawValue === '') {
      setFormData((prev) => ({
        ...prev,
        [field]: '',
      }))
      return
    }

    const numericValue = Number(rawValue)
    if (Number.isNaN(numericValue)) {
      return
    }

    setFormData((prev) => {
      const currentValue = prev[field] ?? ''
      const baseParts: ThaiDateParts = currentValue
        ? parseThaiDateParts(String(currentValue))
        : {
            day: 1,
            monthIndex: 0,
            buddhistYear: currentBuddhistYear,
          }
      const updatedParts: ThaiDateParts = {
        ...baseParts,
        [part]: numericValue,
      }
      const lastDay = getLastDayOfThaiMonth(updatedParts.buddhistYear, updatedParts.monthIndex)
      const safeParts: ThaiDateParts = {
        ...updatedParts,
        day: Math.min(updatedParts.day, lastDay),
      }
      const isoDate = buildIsoDate(safeParts)
      if (!isoDate) {
        return prev
      }

      return {
        ...prev,
        [field]: isoDate,
      }
    })
  }
  const trainingRphStartParts = parseThaiDateParts(formData.trainingRphStart)
  const trainingRphEndParts = parseThaiDateParts(formData.trainingRphEnd)
  const trainingRhcStartParts = parseThaiDateParts(formData.trainingRhcStart)
  const trainingRhcEndParts = parseThaiDateParts(formData.trainingRhcEnd)
  const trainingRphLine = buildTrainingLine(
    'รพศ/รพท',
    {
      hospital: '.....................',
      province: '....................',
      start: '.................................',
      end: '.....................................',
    },
    {
      hospital: formData.trainingRphHospital,
      province: formData.trainingRphProvince,
      start: formData.trainingRphStart ? formatThaiDate(formData.trainingRphStart) : '',
      end: formData.trainingRphEnd ? formatThaiDate(formData.trainingRphEnd) : '',
    },
    {
      main: '• รพศ/รพท..................... จังหวัด....................',
      period: 'ตั้งแต่.................................ถึง.....................................',
    },
  )
  const trainingRhcLine = buildTrainingLine(
    'รพช',
    {
      hospital: '...........................',
      province: '....................',
      start: '..................................',
      end: '.....................................',
    },
    {
      hospital: formData.trainingRhcHospital,
      province: formData.trainingRhcProvince,
      start: formData.trainingRhcStart ? formatThaiDate(formData.trainingRhcStart) : '',
      end: formData.trainingRhcEnd ? formatThaiDate(formData.trainingRhcEnd) : '',
    },
    {
      main: '• รพช........................... จังหวัด....................',
      period: 'ตั้งแต่..................................ถึง.....................................',
    },
  )

  if (!generated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-8 sm:py-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                ใบขอรับเงินค่าตอบแทน
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                เบี้ยเลี้ยงเหมาจ่ายสำหรับเจ้าหน้าที่ที่ปฏิบัติงานในหน่วยบริการสังกัดกระทรวงสาธารณสุข
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setGenerated(true); window.scrollTo(0, 0) }} className="px-6 sm:px-8 py-8 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  ข้อมูลส่วนตัว
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ชื่อ</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="เช่น นายสมชาย"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">นามสกุล</label>
                    <input
                      type="text"
                      name="surname"
                      value={formData.surname}
                      onChange={handleInputChange}
                      placeholder="เช่น ใจดี"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ตำแหน่ง</label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    onChange={handleInputChange}
                    placeholder="เช่น นักวิชาการสาธารณสุขปฏิบัติการ"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  สถานที่ปฏิบัติงาน
                </h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ปัจจุบันปฏิบัติงานที่</label>
                  <input
                    type="text"
                    name="currentWorkplace"
                    value={formData.currentWorkplace}
                    onChange={handleInputChange}
                    placeholder="เช่น โรงพยาบาลตัวอย่าง"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">จังหวัด</label>
                    <input
                      type="text"
                      name="province"
                      value={formData.province}
                      onChange={handleInputChange}
                      placeholder="เช่น กรุงเทพมหานคร"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">หน่วยบริการ</label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="เช่น โรงพยาบาลตัวอย่าง"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">ระดับ/กลุ่ม</label>
                  <input
                    type="text"
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    placeholder="เช่น ดิจิทัลทางการแพทย์และสุขภาพ"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  ข้อมูลการปฏิบัติงาน
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ปฏิบัติงาน (ปี)</label>
                    <input
                      type="number"
                      name="yearsWorked"
                      value={formData.yearsWorked}
                      onChange={handleInputChange}
                      placeholder="เช่น 5"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">เดือน</label>
                    <input
                      type="number"
                      name="monthsWorked"
                      value={formData.monthsWorked}
                      onChange={handleInputChange}
                      placeholder="เช่น 6"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">จำนวนเงิน (บาท)</label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="เช่น 2800"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่เริ่ม</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={formData.startDate ? String(startDateParts.day) : ''}
                        onChange={(event) =>
                          handlePrimaryDateSelectChange('startDate', 'day', event.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">วัน</option>
                        {dayOptions.map((day) => (
                          <option key={`start-day-${day}`} value={String(day)}>
                            {convertToThaiNumber(day)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.startDate ? String(startDateParts.monthIndex) : ''}
                        onChange={(event) =>
                          handlePrimaryDateSelectChange('startDate', 'monthIndex', event.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">เดือน</option>
                        {months.map((monthName, monthIndex) => (
                          <option key={`start-month-${monthName}`} value={String(monthIndex)}>
                            {monthName}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.startDate ? String(startDateParts.buddhistYear) : ''}
                        onChange={(event) =>
                          handlePrimaryDateSelectChange('startDate', 'buddhistYear', event.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">พ.ศ.</option>
                        {yearOptions.map((year) => (
                          <option key={`start-year-${year}`} value={String(year)}>
                            {convertToThaiNumber(year)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ถึงวันที่</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        value={formData.endDate ? String(endDateParts.day) : ''}
                        onChange={(event) =>
                          handlePrimaryDateSelectChange('endDate', 'day', event.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">วัน</option>
                        {dayOptions.map((day) => (
                          <option key={`end-day-${day}`} value={String(day)}>
                            {convertToThaiNumber(day)}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.endDate ? String(endDateParts.monthIndex) : ''}
                        onChange={(event) =>
                          handlePrimaryDateSelectChange('endDate', 'monthIndex', event.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">เดือน</option>
                        {months.map((monthName, monthIndex) => (
                          <option key={`end-month-${monthName}`} value={String(monthIndex)}>
                            {monthName}
                          </option>
                        ))}
                      </select>
                      <select
                        value={formData.endDate ? String(endDateParts.buddhistYear) : ''}
                        onChange={(event) =>
                          handlePrimaryDateSelectChange('endDate', 'buddhistYear', event.target.value)
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="">พ.ศ.</option>
                        {yearOptions.map((year) => (
                          <option key={`end-year-${year}`} value={String(year)}>
                            {convertToThaiNumber(year)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  รายละเอียดการฝึกเพิ่มพูนทักษะ
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      รวมระยะเวลาการปฏิบัติงาน (ปี)
                    </label>
                    <input
                      type="number"
                      name="trainingPracticeYears"
                      value={formData.trainingPracticeYears}
                      onChange={handleInputChange}
                      placeholder="เช่น 1"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      รวมระยะเวลาการปฏิบัติงาน (เดือน)
                    </label>
                    <input
                      type="number"
                      name="trainingPracticeMonths"
                      value={formData.trainingPracticeMonths}
                      onChange={handleInputChange}
                      placeholder="เช่น 6"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700">รพศ/รพท</p>
                    <div className="space-y-3 mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="trainingRphHospital"
                          value={formData.trainingRphHospital}
                          onChange={handleInputChange}
                          placeholder="ชื่อหน่วย"
                          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                        <input
                          type="text"
                          name="trainingRphProvince"
                          value={formData.trainingRphProvince}
                          onChange={handleInputChange}
                          placeholder="จังหวัด"
                          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={formData.trainingRphStart ? String(trainingRphStartParts.day) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRphStart', 'day', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">วัน</option>
                            {dayOptions.map((day) => (
                              <option key={`training-rph-start-day-${day}`} value={String(day)}>
                                {convertToThaiNumber(day)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRphStart ? String(trainingRphStartParts.monthIndex) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRphStart', 'monthIndex', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">เดือน</option>
                            {months.map((monthName, monthIndex) => (
                              <option key={`training-rph-start-month-${monthName}`} value={String(monthIndex)}>
                                {monthName}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRphStart ? String(trainingRphStartParts.buddhistYear) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRphStart', 'buddhistYear', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">พ.ศ.</option>
                            {yearOptions.map((year) => (
                              <option key={`training-rph-start-year-${year}`} value={String(year)}>
                                {convertToThaiNumber(year)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={formData.trainingRphEnd ? String(trainingRphEndParts.day) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRphEnd', 'day', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">วัน</option>
                            {dayOptions.map((day) => (
                              <option key={`training-rph-end-day-${day}`} value={String(day)}>
                                {convertToThaiNumber(day)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRphEnd ? String(trainingRphEndParts.monthIndex) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRphEnd', 'monthIndex', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">เดือน</option>
                            {months.map((monthName, monthIndex) => (
                              <option key={`training-rph-end-month-${monthName}`} value={String(monthIndex)}>
                                {monthName}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRphEnd ? String(trainingRphEndParts.buddhistYear) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRphEnd', 'buddhistYear', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">พ.ศ.</option>
                            {yearOptions.map((year) => (
                              <option key={`training-rph-end-year-${year}`} value={String(year)}>
                                {convertToThaiNumber(year)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700">รพช</p>
                    <div className="space-y-3 mt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input
                          type="text"
                          name="trainingRhcHospital"
                          value={formData.trainingRhcHospital}
                          onChange={handleInputChange}
                          placeholder="ชื่อหน่วย"
                          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                        <input
                          type="text"
                          name="trainingRhcProvince"
                          value={formData.trainingRhcProvince}
                          onChange={handleInputChange}
                          placeholder="จังหวัด"
                          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={formData.trainingRhcStart ? String(trainingRhcStartParts.day) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRhcStart', 'day', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">วัน</option>
                            {dayOptions.map((day) => (
                              <option key={`training-rhc-start-day-${day}`} value={String(day)}>
                                {convertToThaiNumber(day)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRhcStart ? String(trainingRhcStartParts.monthIndex) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRhcStart', 'monthIndex', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">เดือน</option>
                            {months.map((monthName, monthIndex) => (
                              <option key={`training-rhc-start-month-${monthName}`} value={String(monthIndex)}>
                                {monthName}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRhcStart ? String(trainingRhcStartParts.buddhistYear) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRhcStart', 'buddhistYear', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">พ.ศ.</option>
                            {yearOptions.map((year) => (
                              <option key={`training-rhc-start-year-${year}`} value={String(year)}>
                                {convertToThaiNumber(year)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <select
                            value={formData.trainingRhcEnd ? String(trainingRhcEndParts.day) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRhcEnd', 'day', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">วัน</option>
                            {dayOptions.map((day) => (
                              <option key={`training-rhc-end-day-${day}`} value={String(day)}>
                                {convertToThaiNumber(day)}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRhcEnd ? String(trainingRhcEndParts.monthIndex) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRhcEnd', 'monthIndex', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">เดือน</option>
                            {months.map((monthName, monthIndex) => (
                              <option key={`training-rhc-end-month-${monthName}`} value={String(monthIndex)}>
                                {monthName}
                              </option>
                            ))}
                          </select>
                          <select
                            value={formData.trainingRhcEnd ? String(trainingRhcEndParts.buddhistYear) : ''}
                            onChange={(event) =>
                              handleTrainingDateChange('trainingRhcEnd', 'buddhistYear', event.target.value)
                            }
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                          >
                            <option value="">พ.ศ.</option>
                            {yearOptions.map((year) => (
                              <option key={`training-rhc-end-year-${year}`} value={String(year)}>
                                {convertToThaiNumber(year)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-blue-200">
                  ช่วงเดือนขอรับ
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">เดือนเริ่มต้น</label>
                    <select
                      name="startMonth"
                      value={formData.startMonth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    >
                      <option value="">เลือกเดือน</option>
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">ปีเริ่มต้น (พ.ศ.)</label>
                    <select
                      name="startYear"
                      value={formData.startYear}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      required
                    >
                      <option value="">เลือกปี</option>
                      {yearOptions.map((year) => (
                        <option key={`start-year-${year}`} value={year}>
                          {convertToThaiNumber(year)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                >
                  สร้างเอกสาร 12 เดือน
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white min-h-screen p-0 print:p-0">
      <div className="fixed top-4 right-4 flex gap-2 z-50 no-print">
        <button
          onClick={() => setGenerated(false)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow">
          ← แก้ไขข้อมูล
        </button>
        <button
          onClick={() => window.print()}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm shadow"
        >
          พิมพ์เอกสาร
        </button>
      </div>

      {monthsData.map((item, index) => {
        const isLast = index === monthsData.length - 1
        const totalMonthsWithOffset = baseTotalMonths + index
        const yearsWithOffset = Math.floor(totalMonthsWithOffset / 12)
        const monthsWithOffset = totalMonthsWithOffset % 12
        return (
          <div key={`${item.month}-${item.year}`} className="flex flex-col items-center">
            <div
              className="mx-auto bg-white"
              style={{
                width: '210mm',
                minHeight: '297mm',
                padding: '15mm 22mm',
                fontFamily: '"TH SarabunPSK", "Sarabun", "Leelawadee UI", "Tahoma", "Times New Roman", serif',
                fontSize: '14pt',
                lineHeight: '1.45',
                color: '#111',
                boxSizing: 'border-box',
                pageBreakAfter: isLast ? 'auto' : 'always',
                pageBreakBefore: index === 0 ? 'auto' : 'always',
              }}
            >
              <div className="text-center mb-3">
              <p className="font-bold">ใบขอรับเงินค่าตอบแทนเบี้ยเลี้ยงเหมาจ่ายสำหรับเจ้าหน้าที่</p>
              <p>ที่ปฏิบัติงานในหน่วยบริการสังกัดกระทรวงสาธารณสุข</p>
            </div>

            <div className="space-y-2">
              <p className="text-right">
                หน่วยบริการ...........{formData.unit}.................
              </p>
              <p className="text-right">
                ประจำเดือน.....{item.month}.....พ.ศ.....{convertToThaiNumber(item.year)}
              </p>
              <p className="text-justify">
                ข้าพเจ้าชื่อ.....{formData.name}.....นามสกุล.....{formData.surname}.....ตำแหน่ง.....{formData.position}.....ปัจจุบันปฏิบัติงานที่.....{formData.currentWorkplace}.....จังหวัด.....{formData.province}.....ระดับ/กลุ่ม.....{formData.level}.....ปฏิบัติงานในหน่วยบริการ.....{convertToThaiNumber(yearsWithOffset)}.....ปี.....{convertToThaiNumber(monthsWithOffset)}.....เดือน (นับถึงสิ้นเดือนที่เบิกจ่าย) โดยมีรายละเอียดการปฏิบัติงาน ดังนี้ (เฉพาะสายแพทย์ตอบข้อ ๑ ด้วย)
              </p>
              <p>
                ๑. ฝึกเพิ่มพูนทักษะ (ปีที่ ๑) รวมระยะเวลาการปฏิบัติงาน
                {trainingPracticeYearsDisplay}
                ปี
                {trainingPracticeMonthsDisplay}
                เดือน ดังนี้
              </p>
              <ul className="pl-8 space-y-1 list-none">
                <li className="leading-tight">
                  <span>{trainingRphLine.main}</span>
                  <span className="block pl-6">{trainingRphLine.period}</span>
                </li>
                <li className="leading-tight">
                  <span>{trainingRhcLine.main}</span>
                  <span className="block pl-6">{trainingRhcLine.period}</span>
                </li>
              </ul>
              <p>
                ๒. ปฏิบัติงานที่โรงพยาบาล.....{formData.currentWorkplace}.....จังหวัด.....{formData.province}.....จัดระดับ.....ปกติ ระดับ.....{convertToThaiNumber(2)}.....ตั้งแต่วันที่.....{formatThaiDate(formData.startDate)}.....ถึงวันที่.....{formatThaiDate(formData.endDate)}.....รวม.....{convertToThaiNumber(yearsWithOffset)}.....ปี.....{convertToThaiNumber(monthsWithOffset)}.....เดือน.....วัน
              </p>
              <p>๓. ปฏิบัติงานที่โรงพยาบาล............................จังหวัด..........................จัดระดับ..................................</p>
              <p className="pl-6">ตั้งแต่วันที่..................................... ถึงวันที่ .............................. รวม..............ปี.........เดือน...........วัน</p>
              <p>๔. ปฏิบัติงานที่โรงพยาบาล............................จังหวัด..........................จัดระดับ..................................</p>
              <p className="pl-6">ตั้งแต่วันที่..................................... ถึงวันที่ .............................. รวม..............ปี.........เดือน...........วัน</p>
              <p>๕. ปฏิบัติงานที่โรงพยาบาล............................จังหวัด..........................จัดระดับ..................................</p>
              <p className="pl-6">ตั้งแต่วันที่..................................... ถึงวันที่ .............................. รวม..............ปี.........เดือน...........วัน</p>
              <p>๖. ปฏิบัติงานที่โรงพยาบาล............................จังหวัด..........................จัดระดับ..................................</p>
              <p className="pl-6">ตั้งแต่วันที่..................................... ถึงวันที่ .............................. รวม..............ปี.........เดือน...........วัน</p>
              <p>๗. ปฏิบัติงานที่โรงพยาบาล............................จังหวัด..........................จัดระดับ..................................</p>
              <p className="pl-6">ตั้งแต่วันที่..................................... ถึงวันที่ .............................. รวม..............ปี.........เดือน...........วัน</p>
              <p>
                รวมทั้งสิ้น.....{convertToThaiNumber(yearsWithOffset)}.....ปี.....{convertToThaiNumber(monthsWithOffset)}.....เดือน.....วัน จำนวนที่ขอเบิก.....{amountDisplayText}.....บาท (...{amountThaiText}...)
              </p>
              <p>
                ข้าพเจ้าขอรับรองข้อมูลดังกล่าวเป็นความจริงทุกประการ และหากมีการเรียกเงินคืน ข้าพเจ้าขอรับผิดชอบคืนเงินแต่เพียงผู้เดียว
              </p>
              <div className="pt-8">
                <div className="flex justify-end mt-4">
                  <div className="text-center" style={{ minWidth: '220px' }}>
                    <p>({formData.name} {formData.surname})</p>
                    <p>ตำแหน่ง {formData.position}</p>
                  </div>
                </div>
              </div>
            </div>
            </div>
            {!isLast && (
              <div
                className="no-print w-full flex justify-center"
                style={{ pageBreakBefore: 'auto' }}
              >
                <div className="w-[210mm] border-t border-dashed border-blue-300 my-8 opacity-70" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
