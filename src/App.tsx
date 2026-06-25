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
import TargetProgressCards from './components/TargetProgressCards';
import { parseApplicantsCsv } from './lib/csv';
import {
  buildChannelStats,
  buildFunnel,
  buildInterviewerStats,
  buildLeadTimes,
  buildMonthlyTrend,
  buildOverallLeadTime,
  buildTargetProgress,
  getPositions,
} from './lib/metrics';
import { loadTargets, saveTargets } from './lib/storage';
import type { Applicant, PositionTarget } from './types';

function App() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [targets, setTargets] = useState<PositionTarget[]>(loadTargets());
  const [selectedPosition, setSelectedPosition] = useState<string>('全ポジション');

  const positions = useMemo(() => getPositions(applicants), [applicants]);

  const filtered = useMemo(
    () =>
      selectedPosition === '全ポジション'
        ? applicants
        : applicants.filter((a) => a.position === selectedPosition),
    [applicants, selectedPosition]
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

  const hiredCount = filtered.filter((a) => a.status === '内定承諾').length;
  const activeCount = filtered.filter((a) => a.status === '進行中').length;
  const dropoutCount = filtered.filter((a) => a.status === '離脱').length;

  const handleCsvLoad = (text: string) => {
    const { applicants: parsed, errors } = parseApplicantsCsv(text);
    setApplicants(parsed);
    setCsvErrors(errors);
    setSelectedPosition('全ポジション');
  };

  const handleTargetsChange = (next: PositionTarget[]) => {
    setTargets(next);
    saveTargets(next);
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
        <FileUpload onLoad={handleCsvLoad} errors={csvErrors} count={applicants.length} />

        {applicants.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">
            まずは応募者データのCSVを読み込んでください。サンプルCSVから試すこともできます。
          </div>
        ) : (
          <>
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

            <Section title="採用目標と達成率" description="ポジションごとの目標人数に対する内定承諾数の進捗">
              <TargetProgressCards
                data={
                  selectedPosition === '全ポジション'
                    ? targetProgress
                    : targetProgress.filter((t) => t.position === selectedPosition)
                }
              />
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
              description="チャネルごとの応募数・通過率・コスト・採用単価"
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
