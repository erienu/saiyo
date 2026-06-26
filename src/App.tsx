import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FileUpload from './components/FileUpload';
import PasswordGate from './components/PasswordGate';
import KpiCards from './components/KpiCards';
import Section from './components/Section';
import MonthlyTrendChart from './components/MonthlyTrendChart';
import LeadTimeChart from './components/LeadTimeChart';
import ChannelTable from './components/ChannelTable';
import ChannelChart from './components/ChannelChart';
import ChannelCostSettings from './components/ChannelCostSettings';
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
  buildHealthScore,
  buildInterviewerStats,
  buildLeadTimes,
  buildMonthlyTrend,
  buildOverallLeadTime,
  buildPositionPipelines,
  buildTargetProgress,
  filterByPeriod,
  getChannels,
  getPositions,
} from './lib/metrics';
import {
  clearApplicants,
  getHealthScoreConfigForPosition,
  loadApplicants,
  loadChannelCosts,
  loadHealthScoreConfigs,
  loadTargets,
  saveApplicants,
  saveChannelCosts,
  saveHealthScoreConfigs,
  saveTargets,
  type HealthScoreConfigsByPosition,
} from './lib/storage';
import { fetchDashboardState, saveDashboardState, UnauthorizedError } from './lib/syncApi';
import type { Applicant, DateRange, HealthScoreConfig, PositionTarget } from './types';

const PASSWORD_KEY = 'recruitment-dashboard:password';

function App() {
  const [applicants, setApplicants] = useState<Applicant[]>(() => loadApplicants());
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [targets, setTargets] = useState<PositionTarget[]>(loadTargets());
  const [healthScoreConfigs, setHealthScoreConfigs] = useState<HealthScoreConfigsByPosition>(
    loadHealthScoreConfigs()
  );
  const [channelCosts, setChannelCosts] = useState<Record<string, number>>(loadChannelCosts());
  const [selectedPosition, setSelectedPosition] = useState<string>('全ポジション');
  const [period, setPeriod] = useState<DateRange>(() => currentMonthRange());

  const [authStatus, setAuthStatus] = useState<'checking' | 'locked' | 'unlocked'>('checking');
  const [authError, setAuthError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const passwordRef = useRef<string | null>(null);

  const syncToServer = useCallback(
    (next: {
      applicants?: Applicant[];
      targets?: PositionTarget[];
      healthScoreConfigs?: HealthScoreConfigsByPosition;
      channelCosts?: Record<string, number>;
    }) => {
      const password = passwordRef.current;
      if (!password) return;
      saveDashboardState(password, {
        applicants: next.applicants ?? applicants,
        targets: next.targets ?? targets,
        healthScoreConfigs: next.healthScoreConfigs ?? healthScoreConfigs,
        channelCosts: next.channelCosts ?? channelCosts,
      }).catch((err) => {
        setSyncError(
          err instanceof UnauthorizedError
            ? 'パスワードが無効になりました。再読み込みしてください。'
            : '他のデバイスへの同期に失敗しました（このデバイスには保存されています）。'
        );
      });
    },
    [applicants, targets, healthScoreConfigs, channelCosts]
  );

  const unlock = useCallback(async (password: string) => {
    setAuthError(null);
    setAuthStatus('checking');
    try {
      const state = await fetchDashboardState(password);
      passwordRef.current = password;
      localStorage.setItem(PASSWORD_KEY, password);
      // サーバー側のフィールドが空(未保存)の場合は、このデバイスにある既存データを失わないよう
      // フィールドごとに「空でない方」を採用する。採用した結果は最後にサーバーへ書き戻して整合させる。
      const nextApplicants =
        state && (state.applicants as Applicant[])?.length > 0 ? (state.applicants as Applicant[]) : applicants;
      const nextTargets =
        state && (state.targets as PositionTarget[])?.length > 0 ? (state.targets as PositionTarget[]) : targets;
      const nextConfigs =
        state && Object.keys(state.healthScoreConfigs ?? {}).length > 0
          ? (state.healthScoreConfigs as HealthScoreConfigsByPosition)
          : healthScoreConfigs;
      const nextChannelCosts =
        state && Object.keys(state.channelCosts ?? {}).length > 0
          ? (state.channelCosts as Record<string, number>)
          : channelCosts;

      setApplicants(nextApplicants);
      setTargets(nextTargets);
      setHealthScoreConfigs(nextConfigs);
      setChannelCosts(nextChannelCosts);
      saveApplicants(nextApplicants);
      saveTargets(nextTargets);
      saveHealthScoreConfigs(nextConfigs);
      saveChannelCosts(nextChannelCosts);

      // 解決した状態をサーバーにも書き戻し、他デバイスとの不整合を解消する。
      saveDashboardState(password, {
        applicants: nextApplicants,
        targets: nextTargets,
        healthScoreConfigs: nextConfigs,
        channelCosts: nextChannelCosts,
      }).catch(() => {
        /* 初回同期の書き戻し失敗は致命的ではないため無視する */
      });

      setAuthStatus('unlocked');
    } catch (err) {
      localStorage.removeItem(PASSWORD_KEY);
      passwordRef.current = null;
      setAuthStatus('locked');
      setAuthError(
        err instanceof UnauthorizedError ? 'パスワードが正しくありません。' : 'サーバーに接続できませんでした。'
      );
    }
    // unlock時点のapplicants/targets/healthScoreConfigs/channelCostsはローカル初期値の参照で十分なため依存配列に含めない。
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(PASSWORD_KEY);
    if (saved) {
      unlock(saved);
    } else {
      setAuthStatus('locked');
    }
  }, []);

  const positions = useMemo(() => getPositions(applicants), [applicants]);

  const periodFiltered = useMemo(() => filterByPeriod(applicants, period), [applicants, period]);

  const filtered = useMemo(
    () =>
      selectedPosition === '全ポジション'
        ? periodFiltered
        : periodFiltered.filter((a) => a.position === selectedPosition),
    [periodFiltered, selectedPosition]
  );

  const targetProgress = useMemo(() => buildTargetProgress(applicants, targets), [applicants, targets]);
  const leadTimes = useMemo(() => buildLeadTimes(filtered), [filtered]);
  const overallLeadTime = useMemo(() => buildOverallLeadTime(filtered), [filtered]);
  const channels = useMemo(() => getChannels(applicants), [applicants]);
  const channelStats = useMemo(
    () => buildChannelStats(filtered, channelCosts),
    [filtered, channelCosts]
  );
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

  const handleCsvLoad = (text: string) => {
    const { applicants: parsed, errors } = parseApplicantsCsv(text);
    setApplicants(parsed);
    saveApplicants(parsed);
    setCsvErrors(errors);
    setSelectedPosition('全ポジション');
    syncToServer({ applicants: parsed });
  };

  const handleClearApplicants = () => {
    setApplicants([]);
    setCsvErrors([]);
    clearApplicants();
    syncToServer({ applicants: [] });
  };

  const handleTargetsChange = (next: PositionTarget[]) => {
    setTargets(next);
    saveTargets(next);
    syncToServer({ targets: next });
  };

  const handleHealthScoreConfigChange = (position: string, next: HealthScoreConfig) => {
    const updated = { ...healthScoreConfigs, [position]: next };
    setHealthScoreConfigs(updated);
    saveHealthScoreConfigs(updated);
    syncToServer({ healthScoreConfigs: updated });
  };

  const handleChannelCostsChange = (next: Record<string, number>) => {
    setChannelCosts(next);
    saveChannelCosts(next);
    syncToServer({ channelCosts: next });
  };

  if (authStatus !== 'unlocked') {
    return <PasswordGate onSubmit={unlock} error={authError} checking={authStatus === 'checking'} />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-slate-900">採用ダッシュボード</h1>
              <p className="text-xs text-slate-500">
                経営・現場マネージャー向け：ポジション別の採用進捗を可視化します
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.removeItem(PASSWORD_KEY);
                passwordRef.current = null;
                setAuthStatus('locked');
              }}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              ロック
            </button>
          </div>
          {syncError && <p className="mt-1 text-xs text-amber-600">{syncError}</p>}
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

            <Section title="月別応募数推移">
              <MonthlyTrendChart data={monthlyTrend} />
            </Section>

            <Section
              title="選考スピード（リードタイム）"
              description="隣接ステージ間の平均通過日数（カジュアル面談は除く）"
            >
              <LeadTimeChart data={leadTimes} />
            </Section>

            <ChannelCostSettings
              channels={channels}
              costs={channelCosts}
              onChange={handleChannelCostsChange}
            />

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

            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                以下はヘルススコアの計算に使う詳細設定です。通常は変更不要です。
              </p>
              {positions.map((position) => (
                <KpiSettings
                  key={position}
                  position={position}
                  config={getHealthScoreConfigForPosition(healthScoreConfigs, position)}
                  onChange={(next) => handleHealthScoreConfigChange(position, next)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
