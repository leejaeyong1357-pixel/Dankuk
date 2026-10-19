import type { Phrase, Scenario } from "./content";

/**
 * 직무별 활용 표현.
 *
 * 직무 목록은 SL 채용 페이지의 직무 구분(연구개발 · 생산기술 · 품질 · 영업 및 구매 ·
 * 경영지원, 14개 직무)을 따랐다. 상황과 문장은 자동차 램프·전장 부품 회사에서
 * 흔히 겪는 일을 바탕으로 새로 쓴 것이며, 회사의 실제 업무 기술서를 옮긴 것이 아니다.
 *
 * 직무마다 상황 3개, 상황마다 문장 3개. 숫자·날짜는 연습용 예시다.
 * 나라별 언어판은 lib/global/lang/job-*.ts 에 있다 (키는 영어 원문).
 */

/** 직무 — 목록에서 묶는 이름 */
export interface Job {
  /** 채용 페이지의 큰 구분 */
  area: string;
  name: string;
}

export const JOBS: Job[] = [
  { area: "연구개발", name: "기구설계" },
  { area: "연구개발", name: "선행연구" },
  { area: "연구개발", name: "광학설계" },
  { area: "연구개발", name: "시험" },
  { area: "생산기술", name: "생산기술" },
  { area: "품질", name: "품질" },
  { area: "영업 및 구매", name: "국내 영업" },
  { area: "영업 및 구매", name: "해외 영업" },
  { area: "영업 및 구매", name: "구매" },
  { area: "경영지원", name: "기획" },
  { area: "경영지원", name: "HR" },
  { area: "경영지원", name: "총무" },
  { area: "경영지원", name: "재무/회계" },
  { area: "경영지원", name: "IT" },
];

/** 목록 소분류 이름 — "연구개발 · 기구설계" */
export function jobGroup(j: Job): string {
  return j.area === j.name ? j.name : `${j.area} · ${j.name}`;
}

const P = (pairs: [string, string][]): Phrase[] => pairs.map(([en, ko]) => ({ en, ko }));

function S(n: number, job: number, title: string, subtitle: string, pairs: [string, string][]): Scenario {
  return {
    id: `j${String(n).padStart(2, "0")}`,
    kind: "job",
    group: jobGroup(JOBS[job]),
    title,
    subtitle,
    phrases: P(pairs),
  };
}

export const JOB_SCENARIOS: Scenario[] = [
  // ── 연구개발 · 기구설계 ──────────────────────────────
  S(1, 0, "도면 검토", "설계 리뷰 회의를 이끌 때", [
    ["Let's review the latest housing drawing together.", "최신 하우징 도면을 같이 검토하겠습니다."],
    ["We changed the bracket thickness to 2.5 millimeters.", "브래킷 두께를 2.5mm로 변경했습니다."],
    ["Please send us your comments by Friday.", "금요일까지 의견을 보내 주세요."],
  ]),
  S(2, 0, "설계 변경", "변경 요청을 전하고 승인을 받을 때", [
    ["The customer requested a design change on the mounting point.", "고객이 장착부 설계 변경을 요청했습니다."],
    ["This change will affect the mold schedule.", "이 변경은 금형 일정에 영향을 줍니다."],
    ["We need your approval before we update the 3D data.", "3D 데이터를 수정하기 전에 승인이 필요합니다."],
  ]),
  S(3, 0, "간섭 · 공차", "조립 문제를 짚을 때", [
    ["There is interference between the lens and the bezel.", "렌즈와 베젤 사이에 간섭이 있습니다."],
    ["The gap is out of tolerance by 0.3 millimeters.", "간격이 공차를 0.3mm 벗어났습니다."],
    ["Can you check it again with the latest model?", "최신 모델로 다시 확인해 주시겠어요?"],
  ]),

  // ── 연구개발 · 선행연구 ──────────────────────────────
  S(4, 1, "신기술 소개", "개발 중인 기술을 알릴 때", [
    ["We are developing a new lighting technology for next-generation vehicles.", "차세대 차량용 새 조명 기술을 개발하고 있습니다."],
    ["This prototype uses about thirty percent less power.", "이 시제품은 전력을 약 30% 덜 씁니다."],
    ["We would like to share our test results with you.", "시험 결과를 공유드리고 싶습니다."],
  ]),
  S(5, 1, "공동 개발 제안", "함께 개발하자고 제안할 때", [
    ["We propose a joint development project starting next year.", "내년부터 공동 개발 프로젝트를 제안드립니다."],
    ["Our team will handle the concept and early testing.", "저희 팀이 콘셉트와 초기 시험을 맡겠습니다."],
    ["Let's define the scope and the timeline first.", "먼저 범위와 일정을 정하시죠."],
  ]),
  S(6, 1, "기술 동향", "시장과 규제 흐름을 나눌 때", [
    ["What trends are you seeing in your market?", "그쪽 시장에서는 어떤 흐름이 보이나요?"],
    ["Many customers are asking for slimmer lamps.", "더 얇은 램프를 원하는 고객이 많습니다."],
    ["We should keep an eye on the new regulations.", "새 규제를 계속 지켜봐야 합니다."],
  ]),

  // ── 연구개발 · 광학설계 ──────────────────────────────
  S(7, 2, "배광 성능", "배광 결과를 설명할 때", [
    ["The beam pattern meets the regulation.", "배광 패턴이 법규를 만족합니다."],
    ["The light is a little too weak at this point.", "이 지점에서 빛이 조금 약합니다."],
    ["We will adjust the reflector shape to fix it.", "리플렉터 형상을 조정해서 해결하겠습니다."],
  ]),
  S(8, 2, "시뮬레이션 결과", "해석 결과를 공유할 때", [
    ["Here are the results of the optical simulation.", "광학 시뮬레이션 결과입니다."],
    ["The simulation and the measured data are very close.", "시뮬레이션과 측정 데이터가 매우 비슷합니다."],
    ["Glare is still a concern for oncoming drivers.", "맞은편 운전자에게 주는 눈부심이 아직 우려됩니다."],
  ]),
  S(9, 2, "광원 변경", "LED·렌즈 변경을 협의할 때", [
    ["We are changing the LED supplier for this model.", "이 모델의 LED 공급사를 바꿉니다."],
    ["The color of the light must stay the same.", "빛의 색은 그대로 유지돼야 합니다."],
    ["Could you send us samples for testing?", "시험용 샘플을 보내 주시겠어요?"],
  ]),

  // ── 연구개발 · 시험 ──────────────────────────────────
  S(10, 3, "시험 계획", "시험 일정과 조건을 맞출 때", [
    ["We will start the durability test next Monday.", "다음 주 월요일에 내구 시험을 시작합니다."],
    ["The test will take about four weeks.", "시험은 약 4주 걸립니다."],
    ["Please confirm the test conditions.", "시험 조건을 확인해 주세요."],
  ]),
  S(11, 3, "시험 결과 보고", "합격·불합격을 알릴 때", [
    ["All samples passed the vibration test.", "모든 샘플이 진동 시험을 통과했습니다."],
    ["Two samples showed fogging after the humidity test.", "습도 시험 후 샘플 두 개에서 김서림이 생겼습니다."],
    ["We are analyzing the root cause now.", "지금 원인을 분석하고 있습니다."],
  ]),
  S(12, 3, "재시험 · 데이터", "다시 시험하고 자료를 주고받을 때", [
    ["We need to repeat the test with new samples.", "새 샘플로 시험을 다시 해야 합니다."],
    ["Can you share the raw data from the test?", "시험 원본 데이터를 공유해 주시겠어요?"],
    ["We will send the final report by the end of the month.", "최종 보고서는 이달 말까지 보내겠습니다."],
  ]),

  // ── 생산기술 ─────────────────────────────────────────
  S(13, 4, "라인 셋업", "새 라인 준비 상황을 알릴 때", [
    ["The new line will be ready by the end of next month.", "새 라인은 다음 달 말까지 준비됩니다."],
    ["We are installing the equipment this week.", "이번 주에 설비를 설치하고 있습니다."],
    ["Please check the layout before we fix it.", "확정하기 전에 레이아웃을 확인해 주세요."],
  ]),
  S(14, 4, "생산성 개선", "사이클 타임을 줄일 때", [
    ["The cycle time is longer than our target.", "사이클 타임이 목표보다 깁니다."],
    ["We can save time by changing the order of the process.", "공정 순서를 바꾸면 시간을 줄일 수 있습니다."],
    ["Let's try it on one line first.", "먼저 한 라인에서 시도해 보시죠."],
  ]),
  S(15, 4, "설비 문제", "설비가 멈췄을 때", [
    ["The robot stopped twice this morning.", "오늘 아침 로봇이 두 번 멈췄습니다."],
    ["We are waiting for a spare part.", "예비 부품을 기다리고 있습니다."],
    ["Production should restart within two hours.", "두 시간 안에 생산이 다시 시작될 겁니다."],
  ]),

  // ── 품질 ─────────────────────────────────────────────
  S(16, 5, "불량 보고", "불량을 처음 알릴 때", [
    ["We found a defect in the latest shipment.", "최근 출하분에서 불량을 발견했습니다."],
    ["About fifty parts are affected.", "약 50개 부품이 해당됩니다."],
    ["We have stopped shipping until we confirm the cause.", "원인을 확인할 때까지 출하를 멈췄습니다."],
  ]),
  S(17, 5, "원인과 대책", "8D 보고를 설명할 때", [
    ["The root cause was a setting error on the machine.", "근본 원인은 설비의 설정 오류였습니다."],
    ["We have added a check to prevent it from happening again.", "재발하지 않도록 점검 항목을 추가했습니다."],
    ["We will submit the 8D report by Wednesday.", "8D 보고서는 수요일까지 제출하겠습니다."],
  ]),
  S(18, 5, "고객 감사", "공장 감사를 안내할 때", [
    ["Welcome to our plant. Let me show you our quality system.", "저희 공장에 오신 것을 환영합니다. 품질 시스템을 보여 드리겠습니다."],
    ["Every lamp is tested before shipping.", "모든 램프는 출하 전에 검사합니다."],
    ["Here are the inspection records for last month.", "지난달 검사 기록입니다."],
  ]),

  // ── 영업 및 구매 · 국내 영업 ─────────────────────────
  S(19, 6, "고객 요구 공유", "국내 고객 변경 사항을 해외 공장에 전할 때", [
    ["Our customer in Korea has changed the order volume.", "국내 고객이 주문 물량을 변경했습니다."],
    ["We need to supply an extra thousand units next month.", "다음 달 천 개를 추가로 공급해야 합니다."],
    ["Can your plant support this volume?", "그쪽 공장에서 이 물량을 감당할 수 있나요?"],
  ]),
  S(20, 6, "납기 조율", "고객 일정에 맞춰 당길 때", [
    ["The customer needs the parts one week earlier.", "고객이 부품을 일주일 일찍 필요로 합니다."],
    ["Is it possible to ship by air?", "항공으로 보낼 수 있을까요?"],
    ["I will explain the situation to the customer.", "고객에게 상황을 설명하겠습니다."],
  ]),
  S(21, 6, "신규 프로젝트", "수주 소식과 일정을 공유할 때", [
    ["We won a new project for a Korean electric vehicle.", "한국 전기차의 신규 프로젝트를 수주했습니다."],
    ["Mass production starts in the second half of next year.", "양산은 내년 하반기에 시작합니다."],
    ["I will share the schedule and the volume plan.", "일정과 물량 계획을 공유드리겠습니다."],
  ]),

  // ── 영업 및 구매 · 해외 영업 ─────────────────────────
  S(22, 7, "회사 소개", "처음 만나는 고객에게", [
    ["SL makes lamps and electronic parts for car makers around the world.", "SL은 전 세계 완성차 업체에 램프와 전장 부품을 공급합니다."],
    ["We have plants close to your production site.", "고객사 생산지 가까이에 공장이 있습니다."],
    ["We would like to quote for your next model.", "다음 모델 견적을 내고 싶습니다."],
  ]),
  S(23, 7, "견적 · 가격", "견적을 설명하고 협상할 때", [
    ["Here is our quotation for the rear lamp.", "리어 램프 견적서입니다."],
    ["The price includes tooling and packaging.", "가격에는 금형비와 포장비가 포함되어 있습니다."],
    ["We can offer a discount if the volume increases.", "물량이 늘면 할인을 드릴 수 있습니다."],
  ]),
  S(24, 7, "클레임 대응", "고객 불만을 받을 때", [
    ["We are sorry for the trouble this has caused.", "불편을 드려 죄송합니다."],
    ["Our quality team is already on site.", "저희 품질팀이 이미 현장에 가 있습니다."],
    ["We will cover the cost of the replacement parts.", "교체 부품 비용은 저희가 부담하겠습니다."],
  ]),

  // ── 영업 및 구매 · 구매 ──────────────────────────────
  S(25, 8, "견적 요청", "협력사에 견적을 받을 때", [
    ["Could you send us a quotation for these parts?", "이 부품들의 견적을 보내 주시겠어요?"],
    ["We need the price for an annual volume of fifty thousand.", "연간 5만 개 기준 가격이 필요합니다."],
    ["Please include the lead time in your quote.", "견적에 리드타임도 넣어 주세요."],
  ]),
  S(26, 8, "단가 협상", "가격을 낮춰 달라고 할 때", [
    ["Your price is higher than other suppliers.", "다른 공급사보다 가격이 높습니다."],
    ["Can you reduce it by five percent?", "5% 낮춰 주실 수 있나요?"],
    ["We are looking for a long-term partner.", "저희는 장기 파트너를 찾고 있습니다."],
  ]),
  S(27, 8, "납품 지연", "협력사 납품이 늦을 때", [
    ["Your delivery is three days late.", "납품이 3일 늦었습니다."],
    ["Our production line may stop if the parts don't arrive.", "부품이 오지 않으면 생산 라인이 멈출 수 있습니다."],
    ["Please send us a recovery plan today.", "오늘 중으로 만회 계획을 보내 주세요."],
  ]),

  // ── 경영지원 · 기획 ──────────────────────────────────
  S(28, 9, "사업 계획", "내년 계획을 공유할 때", [
    ["Let me share next year's business plan.", "내년 사업 계획을 공유드리겠습니다."],
    ["Our sales target is ten percent higher than this year.", "매출 목표는 올해보다 10% 높습니다."],
    ["Each plant will set its own action plan.", "각 공장이 자체 실행 계획을 세웁니다."],
  ]),
  S(29, 9, "실적 리뷰", "목표 대비 결과를 볼 때", [
    ["Let's review the results for the first half.", "상반기 실적을 검토하겠습니다."],
    ["Sales were on target, but costs went up.", "매출은 목표대로였지만 비용이 늘었습니다."],
    ["What is the main reason for the gap?", "차이가 난 주된 이유가 무엇인가요?"],
  ]),
  S(30, 9, "보고 자료 요청", "법인에 자료를 받을 때", [
    ["Please send us your monthly report by the fifth.", "월간 보고서를 5일까지 보내 주세요."],
    ["Use the new template from headquarters.", "본사의 새 양식을 사용해 주세요."],
    ["Let me know if any numbers are not final.", "확정되지 않은 숫자가 있으면 알려 주세요."],
  ]),

  // ── 경영지원 · HR ────────────────────────────────────
  S(31, 10, "채용 면접", "현지 채용 면접을 볼 때", [
    ["Thank you for coming to the interview today.", "오늘 면접에 와 주셔서 감사합니다."],
    ["Could you tell us about your previous work?", "이전에 하신 일에 대해 말씀해 주시겠어요?"],
    ["We will contact you within two weeks.", "2주 안에 연락드리겠습니다."],
  ]),
  S(32, 10, "교육 안내", "교육 일정을 알릴 때", [
    ["We will hold onboarding training for new employees.", "신입 직원 대상 입문 교육을 진행합니다."],
    ["The training will be held online next Tuesday.", "교육은 다음 주 화요일에 온라인으로 진행됩니다."],
    ["Please make sure everyone signs up.", "모두 신청하도록 해 주세요."],
  ]),
  S(33, 10, "제도 안내", "평가·인사 제도를 설명할 때", [
    ["Let me explain the new evaluation process.", "새 평가 절차를 설명드리겠습니다."],
    ["Each employee will set goals with their manager.", "직원마다 상사와 목표를 정합니다."],
    ["Please contact HR if you have any questions.", "궁금한 점은 인사팀에 문의해 주세요."],
  ]),

  // ── 경영지원 · 총무 ──────────────────────────────────
  S(34, 11, "방문 준비", "해외 손님을 맞을 때", [
    ["I booked a hotel near the plant for your visit.", "방문하시는 동안 묵을 공장 근처 호텔을 예약했습니다."],
    ["A driver will pick you up at the airport.", "기사가 공항으로 마중 나갑니다."],
    ["Please send me your flight details.", "항공편 정보를 보내 주세요."],
  ]),
  S(35, 11, "회의 · 식사", "회의실과 식사를 안내할 때", [
    ["The meeting room is booked from two to four.", "회의실은 2시부터 4시까지 예약되어 있습니다."],
    ["Lunch will be served in the cafeteria.", "점심은 구내식당에서 제공됩니다."],
    ["Let me know if you need anything else.", "다른 게 필요하시면 말씀해 주세요."],
  ]),
  S(36, 11, "안전 안내", "공장 출입 규칙을 알릴 때", [
    ["Please wear safety shoes in the plant.", "공장 안에서는 안전화를 신어 주세요."],
    ["Visitors must stay with their host at all times.", "방문객은 항상 안내자와 함께 있어야 합니다."],
    ["The emergency exit is on your right.", "비상구는 오른쪽에 있습니다."],
  ]),

  // ── 경영지원 · 재무/회계 ─────────────────────────────
  S(37, 12, "월 결산", "결산 자료를 모을 때", [
    ["We are closing the books for this month.", "이번 달 결산을 진행하고 있습니다."],
    ["Please send your invoices by the twenty-fifth.", "청구서를 25일까지 보내 주세요."],
    ["Some costs are missing from the report.", "보고서에 빠진 비용이 있습니다."],
  ]),
  S(38, 12, "대금 지급", "입금·지급을 확인할 때", [
    ["We have not received payment for this invoice.", "이 청구서의 대금을 아직 받지 못했습니다."],
    ["The payment was made yesterday.", "대금은 어제 지급되었습니다."],
    ["Could you check the bank details again?", "은행 정보를 다시 확인해 주시겠어요?"],
  ]),
  S(39, 12, "예산 · 환율", "비용과 예산을 점검할 때", [
    ["The exchange rate has affected our profit.", "환율이 이익에 영향을 줬습니다."],
    ["We need to review the budget for next quarter.", "다음 분기 예산을 다시 검토해야 합니다."],
    ["Please explain any cost over budget.", "예산을 넘은 비용은 설명해 주세요."],
  ]),

  // ── 경영지원 · IT ────────────────────────────────────
  S(40, 13, "시스템 장애", "장애를 알리고 안내할 때", [
    ["The system is down at the moment.", "지금 시스템이 멈춰 있습니다."],
    ["We are working to fix it as soon as possible.", "최대한 빨리 고치고 있습니다."],
    ["Please save your work and log out.", "작업을 저장하고 로그아웃해 주세요."],
  ]),
  S(41, 13, "새 시스템 도입", "도입 일정과 역할을 정할 때", [
    ["We are introducing a new ERP system next year.", "내년에 새 ERP 시스템을 도입합니다."],
    ["Training sessions will start in March.", "교육은 3월에 시작합니다."],
    ["Each plant needs one key user.", "공장마다 핵심 사용자가 한 명씩 필요합니다."],
  ]),
  S(42, 13, "보안 안내", "보안 수칙을 알릴 때", [
    ["Do not open emails from unknown senders.", "모르는 사람이 보낸 메일은 열지 마세요."],
    ["Please change your password every three months.", "비밀번호는 3개월마다 바꿔 주세요."],
    ["Report anything suspicious to the IT team.", "의심스러운 것은 IT팀에 알려 주세요."],
  ]),
];
