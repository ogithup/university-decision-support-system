import {
  CapacityBaseline,
  CapacityScenarioInput,
  CapacityScenarioResult,
  ComparisonMetric,
  FinancialBaseline,
  FinancialCategory,
  FinancialScenarioInput,
  FinancialScenarioResult,
  SavedScenario,
  ScenarioRisk,
  ThresholdLevel,
  metricThresholds,
} from "./decision-support";

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function percentageDifference(baseline: number, scenario: number) {
  if (baseline === 0) {
    return null;
  }
  return round(((scenario - baseline) / baseline) * 100, 1);
}

function statusFromThreshold(metric: string, value: number | null): ThresholdLevel {
  if (value === null) {
    return "watch";
  }
  const rule = metricThresholds.find((item) => item.metric === metric);
  if (!rule) {
    return "healthy";
  }
  if (rule.healthyMax !== undefined && value <= rule.healthyMax) {
    return "healthy";
  }
  if (rule.healthyMin !== undefined && value >= rule.healthyMin) {
    return "healthy";
  }
  if (rule.watchMax !== undefined && value <= rule.watchMax) {
    return "watch";
  }
  if (rule.watchMin !== undefined && value >= rule.watchMin) {
    return "watch";
  }
  return "risk";
}

function formatPercent(value: number | null) {
  return value === null ? "Veri gerekli" : `%${round(value, 1)}`;
}

function makeMetric(
  id: string,
  label: string,
  baseline: number | null,
  scenario: number | null,
  unit: "TRY" | "%" | "count",
  status: ThresholdLevel,
  tooltip: string,
  previousPeriodDelta = 0,
): ComparisonMetric {
  return {
    id,
    label,
    baseline,
    scenario,
    absoluteDifference: baseline === null || scenario === null ? null : round(scenario - baseline, unit === "TRY" ? 0 : 1),
    percentageDifference: baseline === null || scenario === null ? null : percentageDifference(baseline, scenario),
    previousPeriodDelta,
    unit,
    status,
    tooltip,
  };
}

function sumActive(items: FinancialCategory[]) {
  return items.filter((item) => item.active).reduce((acc, item) => acc + item.scenarioAmount, 0);
}

function cloneCategories(items: FinancialCategory[]) {
  return items.map((item) => ({ ...item }));
}

function createSavedScenario(name: string, result: FinancialScenarioResult | CapacityScenarioResult): SavedScenario {
  const riskCount = result.risks.length;
  const financial = result as FinancialScenarioResult;
  const capacity = result as CapacityScenarioResult;
  return {
    id: `${name.toLowerCase().replaceAll(" ", "-")}-${riskCount}`,
    name,
    reference: false,
    updatedAt: new Date("2026-07-29T12:10:00+03:00").toISOString(),
    incomeTotal: financial.scenarioMetrics?.find((item) => item.id === "income_total")?.scenario || 0,
    expenseTotal: financial.scenarioMetrics?.find((item) => item.id === "expense_total")?.scenario || 0,
    netBalance: financial.scenarioMetrics?.find((item) => item.id === "net_balance")?.scenario || 0,
    studentCost: capacity.metrics?.find((item) => item.id === "student_cost")?.scenario || null,
    personnelNeed: capacity.metrics?.find((item) => item.id === "required_staff")?.scenario || null,
    classroomOccupancy: capacity.metrics?.find((item) => item.id === "classroom_occupancy")?.scenario || null,
    laboratoryOccupancy: capacity.metrics?.find((item) => item.id === "laboratory_occupancy")?.scenario || null,
    riskCount,
  };
}

export function applyFinancialScenario(baseline: FinancialBaseline, input: FinancialScenarioInput): FinancialCategory[] {
  const categories = cloneCategories(baseline.categories);
  const scholarshipRate = (baseline.scholarshipStudentCount / Math.max(baseline.activeStudentCount, 1)) * 100;
  const scenarioStudentCount = baseline.activeStudentCount * (1 + input.studentCountDeltaPct / 100);
  const scenarioTuition = baseline.averageTuition * (1 + input.averageTuitionDeltaPct / 100);
  const scenarioScholarshipRate = scholarshipRate * (1 + input.scholarshipRateDeltaPct / 100);
  const scenarioScholarship = baseline.averageScholarship * (1 + input.averageScholarshipDeltaPct / 100);

  return categories.map((item) => {
    let scenarioAmount = item.baselineAmount;
    switch (item.id) {
      case "income_tuition":
        scenarioAmount = scenarioStudentCount * scenarioTuition;
        break;
      case "income_projects":
        scenarioAmount = item.baselineAmount * (1 + input.projectIncomeDeltaPct / 100);
        break;
      case "income_industry":
        scenarioAmount = item.baselineAmount * (1 + input.researchIncomeDeltaPct / 100);
        break;
      case "income_other":
        scenarioAmount = item.baselineAmount * (1 + input.otherIncomeDeltaPct / 100);
        break;
      case "expense_scholarship":
        scenarioAmount = scenarioStudentCount * (scenarioScholarshipRate / 100) * scenarioScholarship;
        break;
      case "expense_academic_staff":
        scenarioAmount = item.baselineAmount * (1 + (input.academicStaffDeltaPct + input.personnelCostDeltaPct) / 100);
        break;
      case "expense_admin_staff":
        scenarioAmount = item.baselineAmount * (1 + (input.administrativeStaffDeltaPct + input.personnelCostDeltaPct) / 100);
        break;
      case "expense_energy":
        scenarioAmount = item.baselineAmount * (1 + input.energyCostDeltaPct / 100);
        break;
      case "expense_education":
        scenarioAmount = item.baselineAmount * (1 + input.educationCostDeltaPct / 100);
        break;
      case "expense_technology":
      case "expense_investment":
        scenarioAmount = item.baselineAmount * (1 + input.technologyInvestmentDeltaPct / 100);
        break;
      case "expense_other":
        scenarioAmount = item.baselineAmount * (1 + input.otherExpenseDeltaPct / 100);
        break;
      default:
        scenarioAmount = item.baselineAmount;
        break;
    }
    return { ...item, scenarioAmount: Math.max(0, round(scenarioAmount, 0)) };
  });
}

export function calculateFinancialScenario(
  baseline: FinancialBaseline,
  scenarioItems: FinancialCategory[],
  input: FinancialScenarioInput,
  savedScenarios: SavedScenario[] = [],
): FinancialScenarioResult {
  const incomeItems = scenarioItems.filter((item) => item.kind === "income");
  const expenseItems = scenarioItems.filter((item) => item.kind === "expense");
  const baselineIncome = baseline.categories.filter((item) => item.kind === "income" && item.active).reduce((acc, item) => acc + item.baselineAmount, 0);
  const baselineExpense = baseline.categories.filter((item) => item.kind === "expense" && item.active).reduce((acc, item) => acc + item.baselineAmount, 0);
  const scenarioIncome = sumActive(incomeItems);
  const scenarioExpense = sumActive(expenseItems);
  const scenarioStudents = Math.max(1, round(baseline.activeStudentCount * (1 + input.studentCountDeltaPct / 100), 0));
  const graduateCost = baseline.graduateAttributableCost;
  const personnelExpenseBaseline =
    baseline.categories.find((item) => item.id === "expense_academic_staff")!.baselineAmount +
    baseline.categories.find((item) => item.id === "expense_admin_staff")!.baselineAmount;
  const personnelExpenseScenario =
    expenseItems.find((item) => item.id === "expense_academic_staff")!.scenarioAmount +
    expenseItems.find((item) => item.id === "expense_admin_staff")!.scenarioAmount;
  const researchIncomeBaseline =
    baseline.categories.find((item) => item.id === "income_projects")!.baselineAmount +
    baseline.categories.find((item) => item.id === "income_industry")!.baselineAmount;
  const researchIncomeScenario =
    incomeItems.find((item) => item.id === "income_projects")!.scenarioAmount +
    incomeItems.find((item) => item.id === "income_industry")!.scenarioAmount;
  const baselineBudgetRealization = (baselineExpense / baseline.targetBudget) * 100;
  const scenarioBudgetRealization = (scenarioExpense / baseline.targetBudget) * 100;
  const baselineStudentIncome = baselineIncome / baseline.activeStudentCount;
  const scenarioStudentIncome = scenarioIncome / scenarioStudents;
  const baselineStudentCost = baselineExpense / baseline.activeStudentCount;
  const scenarioStudentCost = scenarioExpense / scenarioStudents;
  const baselineGraduateCost = graduateCost ? graduateCost / Math.max(baseline.graduateCount, 1) : null;
  const scenarioGraduateCost = graduateCost ? (graduateCost * (scenarioExpense / baselineExpense)) / Math.max(baseline.graduateCount, 1) : null;
  const baselinePersonnelRatio = (personnelExpenseBaseline / baselineExpense) * 100;
  const scenarioPersonnelRatio = (personnelExpenseScenario / scenarioExpense) * 100;
  const baselineScholarshipRatio = (baseline.categories.find((item) => item.id === "expense_scholarship")!.baselineAmount / baselineIncome) * 100;
  const scenarioScholarshipRatio = (expenseItems.find((item) => item.id === "expense_scholarship")!.scenarioAmount / scenarioIncome) * 100;
  const baselineResearchShare = (researchIncomeBaseline / baselineIncome) * 100;
  const scenarioResearchShare = (researchIncomeScenario / scenarioIncome) * 100;

  const baselineMetrics = [
    makeMetric("income_total", "Toplam Gelir", baselineIncome, baselineIncome, "TRY", "healthy", "Tum aktif gelir kalemlerinin toplami.", 4.8),
    makeMetric("expense_total", "Toplam Gider", baselineExpense, baselineExpense, "TRY", "watch", "Tum aktif gider kalemlerinin toplami.", 6.4),
    makeMetric("net_balance", "Net Butce Dengesi", baselineIncome - baselineExpense, baselineIncome - baselineExpense, "TRY", baselineIncome - baselineExpense >= 0 ? "healthy" : "risk", "Toplam gelir eksi toplam gider.", 2.1),
    makeMetric("budget_realization", "Butce Gerceklesme Orani", baselineBudgetRealization, baselineBudgetRealization, "%", statusFromThreshold("budget_realization", baselineBudgetRealization), "Gerceklesen tutar / hedef tutar x 100.", 1.2),
    makeMetric("student_income", "Ogrenci Basina Gelir", baselineStudentIncome, baselineStudentIncome, "TRY", "healthy", "Toplam gelir / aktif ogrenci sayisi.", 3.4),
    makeMetric("student_cost", "Ogrenci Basina Maliyet", baselineStudentCost, baselineStudentCost, "TRY", "watch", "Toplam gider / aktif ogrenci sayisi.", 2.7),
    makeMetric("graduate_cost", "Mezun Basina Maliyet", baselineGraduateCost, baselineGraduateCost, "TRY", baselineGraduateCost === null ? "watch" : "healthy", "Graduate attributable cost / mezun sayisi.", 0.8),
    makeMetric("personnel_ratio", "Personel Gider Orani", baselinePersonnelRatio, baselinePersonnelRatio, "%", statusFromThreshold("personnel_expense_ratio", baselinePersonnelRatio), "Akademik + idari personel giderleri / toplam gider x 100.", 0.9),
    makeMetric("research_share", "Arastirma Geliri Payi", baselineResearchShare, baselineResearchShare, "%", "healthy", "Proje + universite sanayi gelirleri / toplam gelir.", 1.1),
    makeMetric("scholarship_ratio", "Burslarin Gelire Orani", baselineScholarshipRatio, baselineScholarshipRatio, "%", "watch", "Burs giderleri / toplam gelir x 100.", 0.5),
  ];

  const scenarioMetrics = [
    makeMetric("income_total", "Toplam Gelir", baselineIncome, scenarioIncome, "TRY", "healthy", "Tum aktif gelir kalemlerinin toplami.", 4.8),
    makeMetric("expense_total", "Toplam Gider", baselineExpense, scenarioExpense, "TRY", scenarioExpense > baselineExpense ? "watch" : "healthy", "Tum aktif gider kalemlerinin toplami.", 6.4),
    makeMetric("net_balance", "Net Butce Dengesi", baselineIncome - baselineExpense, scenarioIncome - scenarioExpense, "TRY", scenarioIncome - scenarioExpense >= 0 ? "healthy" : "risk", "Toplam gelir eksi toplam gider.", 2.1),
    makeMetric("budget_realization", "Butce Gerceklesme Orani", baselineBudgetRealization, scenarioBudgetRealization, "%", statusFromThreshold("budget_realization", scenarioBudgetRealization), "Gerceklesen tutar / hedef tutar x 100.", 1.2),
    makeMetric("student_income", "Ogrenci Basina Gelir", baselineStudentIncome, scenarioStudentIncome, "TRY", "healthy", "Toplam gelir / aktif ogrenci sayisi.", 3.4),
    makeMetric("student_cost", "Ogrenci Basina Maliyet", baselineStudentCost, scenarioStudentCost, "TRY", scenarioStudentCost > baselineStudentCost ? "watch" : "healthy", "Toplam gider / aktif ogrenci sayisi.", 2.7),
    makeMetric("graduate_cost", "Mezun Basina Maliyet", baselineGraduateCost, scenarioGraduateCost, "TRY", scenarioGraduateCost === null ? "watch" : "healthy", "Graduate attributable cost / mezun sayisi.", 0.8),
    makeMetric("personnel_ratio", "Personel Gider Orani", baselinePersonnelRatio, scenarioPersonnelRatio, "%", statusFromThreshold("personnel_expense_ratio", scenarioPersonnelRatio), "Akademik + idari personel giderleri / toplam gider x 100.", 0.9),
    makeMetric("research_share", "Arastirma Geliri Payi", baselineResearchShare, scenarioResearchShare, "%", scenarioResearchShare >= baselineResearchShare ? "healthy" : "watch", "Proje + universite sanayi gelirleri / toplam gelir.", 1.1),
    makeMetric("scholarship_ratio", "Burslarin Gelire Orani", baselineScholarshipRatio, scenarioScholarshipRatio, "%", scenarioScholarshipRatio > baselineScholarshipRatio ? "watch" : "healthy", "Burs giderleri / toplam gelir x 100.", 0.5),
  ];

  const incomeDistribution = incomeItems.filter((item) => item.active).map((item) => ({
    label: item.label,
    amount: item.scenarioAmount,
    sharePct: round((item.scenarioAmount / Math.max(scenarioIncome, 1)) * 100, 1),
  }));
  const expenseDistribution = expenseItems.filter((item) => item.active).map((item) => ({
    label: item.label,
    amount: item.scenarioAmount,
    sharePct: round((item.scenarioAmount / Math.max(scenarioExpense, 1)) * 100, 1),
  }));

  const unitComparisons = baseline.units.map((unit) => {
    const ratio = unit.incomeTotal / Math.max(baselineIncome, 1);
    const scenarioUnitIncome = scenarioIncome * ratio;
    const scenarioUnitExpense = scenarioExpense * (unit.expenseTotal / Math.max(baselineExpense, 1));
    return {
      label: `${unit.facultyLabel} / ${unit.departmentLabel}`,
      income: round(scenarioUnitIncome, 0),
      expense: round(scenarioUnitExpense, 0),
      variancePct: round(((scenarioUnitExpense - unit.budgetTarget) / unit.budgetTarget) * 100, 1),
      studentCost: round(scenarioUnitExpense / unit.studentCount, 0),
    };
  });

  const waterfall = [
    { label: "Baseline net", value: round(baselineIncome - baselineExpense, 0) },
    { label: "Gelir etkisi", value: round(scenarioIncome - baselineIncome, 0) },
    { label: "Gider etkisi", value: round(-(scenarioExpense - baselineExpense), 0) },
    { label: "Senaryo net", value: round(scenarioIncome - scenarioExpense, 0) },
  ];

  const monthlyNetFlow = baseline.monthlyNetFlow.map((item) => ({
    label: item.label,
    baseline: item.income - item.expense,
    scenario: round((item.income * (scenarioIncome / baselineIncome)) - (item.expense * (scenarioExpense / baselineExpense)), 0),
  }));

  const risingExpenses = expenseItems
    .map((item) => ({ label: item.label, value: item.scenarioAmount - item.baselineAmount }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);
  const fallingIncome = incomeItems
    .map((item) => ({ label: item.label, value: item.scenarioAmount - item.baselineAmount }))
    .filter((item) => item.value < 0)
    .sort((a, b) => a.value - b.value)
    .slice(0, 3);

  const risks: ScenarioRisk[] = [
    {
      id: "FIN-RSK-01",
      title: "Personel gider orani risk bandina yaklasiyor",
      owner: "Mali Isler",
      level: statusFromThreshold("personnel_expense_ratio", scenarioPersonnelRatio),
      currentValue: formatPercent(baselinePersonnelRatio),
      scenarioValue: formatPercent(scenarioPersonnelRatio),
      thresholdLabel: "%60 kritik esik",
      distanceToThreshold: `%${round(60 - scenarioPersonnelRatio, 1)}`,
      probableCause: "Personel ve maliyet artis etkisi",
      impact: "Net dengeyi baskilar",
      action: "Kadro kararlarini proje ve arastirma gelir senaryosuyla birlikte planlayin.",
    },
    {
      id: "FIN-RSK-02",
      title: "Birim butce sapmasi artiyor",
      owner: "Strateji Gelistirme",
      level: scenarioBudgetRealization > 105 ? "risk" : "watch",
      currentValue: formatPercent(baselineBudgetRealization),
      scenarioValue: formatPercent(scenarioBudgetRealization),
      thresholdLabel: "%95-%105 hedef bandi",
      distanceToThreshold: `${round(Math.abs(scenarioBudgetRealization - 105), 1)} puan`,
      probableCause: "Gider buyumesi hedef butceyi asiyor",
      impact: "Harcamalarin yeniden dagitimi gerekebilir",
      action: "Teknoloji ve enerji kalemlerini senaryo oncesi yeniden dengeleyin.",
    },
  ];

  const totalDistributionPct = round(expenseDistribution.reduce((acc, item) => acc + item.sharePct, 0), 1);

  return {
    baselineMetrics,
    scenarioMetrics,
    incomeItems,
    expenseItems,
    incomeDistribution,
    expenseDistribution,
    unitComparisons,
    monthlyNetFlow,
    waterfall,
    topChanges: { risingExpenses, fallingIncome },
    risks,
    warnings: totalDistributionPct !== 100 ? [`Gider dagilimi toplamda %${totalDistributionPct} ediyor.`] : [],
    assumptions: [
      "Butce hedefi mevcut donem kurumsal hedefinin mock karsiligidir.",
      "Mezun basina maliyet graduateAttributableCost alanindan hesaplanir; veri yoksa KPI bos kalir.",
      "Arastirma geliri payi proje ve universite-sanayi gelirlerinden turetilir.",
    ],
    totalDistributionPct,
    savedScenarios: [...savedScenarios, createSavedScenario(input.scenarioName, { risks, scenarioMetrics } as FinancialScenarioResult)].slice(-3),
  };
}

export function calculateCapacityScenario(
  baseline: CapacityBaseline,
  input: CapacityScenarioInput,
  savedScenarios: SavedScenario[] = [],
): CapacityScenarioResult {
  const grossTuition = input.activeStudents * input.averageTuition;
  const estimatedScholarships = input.activeStudents * (input.scholarshipRate / 100) * baseline.averageScholarship;
  const netTuition = grossTuition - estimatedScholarships;
  const requiredAcademicStaff = Math.ceil(input.activeStudents / Math.max(input.targetStudentsPerAcademic, 1));
  const additionalNeed = Math.max(0, requiredAcademicStaff - input.academicStaff);
  const excessStaff = Math.max(0, input.academicStaff - requiredAcademicStaff);

  const classroomSeatHours = input.classroomCount * input.classroomSeatCapacity * input.availableWeeklyHours;
  const plannedClassSeatHours = input.sectionCount * input.averageClassSize * input.weeklyCourseHours;
  const classroomOccupancy = classroomSeatHours === 0 ? null : (plannedClassSeatHours / classroomSeatHours) * 100;

  const availableLabHours = Math.max(0, input.laboratoryCount * input.availableWeeklyHours - input.maintenanceHoursLoss);
  const demandedLabHours = input.courseCount * (input.labRequiredCourseRate / 100) * input.labHoursPerCourse;
  const laboratoryOccupancy = availableLabHours === 0 ? null : (demandedLabHours / availableLabHours) * 100;
  const labHoursGap = Math.max(0, demandedLabHours - availableLabHours);

  const scenarioTotalCost = baseline.units.reduce((acc, unit) => acc + unit.totalCost, 0) * (1 + input.growthPct / 180);
  const baselineTotalCost = baseline.units.reduce((acc, unit) => acc + unit.totalCost, 0);
  const baselineNetBalance = baseline.units.reduce((acc, unit) => acc + (unit.tuitionRevenue - unit.totalCost), 0);
  const scenarioNetBalance = netTuition - scenarioTotalCost;
  const baselineStudentCost = baselineTotalCost / baseline.activeStudents;
  const scenarioStudentCost = scenarioTotalCost / Math.max(input.activeStudents, 1);

  const metrics = [
    makeMetric("gross_tuition", "Tahmini Ogrenim Ucreti Geliri", baseline.activeStudents * baseline.averageTuition, grossTuition, "TRY", "healthy", "Ucret odeyen aktif ogrenci x ortalama ogrenim ucreti.", 4.2),
    makeMetric("net_tuition", "Burslar Sonrasi Net Ogrenim Geliri", baseline.activeStudents * baseline.averageTuition - baseline.activeStudents * (baseline.scholarshipRate / 100) * baseline.averageScholarship, netTuition, "TRY", "healthy", "Brut ogrenim ucreti geliri eksi burs etkisi.", 3.7),
    makeMetric("required_staff", "Gerekli Akademik Personel", Math.ceil(baseline.activeStudents / baseline.targetStudentsPerAcademic), requiredAcademicStaff, "count", additionalNeed > 0 ? "watch" : "healthy", "Aktif ogrenci / hedef ogrenci-akademisyen orani.", 1.4),
    makeMetric("classroom_occupancy", "Derslik Doluluk Orani", (baseline.sectionCount * baseline.averageClassSize * baseline.weeklyCourseHours) / (baseline.classrooms.length * Math.round(baseline.classrooms.reduce((acc, item) => acc + item.seatCapacity, 0) / baseline.classrooms.length) * Math.round(baseline.laboratories.reduce((acc, item) => acc + item.weeklyHours, 0) / baseline.laboratories.length)) * 100, classroomOccupancy, "%", statusFromThreshold("classroom_occupancy", classroomOccupancy), "Planlanan derslik koltuk saati / kullanilabilir derslik koltuk saati.", 2.6),
    makeMetric("laboratory_occupancy", "Laboratuvar Doluluk Orani", (baseline.coursesPerWeek * (baseline.labRequiredCourseRate / 100) * baseline.labHoursPerCourse) / Math.max(1, baseline.laboratories.length * Math.round(baseline.laboratories.reduce((acc, item) => acc + item.weeklyHours, 0) / baseline.laboratories.length) - Math.round(baseline.laboratories.reduce((acc, item) => acc + item.unavailableHours, 0))) * 100, laboratoryOccupancy, "%", statusFromThreshold("laboratory_occupancy", laboratoryOccupancy), "Planlanan laboratuvar saati / kullanilabilir laboratuvar saati.", 3.1),
    makeMetric("student_cost", "Ogrenci Basina Maliyet", baselineStudentCost, scenarioStudentCost, "TRY", scenarioStudentCost > baselineStudentCost ? "watch" : "healthy", "Toplam gider / aktif ogrenci.", 2.1),
    makeMetric("net_balance", "Net Butce Dengesi", baselineNetBalance, scenarioNetBalance, "TRY", scenarioNetBalance >= 0 ? "healthy" : "risk", "Net tuition eksi toplam maliyet.", 1.5),
  ];

  const laboratoryBreakdown = baseline.laboratories.map((lab) => {
    const availableSeatHours = lab.capacity * Math.max(0, lab.weeklyHours - lab.unavailableHours);
    const demandedSeatHours = (demandedLabHours / Math.max(baseline.laboratories.length, 1)) * input.laboratorySeatCapacity;
    const utilizationPct = availableSeatHours === 0 ? 0 : round((demandedSeatHours / availableSeatHours) * 100, 1);
    return {
      label: lab.label,
      type: lab.type,
      availableSeatHours,
      demandedSeatHours: round(demandedSeatHours, 0),
      utilizationPct,
      gapHours: Math.max(0, round((demandedSeatHours - availableSeatHours) / Math.max(input.laboratorySeatCapacity, 1), 1)),
    };
  });

  const facultyMatrix = baseline.units.map((unit) => ({
    label: `${unit.facultyLabel} / ${unit.departmentLabel}`,
    activeStudents: Math.round(unit.activeStudents * (input.activeStudents / baseline.activeStudents)),
    studentCost: round((unit.totalCost * (scenarioTotalCost / baselineTotalCost)) / Math.max(1, unit.activeStudents), 0),
    capacityPressure: round((unit.activeStudents / Math.max(1, unit.academicStaff * input.targetStudentsPerAcademic)) * 100, 1),
  }));

  const waterfall = [
    { label: "Baseline denge", value: round(baselineNetBalance, 0) },
    { label: "Tuition etkisi", value: round(netTuition - (baseline.activeStudents * baseline.averageTuition - baseline.activeStudents * (baseline.scholarshipRate / 100) * baseline.averageScholarship), 0) },
    { label: "Maliyet etkisi", value: round(-(scenarioTotalCost - baselineTotalCost), 0) },
    { label: "Senaryo denge", value: round(scenarioNetBalance, 0) },
  ];

  const heatmap = baseline.scheduleHeatmap.map((cell) => ({
    ...cell,
    utilizationPct: Math.min(100, Math.max(28, round(cell.utilizationPct * (1 + input.growthPct / 150), 0))),
  }));

  const risks: ScenarioRisk[] = [
    {
      id: "CAP-RSK-01",
      title: "Laboratuvar saat acigi olusuyor",
      owner: "Yapi Isleri",
      level: labHoursGap > 0 ? "risk" : "healthy",
      currentValue: `${round((baseline.coursesPerWeek * (baseline.labRequiredCourseRate / 100) * baseline.labHoursPerCourse), 0)} saat`,
      scenarioValue: `${round(demandedLabHours, 0)} saat`,
      thresholdLabel: `${round(availableLabHours, 0)} saat kullanilabilir`,
      distanceToThreshold: `${round(availableLabHours - demandedLabHours, 0)} saat`,
      probableCause: "Lab gerektiren ders orani ve kurs saatindeki artis",
      impact: "Ozellikle bilgisayar ve siber guvenlik lablarinda baski olusur",
      action: "Aksam vardiyasi veya ilave laboratuvar planlayin.",
    },
    {
      id: "CAP-RSK-02",
      title: "Akademik personel ihtiyaci artiyor",
      owner: "Insan Kaynaklari",
      level: additionalNeed > 0 ? "watch" : "healthy",
      currentValue: `${input.academicStaff} kisi`,
      scenarioValue: `${requiredAcademicStaff} kisi`,
      thresholdLabel: `${input.targetStudentsPerAcademic} ogrenci / akademisyen hedefi`,
      distanceToThreshold: `${additionalNeed} ek kadro`,
      probableCause: "Aktif ogrenci artisina gore kadro uyumsuzlugu",
      impact: "Ders yukleri ve ogrenci basi destek seviyesi etkilenir",
      action: "Kadro planini bolum bazli acin veya hedef orani gecici esnetin.",
    },
  ];

  return {
    metrics,
    tuitionImpact: {
      grossTuition: round(grossTuition, 0),
      estimatedScholarships: round(estimatedScholarships, 0),
      netTuition: round(netTuition, 0),
    },
    staffNeed: {
      currentAcademicStaff: input.academicStaff,
      requiredAcademicStaff,
      additionalNeed,
      excessStaff,
    },
    occupancy: {
      classroomPct: classroomOccupancy ? round(classroomOccupancy, 1) : null,
      laboratoryPct: laboratoryOccupancy ? round(laboratoryOccupancy, 1) : null,
      labHoursGap: round(labHoursGap, 1),
    },
    laboratoryBreakdown,
    facultyMatrix,
    waterfall,
    heatmap,
    risks,
    assumptions: [
      "Heatmap verisi gercek saatlik akis yerine deterministik mock schedule uzerinden turetildi.",
      "Laboratuvar uygunlugu tur bazinda korunur; baska turdeki bos kapasite otomatik kullanilmaz.",
      "Nihai parasal hesap backend decimal modeline tasinabilecek sekilde tek provider sozlesmesine baglidir.",
    ],
    savedScenarios: [...savedScenarios, createSavedScenario(input.scenarioName, { risks, metrics } as CapacityScenarioResult)].slice(-3),
  };
}
