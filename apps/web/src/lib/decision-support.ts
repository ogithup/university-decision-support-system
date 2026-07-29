export type DataSourceMode = "mock" | "live" | "manual";

export type SelectOption = {
  id: string;
  label: string;
};

export type ThresholdLevel = "healthy" | "watch" | "risk";

export type ThresholdRule = {
  metric: string;
  healthyMax?: number;
  healthyMin?: number;
  watchMax?: number;
  watchMin?: number;
  unit: "%" | "count" | "TRY";
  note: string;
};

export type FinancialCategory = {
  id: string;
  label: string;
  kind: "income" | "expense";
  baselineAmount: number;
  scenarioAmount: number;
  active: boolean;
  adjustable: boolean;
};

export type FinancialUnitSummary = {
  id: string;
  facultyId: string;
  facultyLabel: string;
  departmentId: string;
  departmentLabel: string;
  studentCount: number;
  budgetTarget: number;
  budgetActual: number;
  incomeTotal: number;
  expenseTotal: number;
  researchIncome: number;
  personnelExpense: number;
};

export type FinancialBaseline = {
  periodOptions: SelectOption[];
  facultyOptions: SelectOption[];
  departmentOptions: SelectOption[];
  sourceMode: DataSourceMode;
  selectedPeriod: string;
  selectedFacultyId: string;
  selectedDepartmentId: string;
  lastUpdated: string;
  targetBudget: number;
  activeStudentCount: number;
  graduateCount: number;
  scholarshipStudentCount: number;
  averageTuition: number;
  averageScholarship: number;
  graduateAttributableCost: number | null;
  categories: FinancialCategory[];
  units: FinancialUnitSummary[];
  monthlyNetFlow: Array<{ label: string; income: number; expense: number }>;
};

export type FinancialScenarioInput = {
  scenarioName: string;
  sourceMode: DataSourceMode;
  percentageMode: boolean;
  autoNormalize: boolean;
  studentCountDeltaPct: number;
  averageTuitionDeltaPct: number;
  scholarshipRateDeltaPct: number;
  averageScholarshipDeltaPct: number;
  academicStaffDeltaPct: number;
  administrativeStaffDeltaPct: number;
  personnelCostDeltaPct: number;
  projectIncomeDeltaPct: number;
  researchIncomeDeltaPct: number;
  energyCostDeltaPct: number;
  educationCostDeltaPct: number;
  technologyInvestmentDeltaPct: number;
  otherIncomeDeltaPct: number;
  otherExpenseDeltaPct: number;
};

export type ComparisonMetric = {
  id: string;
  label: string;
  baseline: number | null;
  scenario: number | null;
  absoluteDifference: number | null;
  percentageDifference: number | null;
  previousPeriodDelta: number | null;
  unit: "TRY" | "%" | "count";
  status: ThresholdLevel;
  tooltip: string;
};

export type ScenarioRisk = {
  id: string;
  title: string;
  owner: string;
  level: ThresholdLevel;
  currentValue: string;
  scenarioValue: string;
  thresholdLabel: string;
  distanceToThreshold: string;
  probableCause: string;
  impact: string;
  action: string;
};

export type SavedScenario = {
  id: string;
  name: string;
  reference: boolean;
  updatedAt: string;
  incomeTotal: number;
  expenseTotal: number;
  netBalance: number;
  studentCost: number | null;
  personnelNeed: number | null;
  classroomOccupancy: number | null;
  laboratoryOccupancy: number | null;
  riskCount: number;
};

export type FinancialScenarioResult = {
  baselineMetrics: ComparisonMetric[];
  scenarioMetrics: ComparisonMetric[];
  incomeItems: FinancialCategory[];
  expenseItems: FinancialCategory[];
  incomeDistribution: Array<{ label: string; amount: number; sharePct: number }>;
  expenseDistribution: Array<{ label: string; amount: number; sharePct: number }>;
  unitComparisons: Array<{
    label: string;
    income: number;
    expense: number;
    variancePct: number;
    studentCost: number;
  }>;
  monthlyNetFlow: Array<{ label: string; baseline: number; scenario: number }>;
  waterfall: Array<{ label: string; value: number }>;
  topChanges: {
    risingExpenses: Array<{ label: string; value: number }>;
    fallingIncome: Array<{ label: string; value: number }>;
  };
  risks: ScenarioRisk[];
  warnings: string[];
  assumptions: string[];
  totalDistributionPct: number;
  savedScenarios: SavedScenario[];
};

export type LaboratoryType = "computer" | "electronics" | "cyber" | "basic_science" | "design";

export type LaboratorySnapshot = {
  id: string;
  label: string;
  type: LaboratoryType;
  capacity: number;
  weeklyHours: number;
  plannedHours: number;
  actualHours: number;
  unavailableHours: number;
};

export type ClassroomSnapshot = {
  id: string;
  label: string;
  seatCapacity: number;
  weeklyHours: number;
  plannedSeatHours: number;
};

export type CapacityUnitSummary = {
  id: string;
  facultyId: string;
  facultyLabel: string;
  departmentId: string;
  departmentLabel: string;
  activeStudents: number;
  academicStaff: number;
  classrooms: number;
  labs: number;
  tuitionRevenue: number;
  totalCost: number;
};

export type CapacityBaseline = {
  periodOptions: SelectOption[];
  facultyOptions: SelectOption[];
  departmentOptions: SelectOption[];
  selectedPeriod: string;
  selectedFacultyId: string;
  selectedDepartmentId: string;
  sourceMode: DataSourceMode;
  lastUpdated: string;
  totalStudents: number;
  activeStudents: number;
  newAdmissions: number;
  graduateCount: number;
  academicStaff: number;
  administrativeStaff: number;
  averageTuition: number;
  scholarshipRate: number;
  averageScholarship: number;
  targetStudentsPerAcademic: number;
  coursesPerWeek: number;
  sectionCount: number;
  averageClassSize: number;
  weeklyCourseHours: number;
  labRequiredCourseRate: number;
  labHoursPerCourse: number;
  classrooms: ClassroomSnapshot[];
  laboratories: LaboratorySnapshot[];
  units: CapacityUnitSummary[];
  scheduleHeatmap: Array<{ day: string; hour: string; utilizationPct: number }>;
};

export type CapacityScenarioInput = {
  scenarioName: string;
  sourceMode: DataSourceMode;
  totalStudents: number;
  activeStudents: number;
  newAdmissions: number;
  graduateCount: number;
  growthPct: number;
  courseCount: number;
  sectionCount: number;
  averageClassSize: number;
  weeklyCourseHours: number;
  labRequiredCourseRate: number;
  labHoursPerCourse: number;
  academicStaff: number;
  targetStudentsPerAcademic: number;
  classroomCount: number;
  laboratoryCount: number;
  classroomSeatCapacity: number;
  laboratorySeatCapacity: number;
  availableWeeklyHours: number;
  maintenanceHoursLoss: number;
  averageTuition: number;
  scholarshipRate: number;
};

export type CapacityScenarioResult = {
  metrics: ComparisonMetric[];
  tuitionImpact: {
    grossTuition: number;
    estimatedScholarships: number;
    netTuition: number;
  };
  staffNeed: {
    currentAcademicStaff: number;
    requiredAcademicStaff: number;
    additionalNeed: number;
    excessStaff: number;
  };
  occupancy: {
    classroomPct: number | null;
    laboratoryPct: number | null;
    labHoursGap: number;
  };
  laboratoryBreakdown: Array<{
    label: string;
    type: LaboratoryType;
    availableSeatHours: number;
    demandedSeatHours: number;
    utilizationPct: number;
    gapHours: number;
  }>;
  facultyMatrix: Array<{
    label: string;
    activeStudents: number;
    studentCost: number;
    capacityPressure: number;
  }>;
  waterfall: Array<{ label: string; value: number }>;
  heatmap: Array<{ day: string; hour: string; utilizationPct: number }>;
  risks: ScenarioRisk[];
  assumptions: string[];
  savedScenarios: SavedScenario[];
};

export const metricThresholds: ThresholdRule[] = [
  { metric: "classroom_occupancy", healthyMax: 75, watchMax: 90, unit: "%", note: "Derslik dolulugu 90 uzerinde ise risk kabul edilir." },
  { metric: "laboratory_occupancy", healthyMax: 70, watchMax: 85, unit: "%", note: "Laboratuvar kullanim esigi kurumsal ayarlardan degistirilebilir." },
  { metric: "personnel_expense_ratio", healthyMax: 50, watchMax: 60, unit: "%", note: "Personel gider orani toplam gider icindeki paya gore okunur." },
  { metric: "budget_realization", healthyMin: 95, watchMin: 85, unit: "%", note: "Butce gerceklesme orani 95-105 bandinda hedefe uygun kabul edilir." },
];

function makeUnits(): FinancialUnitSummary[] {
  return [
    { id: "UNIT-CENG", facultyId: "FAC-ENG", facultyLabel: "Muhendislik ve Mimarlik Fakultesi", departmentId: "DEP-CENG", departmentLabel: "Bilgisayar Muhendisligi", studentCount: 1180, budgetTarget: 22600000, budgetActual: 21900000, incomeTotal: 24800000, expenseTotal: 21200000, researchIncome: 5200000, personnelExpense: 12200000 },
    { id: "UNIT-EEE", facultyId: "FAC-ENG", facultyLabel: "Muhendislik ve Mimarlik Fakultesi", departmentId: "DEP-EEE", departmentLabel: "Elektrik Elektronik Muhendisligi", studentCount: 820, budgetTarget: 18100000, budgetActual: 17600000, incomeTotal: 19300000, expenseTotal: 16800000, researchIncome: 4100000, personnelExpense: 9800000 },
    { id: "UNIT-BUS", facultyId: "FAC-BUS", facultyLabel: "Iktisadi Idari ve Sosyal Bilimler Fakultesi", departmentId: "DEP-BUS", departmentLabel: "Isletme", studentCount: 1360, budgetTarget: 17200000, budgetActual: 16500000, incomeTotal: 18800000, expenseTotal: 15900000, researchIncome: 1600000, personnelExpense: 8700000 },
    { id: "UNIT-PSY", facultyId: "FAC-BUS", facultyLabel: "Iktisadi Idari ve Sosyal Bilimler Fakultesi", departmentId: "DEP-PSY", departmentLabel: "Psikoloji", studentCount: 970, budgetTarget: 16400000, budgetActual: 17100000, incomeTotal: 17600000, expenseTotal: 16900000, researchIncome: 900000, personnelExpense: 9400000 },
    { id: "UNIT-VCD", facultyId: "FAC-ART", facultyLabel: "Sanat ve Tasarim Fakultesi", departmentId: "DEP-VCD", departmentLabel: "Gorsel Iletisim Tasarimi", studentCount: 640, budgetTarget: 12900000, budgetActual: 13200000, incomeTotal: 13600000, expenseTotal: 13700000, researchIncome: 550000, personnelExpense: 7300000 },
    { id: "UNIT-ARCH", facultyId: "FAC-ART", facultyLabel: "Sanat ve Tasarim Fakultesi", departmentId: "DEP-ARCH", departmentLabel: "Ic Mimarlik", studentCount: 710, budgetTarget: 14100000, budgetActual: 14700000, incomeTotal: 14900000, expenseTotal: 15100000, researchIncome: 740000, personnelExpense: 8100000 },
  ];
}

function makeCapacityUnits(): CapacityUnitSummary[] {
  return [
    { id: "CAP-CENG", facultyId: "FAC-ENG", facultyLabel: "Muhendislik ve Mimarlik Fakultesi", departmentId: "DEP-CENG", departmentLabel: "Bilgisayar Muhendisligi", activeStudents: 1120, academicStaff: 34, classrooms: 12, labs: 5, tuitionRevenue: 21280000, totalCost: 16840000 },
    { id: "CAP-EEE", facultyId: "FAC-ENG", facultyLabel: "Muhendislik ve Mimarlik Fakultesi", departmentId: "DEP-EEE", departmentLabel: "Elektrik Elektronik Muhendisligi", activeStudents: 780, academicStaff: 28, classrooms: 9, labs: 6, tuitionRevenue: 14820000, totalCost: 13950000 },
    { id: "CAP-BUS", facultyId: "FAC-BUS", facultyLabel: "Iktisadi Idari ve Sosyal Bilimler Fakultesi", departmentId: "DEP-BUS", departmentLabel: "Isletme", activeStudents: 1295, academicStaff: 31, classrooms: 14, labs: 1, tuitionRevenue: 20760000, totalCost: 15180000 },
    { id: "CAP-PSY", facultyId: "FAC-BUS", facultyLabel: "Iktisadi Idari ve Sosyal Bilimler Fakultesi", departmentId: "DEP-PSY", departmentLabel: "Psikoloji", activeStudents: 910, academicStaff: 26, classrooms: 11, labs: 2, tuitionRevenue: 14560000, totalCost: 13820000 },
    { id: "CAP-VCD", facultyId: "FAC-ART", facultyLabel: "Sanat ve Tasarim Fakultesi", departmentId: "DEP-VCD", departmentLabel: "Gorsel Iletisim Tasarimi", activeStudents: 602, academicStaff: 20, classrooms: 8, labs: 3, tuitionRevenue: 10220000, totalCost: 11840000 },
    { id: "CAP-ARCH", facultyId: "FAC-ART", facultyLabel: "Sanat ve Tasarim Fakultesi", departmentId: "DEP-ARCH", departmentLabel: "Ic Mimarlik", activeStudents: 668, academicStaff: 22, classrooms: 9, labs: 4, tuitionRevenue: 11380000, totalCost: 12550000 },
  ];
}

export function getFinancialBaseline(): FinancialBaseline {
  return {
    periodOptions: [
      { id: "2024-2025", label: "2024-2025" },
      { id: "2025-2026", label: "2025-2026" },
    ],
    facultyOptions: [
      { id: "ALL", label: "Tum Fakulteler" },
      { id: "FAC-ENG", label: "Muhendislik ve Mimarlik Fakultesi" },
      { id: "FAC-BUS", label: "Iktisadi Idari ve Sosyal Bilimler Fakultesi" },
      { id: "FAC-ART", label: "Sanat ve Tasarim Fakultesi" },
    ],
    departmentOptions: [
      { id: "ALL", label: "Tum Bolumler" },
      { id: "DEP-CENG", label: "Bilgisayar Muhendisligi" },
      { id: "DEP-EEE", label: "Elektrik Elektronik Muhendisligi" },
      { id: "DEP-BUS", label: "Isletme" },
      { id: "DEP-PSY", label: "Psikoloji" },
      { id: "DEP-VCD", label: "Gorsel Iletisim Tasarimi" },
      { id: "DEP-ARCH", label: "Ic Mimarlik" },
    ],
    sourceMode: "mock",
    selectedPeriod: "2025-2026",
    selectedFacultyId: "ALL",
    selectedDepartmentId: "ALL",
    lastUpdated: "2026-07-29T11:45:00+03:00",
    targetBudget: 145000000,
    activeStudentCount: 11920,
    graduateCount: 2240,
    scholarshipStudentCount: 2860,
    averageTuition: 102000,
    averageScholarship: 24800,
    graduateAttributableCost: 36400000,
    categories: [
      { id: "income_tuition", label: "Ogrenim ucretleri", kind: "income", baselineAmount: 84000000, scenarioAmount: 84000000, active: true, adjustable: true },
      { id: "income_projects", label: "Proje gelirleri", kind: "income", baselineAmount: 18000000, scenarioAmount: 18000000, active: true, adjustable: true },
      { id: "income_certificates", label: "Sertifika ve surekli egitim gelirleri", kind: "income", baselineAmount: 11200000, scenarioAmount: 11200000, active: true, adjustable: true },
      { id: "income_industry", label: "Universite-sanayi is birligi gelirleri", kind: "income", baselineAmount: 9400000, scenarioAmount: 9400000, active: true, adjustable: true },
      { id: "income_donations", label: "Bagislar", kind: "income", baselineAmount: 4200000, scenarioAmount: 4200000, active: false, adjustable: true },
      { id: "income_sponsorship", label: "Sponsorluk gelirleri", kind: "income", baselineAmount: 3100000, scenarioAmount: 3100000, active: false, adjustable: true },
      { id: "income_other", label: "Diger faaliyet gelirleri", kind: "income", baselineAmount: 8300000, scenarioAmount: 8300000, active: true, adjustable: true },
      { id: "expense_academic_staff", label: "Akademik personel maaslari", kind: "expense", baselineAmount: 47200000, scenarioAmount: 47200000, active: true, adjustable: true },
      { id: "expense_admin_staff", label: "Idari personel maaslari", kind: "expense", baselineAmount: 16800000, scenarioAmount: 16800000, active: true, adjustable: true },
      { id: "expense_education", label: "Egitim giderleri", kind: "expense", baselineAmount: 9200000, scenarioAmount: 9200000, active: true, adjustable: true },
      { id: "expense_research", label: "Arastirma ve gelistirme giderleri", kind: "expense", baselineAmount: 14300000, scenarioAmount: 14300000, active: true, adjustable: true },
      { id: "expense_scholarship", label: "Burs giderleri", kind: "expense", baselineAmount: 12800000, scenarioAmount: 12800000, active: true, adjustable: true },
      { id: "expense_energy", label: "Bina ve enerji giderleri", kind: "expense", baselineAmount: 7600000, scenarioAmount: 7600000, active: true, adjustable: true },
      { id: "expense_technology", label: "Teknoloji ve laboratuvar giderleri", kind: "expense", baselineAmount: 9100000, scenarioAmount: 9100000, active: true, adjustable: true },
      { id: "expense_central_admin", label: "Merkezi idari giderler", kind: "expense", baselineAmount: 6200000, scenarioAmount: 6200000, active: true, adjustable: true },
      { id: "expense_investment", label: "Yatirim giderleri", kind: "expense", baselineAmount: 8500000, scenarioAmount: 8500000, active: true, adjustable: true },
      { id: "expense_other", label: "Diger giderler", kind: "expense", baselineAmount: 3800000, scenarioAmount: 3800000, active: true, adjustable: true },
    ],
    units: makeUnits(),
    monthlyNetFlow: [
      { label: "Eyl", income: 10800000, expense: 9800000 },
      { label: "Eki", income: 11800000, expense: 10200000 },
      { label: "Kas", income: 11600000, expense: 10400000 },
      { label: "Ara", income: 12500000, expense: 10900000 },
      { label: "Oca", income: 12300000, expense: 11200000 },
      { label: "Sub", income: 11900000, expense: 10800000 },
      { label: "Mar", income: 12400000, expense: 11100000 },
      { label: "Nis", income: 12700000, expense: 11500000 },
      { label: "May", income: 13100000, expense: 11800000 },
      { label: "Haz", income: 12900000, expense: 11700000 },
      { label: "Tem", income: 11200000, expense: 10500000 },
      { label: "Agu", income: 9800000, expense: 9300000 },
    ],
  };
}

export function getDefaultFinancialScenarioInput(): FinancialScenarioInput {
  return {
    scenarioName: "Dengeli buyume senaryosu",
    sourceMode: "manual",
    percentageMode: false,
    autoNormalize: false,
    studentCountDeltaPct: 0,
    averageTuitionDeltaPct: 0,
    scholarshipRateDeltaPct: 0,
    averageScholarshipDeltaPct: 0,
    academicStaffDeltaPct: 0,
    administrativeStaffDeltaPct: 0,
    personnelCostDeltaPct: 0,
    projectIncomeDeltaPct: 0,
    researchIncomeDeltaPct: 0,
    energyCostDeltaPct: 0,
    educationCostDeltaPct: 0,
    technologyInvestmentDeltaPct: 0,
    otherIncomeDeltaPct: 0,
    otherExpenseDeltaPct: 0,
  };
}

export function getCapacityBaseline(): CapacityBaseline {
  return {
    periodOptions: [
      { id: "2024-2025", label: "2024-2025" },
      { id: "2025-2026", label: "2025-2026" },
    ],
    facultyOptions: [
      { id: "ALL", label: "Tum Fakulteler" },
      { id: "FAC-ENG", label: "Muhendislik ve Mimarlik Fakultesi" },
      { id: "FAC-BUS", label: "Iktisadi Idari ve Sosyal Bilimler Fakultesi" },
      { id: "FAC-ART", label: "Sanat ve Tasarim Fakultesi" },
    ],
    departmentOptions: [
      { id: "ALL", label: "Tum Bolumler" },
      { id: "DEP-CENG", label: "Bilgisayar Muhendisligi" },
      { id: "DEP-EEE", label: "Elektrik Elektronik Muhendisligi" },
      { id: "DEP-BUS", label: "Isletme" },
      { id: "DEP-PSY", label: "Psikoloji" },
      { id: "DEP-VCD", label: "Gorsel Iletisim Tasarimi" },
      { id: "DEP-ARCH", label: "Ic Mimarlik" },
    ],
    selectedPeriod: "2025-2026",
    selectedFacultyId: "ALL",
    selectedDepartmentId: "ALL",
    sourceMode: "mock",
    lastUpdated: "2026-07-29T11:45:00+03:00",
    totalStudents: 12480,
    activeStudents: 11920,
    newAdmissions: 2480,
    graduateCount: 2240,
    academicStaff: 166,
    administrativeStaff: 94,
    averageTuition: 102000,
    scholarshipRate: 24,
    averageScholarship: 24800,
    targetStudentsPerAcademic: 24,
    coursesPerWeek: 490,
    sectionCount: 348,
    averageClassSize: 34,
    weeklyCourseHours: 18,
    labRequiredCourseRate: 34,
    labHoursPerCourse: 3,
    classrooms: [
      { id: "CLS-01", label: "Derslik A", seatCapacity: 72, weeklyHours: 54, plannedSeatHours: 3220 },
      { id: "CLS-02", label: "Derslik B", seatCapacity: 64, weeklyHours: 52, plannedSeatHours: 2850 },
      { id: "CLS-03", label: "Derslik C", seatCapacity: 84, weeklyHours: 56, plannedSeatHours: 3960 },
      { id: "CLS-04", label: "Derslik D", seatCapacity: 48, weeklyHours: 50, plannedSeatHours: 1980 },
    ],
    laboratories: [
      { id: "LAB-COMP-1", label: "Bilgisayar Laboratuvari 1", type: "computer", capacity: 42, weeklyHours: 55, plannedHours: 46, actualHours: 44, unavailableHours: 4 },
      { id: "LAB-CYBER-1", label: "Siber Guvenlik Laboratuvari", type: "cyber", capacity: 28, weeklyHours: 52, plannedHours: 47, actualHours: 45, unavailableHours: 3 },
      { id: "LAB-ELEC-1", label: "Elektronik Laboratuvari", type: "electronics", capacity: 24, weeklyHours: 50, plannedHours: 41, actualHours: 40, unavailableHours: 5 },
      { id: "LAB-BASIC-1", label: "Temel Bilimler Laboratuvari", type: "basic_science", capacity: 26, weeklyHours: 48, plannedHours: 33, actualHours: 31, unavailableHours: 4 },
      { id: "LAB-DESIGN-1", label: "Tasarim Studyosu", type: "design", capacity: 20, weeklyHours: 46, plannedHours: 36, actualHours: 35, unavailableHours: 2 },
    ],
    units: makeCapacityUnits(),
    scheduleHeatmap: [
      { day: "Pzt", hour: "09:00", utilizationPct: 72 },
      { day: "Pzt", hour: "13:00", utilizationPct: 84 },
      { day: "Pzt", hour: "17:00", utilizationPct: 69 },
      { day: "Sal", hour: "09:00", utilizationPct: 75 },
      { day: "Sal", hour: "13:00", utilizationPct: 88 },
      { day: "Sal", hour: "17:00", utilizationPct: 73 },
      { day: "Car", hour: "09:00", utilizationPct: 78 },
      { day: "Car", hour: "13:00", utilizationPct: 91 },
      { day: "Car", hour: "17:00", utilizationPct: 77 },
      { day: "Per", hour: "09:00", utilizationPct: 74 },
      { day: "Per", hour: "13:00", utilizationPct: 86 },
      { day: "Per", hour: "17:00", utilizationPct: 72 },
      { day: "Cum", hour: "09:00", utilizationPct: 68 },
      { day: "Cum", hour: "13:00", utilizationPct: 81 },
      { day: "Cum", hour: "17:00", utilizationPct: 63 },
    ],
  };
}

export function getDefaultCapacityScenarioInput(baseline: CapacityBaseline): CapacityScenarioInput {
  return {
    scenarioName: "Ogrenci-kapasite dengesi",
    sourceMode: "manual",
    totalStudents: baseline.totalStudents,
    activeStudents: baseline.activeStudents,
    newAdmissions: baseline.newAdmissions,
    graduateCount: baseline.graduateCount,
    growthPct: 0,
    courseCount: baseline.coursesPerWeek,
    sectionCount: baseline.sectionCount,
    averageClassSize: baseline.averageClassSize,
    weeklyCourseHours: baseline.weeklyCourseHours,
    labRequiredCourseRate: baseline.labRequiredCourseRate,
    labHoursPerCourse: baseline.labHoursPerCourse,
    academicStaff: baseline.academicStaff,
    targetStudentsPerAcademic: baseline.targetStudentsPerAcademic,
    classroomCount: baseline.classrooms.length,
    laboratoryCount: baseline.laboratories.length,
    classroomSeatCapacity: Math.round(baseline.classrooms.reduce((acc, item) => acc + item.seatCapacity, 0) / baseline.classrooms.length),
    laboratorySeatCapacity: Math.round(baseline.laboratories.reduce((acc, item) => acc + item.capacity, 0) / baseline.laboratories.length),
    availableWeeklyHours: Math.round(baseline.laboratories.reduce((acc, item) => acc + item.weeklyHours, 0) / baseline.laboratories.length),
    maintenanceHoursLoss: Math.round(baseline.laboratories.reduce((acc, item) => acc + item.unavailableHours, 0)),
    averageTuition: baseline.averageTuition,
    scholarshipRate: baseline.scholarshipRate,
  };
}
