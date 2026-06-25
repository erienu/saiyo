import { useMemo, useState } from 'react';
import FileUpload from './components/FileUpload';
import KpiCards from './components/KpiCards';
import Section from './components/Section';
import FunnelChartView from './components/FunnelChartView';
import MonthlyTrendChart from './components/MonthlyTrendChart';
import LeadTimeChart from './components/LeadTimeChart';
import ChannelTable from './components/ChannelTable';
import ChannelChart from './components/ChannelChart';
import InterviewerTable from './components/InterviewerTable';
import TargetSettings from './components/TargetSettings';
import HiringSummaryHero from './components/HiringSummaryHero';
import HealthScoreSignal from './components/HealthScoreSignal';
import KpiSettings from './components/KpiSettings';
import PeriodFilter, { currentMonthRange } from './components/PeriodFilter';
import PositionPipelineTable from './components/PositionPipelineTable';
import { parseApplicantsCsv } from './lib/csv';
import { generateHealthScoreAdvice } from './lib/advice';
import {
  buildChannelStats,
  buildFunnel,
  buildHealthScore,
  buildInterviewerStats,
  buildLeadTimes,
  buildMonthlyTrend,
  buildOverallLeadTime,
  buildPositionPipelines,
  buildTargetProgress,
  filterByPeriod,
  getPositions,
} from './lib/metrics';
import {
  clearApplicants,
  getHealthScoreConfigForPosition,
  loadApplicants,
  loadHealthScoreConfigs,
  loadTargets,
  saveApplicants,
  saveHealthScoreConfigs,
  saveTargets,
  type HealthScoreConfigsByPosition,
} from './lib/storage';
import type { Applicant, DateRange, HealthScoreConfig, PositionTarget } from './types';

function App() {
  const [applicants, setApplicants] = useState<Applicant[]>(() => loadApplicants());
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [targets, setTargets] = useState<PositionTarget[]>(loadTargets());
  const [healthScoreConfigs, setHealthScoreConfigs] = useState<HealthScoreConfigsByPosition>(
    loadHealthScoreConfigs()
  );
  const [selectedPosition, setSelectedPosition] = useState<string>('全ポジション');
  const [period, setPeriod] = useState<DateRange>(() => currentMonthRange());

  const positions = useMemo(() => getPositions(applicants), [applicants]);

  const periodFiltered = useMemo(() => filterByPeriod(applicants, period), [applicants, period]);

  const filtered = useMemo(
    () =>
      selectedPosition === '全ポジション'
        ? periodFiltered
        : periodFiltered.filter((a) => a.position === selectedPosition),
    [periodFiltered, selectedPosition]
  );

  const funnel = useMemo(() => buildFunnel(filtered), [filtered]);
  const targetProgress = useMemo(() => buildTargetProgress(applicants, targets), [applicants, targets]);
  const leadTimes = useMemo(() => buildLeadTimes(filtered), [filtered]);
  const overallLeadTime = useMemo(() => buildOverallLeadTime(filtered), [filtered]);
  const channelStats = useMemo(() => buildChannelStats(filtered), [filtered]);
  const { rows: interviewerRows, stageAverages } = useMemo(
    () => buildInterviewerStats(filtered),
    [filtered]
  );
  const monthlyTrend = useMemo(() => buildMonthlyTrend(filtered), [filtered]);
  const positionPipelines = useMemo(() => buildPositionPipelines(filtered), [filtered]);

  // KPI設定・ヘルススコアはポジションごとに独立した目標値・期間・遷移率を持つ(ページ上部の期間フィルターとは独立)。
  const healthScoreByPosition = useMemo(
    () =>
      positions.map((position) => {
        const config = getHealthScoreConfigForPosition(healthScoreConfigs, position);
        const positionApplicants = applicants.filter((a) => a.position === position);
        const health = buildHealthScore(positionApplicants, config);
        const scope =
          config.periodStart && config.periodEnd
            ? filterByPeriod(positionApplicants, { start: config.periodStart, end: config.periodEnd })
            : positionApplicants;
        const advice = generateHealthScoreAdvice(
          health,
          buildLeadTimes(scope),
          buildChannelStats(scope)
        );
        return { position, config, health, advice };
      }),
    [positions, applicants, healthScoreConfigs]
  );

  const hiredCount = filtered.filter((a) => a.status === '内定承諾').length;
  const activeCount = filtered.filter((a) => a.status === '進行中').length;
  const dropoutCount = filtered.filter((a) => a.status === '離脱').length;

  const handleCsvLoad = (text: string) => {
    const { applicants: parsed, errors } = parseApplicantsCsv(text);
    setApplicants(parsed);
    saveApplicants(parsed);
    setCsvErrors(errors);
    setSelectedPosition('全ポジション');
  };

  const handleClearApplicants = () => {
    setApplicants([]);
    setCsvErrors([]);
    clearApplicants();
  };

  const handleTargetsChange = (next: PositionTarget[]) => {
    setTargets(next);
    saveTargets(next);
  };

  const handleHealthScoreConfigChange = (position: string, next: HealthScoreConfig) => {
    const updated = { ...healthScoreConfigs, [position]: next };
    setHealthScoreConfigs(updated);
    saveHealthScoreConfigs(updated);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <h1 className="text-lg font-bold text-slate-900">採用ダッシュボード</h1>
          <p className="text-xs text-slate-500">
            経営・現場マネージャー向け：ポジション別の採用進捗を可視化します
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <FileUpload
          onLoad={handleCsvLoad}
          onClear={handleClearApplicants}
          errors={csvErrors}
          count={applicants.length}
        />

        {applicants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            まずは応募者データのCSVを読み込んでください。サンプルCSVから試すこともできます。
          </div>
        ) : (
          <>
            <HiringSummaryHero data={targetProgress} />

            <PeriodFilter range={period} onChange={setPeriod} />

            <Section
              title="KPI設定（ポジション別・面談設定率ヘルススコア）"
              description="ポジションごとに目標採用人数・期間・各区間の遷移率を設定します"
            >
              <div className="space-y-3">
                {positions.map((position) => (
                  <KpiSettings
                    key={position}
                    position={position}
                    config={getHealthScoreConfigForPosition(healthScoreConfigs, position)}
                    onChange={(next) => handleHealthScoreConfigChange(position, next)}
                  />
                ))}
              </div>
            </Section>

            <div className="space-y-3">
              {healthScoreByPosition.map(({ position, health, advice }) => (
                <HealthScoreSignal key={position} position={position} health={health} advice={advice} />
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-500">ポジション:</span>
              {['全ポジション', ...positions].map((p) => (
                <button
                  key={p}
                  onClick={() => setSelectedPosition(p)}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    selectedPosition === p
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            <KpiCards
              kpis={[
                { label: '応募者数', value: String(filtered.length) },
                { label: '進行中', value: String(activeCount) },
                { label: '内定承諾（採用）', value: String(hiredCount) },
                { label: '離脱', value: String(dropoutCount) },
                {
                  label: '応募〜内定承諾 平均日数',
                  value: overallLeadTime !== null ? `${overallLeadTime}日` : '—',
                },
              ]}
            />

            <TargetSettings positions={positions} targets={targets} onChange={handleTargetsChange} />

            <Section
              title="ポジション別パイプライン（応募〜内定承諾）"
              description="各ステージの人数・直前ステージからの遷移率・応募者全体に対する到達率"
            >
              <PositionPipelineTable data={positionPipelines} />
            </Section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Section title="選考ステージ別人数（ファネル）" description="各ステージに到達した人数">
                <FunnelChartView data={funnel} />
              </Section>
              <Section title="月別応募数推移">
                <MonthlyTrendChart data={monthlyTrend} />
              </Section>
            </div>

            <Section title="選考スピード（リードタイム）" description="隣接ステージ間の平均通過日数">
              <LeadTimeChart data={leadTimes} />
            </Section>

            <Section
              title="流入経路（チャネル）別分析"
              description="チャネルごとの応募数シェア・通過率・コスト・採用単価"
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChannelChart data={channelStats} />
                <ChannelTable data={channelStats} />
              </div>
            </Section>

            <Section
              title="面接官の甘辛分析"
              description="同ステージの全体平均と比較した各面接官の評価傾向"
            >
              <InterviewerTable rows={interviewerRows} stageAverages={stageAverages} />
            </Section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
